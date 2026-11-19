import time
import json
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import httpx
import aiohttp

from app.core.database import get_db

logger = logging.getLogger(__name__)

class AffiliateAnalyticsService:
    """
    Serviço nativo para relatórios e análises das plataformas de afiliados:
    - Relatórios de Cliques da Shopee (GraphQL)
    - Relatórios de Comissões da Shopee (GraphQL)
    - Monitoramento de Vendas e Comissões do Mercado Livre
    - Busca de Produtos com Alta Comissão na Shopee
    """
    def __init__(
        self,
        shopee_app_id: Optional[str] = None,
        shopee_secret: Optional[str] = None,
        user_id: Optional[str] = None
    ):
        self.shopee_app_id = shopee_app_id or ""
        self.shopee_secret = shopee_secret or ""
        self.user_id = user_id or ""

    def _get_platform_cookie(self, platform: str) -> str:
        if not self.user_id:
            return ""
        db = get_db()
        if db:
            doc = db.platform_cookies.find_one({"user_id": self.user_id, "platform": platform})
            if doc and doc.get("cookies"):
                return doc["cookies"].strip()
        return ""

    def _shopee_graphql_auth(self, query_payload: str) -> Dict[str, str]:
        timestamp = str(int(time.time()))
        sig_raw = self.shopee_app_id + timestamp + query_payload + self.shopee_secret
        signature = hashlib.sha256(sig_raw.encode("utf-8")).hexdigest()
        return {
            "Authorization": f"SHA256 Credential={self.shopee_app_id}, Timestamp={timestamp}, Signature={signature}",
            "Content-Type": "application/json"
        }

    async def get_shopee_clicks_report(self, days_back: int = 1) -> Dict[str, Any]:
        """
        Gera relatório diário de cliques da Shopee via GraphQL.
        Substitui o fluxo 'Relatório diário de cliques Shopee.json'.
        """
        if not self.shopee_app_id or not self.shopee_secret:
            return {"ok": False, "error": "Credenciais Shopee não configuradas"}

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days_back)
        
        query = {
            "query": """
                query {
                    clickReport(
                        scrollId: ""
                        limit: 50
                    ) {
                        nodes {
                            subId
                            clickTime
                            device
                        }
                    }
                }
            """
        }
        payload_str = json.dumps(query, separators=(',', ':'))
        headers = self._shopee_graphql_auth(payload_str)

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(
                    "https://open-api.affiliate.shopee.com.br/graphql",
                    headers=headers,
                    content=payload_str
                )
                if resp.status_code == 200:
                    data = resp.json()
                    nodes = data.get("data", {}).get("clickReport", {}).get("nodes", [])
                    total_clicks = len(nodes)
                    return {
                        "ok": True,
                        "date": end_date.strftime("%Y-%m-%d"),
                        "total_clicks": total_clicks,
                        "nodes": nodes[:50]
                    }
                return {"ok": False, "error": f"Shopee API retornou {resp.status_code}: {resp.text}"}
        except Exception as e:
            logger.error(f"[AffiliateAnalytics] Erro ao obter cliques Shopee: {e}")
            return {"ok": False, "error": str(e)}

    async def get_shopee_commission_report(self) -> Dict[str, Any]:
        """
        Gera relatório consolidado de conversões e comissões da Shopee via GraphQL.
        """
        if not self.shopee_app_id or not self.shopee_secret:
            return {"ok": False, "error": "Credenciais Shopee não configuradas"}

        query = {
            "query": """
                query {
                    conversionReport(
                        limit: 100
                    ) {
                        nodes {
                            purchaseTime
                            commissionRate
                            totalCommission
                            orderStatus
                            productName
                        }
                    }
                }
            """
        }
        payload_str = json.dumps(query, separators=(',', ':'))
        headers = self._shopee_graphql_auth(payload_str)

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(
                    "https://open-api.affiliate.shopee.com.br/graphql",
                    headers=headers,
                    content=payload_str
                )
                if resp.status_code == 200:
                    data = resp.json()
                    nodes = data.get("data", {}).get("conversionReport", {}).get("nodes", [])
                    total_orders = len(nodes)
                    total_commission = sum(float(n.get("totalCommission", 0) or 0) for n in nodes)
                    return {
                        "ok": True,
                        "total_orders": total_orders,
                        "total_commission": round(total_commission, 2),
                        "orders": nodes[:30]
                    }
                return {"ok": False, "error": f"Shopee API retornou {resp.status_code}"}
        except Exception as e:
            logger.error(f"[AffiliateAnalytics] Erro ao obter comissões Shopee: {e}")
            return {"ok": False, "error": str(e)}

    async def search_shopee_top_products(self, keyword: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        Busca produtos na Shopee com as melhores comissões por palavra-chave.
        Substitui o fluxo 'Sub_Shopee_BuscarProdutos.json'.
        """
        if not self.shopee_app_id or not self.shopee_secret:
            return []

        query = {
            "query": f"""
                query {{
                    productOfferV2(
                        keyword: "{keyword}",
                        page: 1,
                        limit: {limit}
                    ) {{
                        nodes {{
                            itemId
                            shopId
                            productName
                            price
                            commissionRate
                            commission
                            imageUrl
                            offerLink
                            productLink
                        }}
                    }}
                }}
            """
        }
        payload_str = json.dumps(query, separators=(',', ':'))
        headers = self._shopee_graphql_auth(payload_str)

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                resp = await client.post(
                    "https://open-api.affiliate.shopee.com.br/graphql",
                    headers=headers,
                    content=payload_str
                )
                if resp.status_code == 200:
                    data = resp.json()
                    nodes = data.get("data", {}).get("productOfferV2", {}).get("nodes", [])
                    # Ordena pelos produtos com maior comissão
                    nodes.sort(key=lambda x: float(x.get("commission", 0) or 0), reverse=True)
                    return nodes
        except Exception as e:
            logger.error(f"[AffiliateAnalytics] Erro ao buscar produtos Shopee ({keyword}): {e}")
        return []

    async def get_mercadolivre_sales_summary(self) -> Dict[str, Any]:
        """
        Consulta vendas recentes do Mercado Livre Afiliados usando os cookies da plataforma.
        """
        cookies = self._get_platform_cookie("mercadolivre")
        if not cookies:
            return {"ok": False, "error": "Cookies do Mercado Livre não configurados"}

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Cookie": cookies,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(headers=headers, timeout=20.0) as client:
                resp = await client.get(
                    "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/summary",
                    timeout=15.0
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {"ok": True, "data": data}
                return {"ok": False, "status": resp.status_code, "msg": "Cookies podem ter expirado"}
        except Exception as e:
            return {"ok": False, "error": str(e)}
