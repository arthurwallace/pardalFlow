from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.affiliate_analytics import AffiliateAnalyticsService

router = APIRouter(prefix="/reports", tags=["Relatórios & Métricas Afiliados"])

@router.get("/shopee/clicks")
async def get_shopee_clicks(days_back: int = Query(1), current_user: dict = Depends(get_current_user)):
    """Relatório diário de cliques da Shopee via GraphQL API."""
    db = get_db()
    cfg_doc = db.user_configs.find_one({"user_id": current_user["id"]}) if db else None
    cfg = cfg_doc.get("data", {}) if cfg_doc else {}

    shopee_app_id = cfg.get("shopee_app_id") or cfg.get("custom_shopee_app_id")
    shopee_secret = cfg.get("shopee_app_secret") or cfg.get("custom_shopee_secret")
    if not shopee_app_id or not shopee_secret:
        return {
            "ok": False,
            "error": "Credenciais particulares da Shopee (App ID / Secret) não configuradas para o seu usuário. Configure em 'Configurações' > 'Credenciais Afiliados'."
        }

    service = AffiliateAnalyticsService(
        shopee_app_id=shopee_app_id,
        shopee_secret=shopee_secret,
        user_id=current_user["id"]
    )
    return await service.get_shopee_clicks_report(days_back=days_back)

@router.get("/shopee/commissions")
async def get_shopee_commissions(current_user: dict = Depends(get_current_user)):
    """Relatório diário de conversões e comissões da Shopee via GraphQL API."""
    db = get_db()
    cfg_doc = db.user_configs.find_one({"user_id": current_user["id"]}) if db else None
    cfg = cfg_doc.get("data", {}) if cfg_doc else {}

    shopee_app_id = cfg.get("shopee_app_id") or cfg.get("custom_shopee_app_id")
    shopee_secret = cfg.get("shopee_app_secret") or cfg.get("custom_shopee_secret")
    if not shopee_app_id or not shopee_secret:
        return {
            "ok": False,
            "error": "Credenciais particulares da Shopee (App ID / Secret) não configuradas para o seu usuário. Configure em 'Configurações' > 'Credenciais Afiliados'."
        }

    service = AffiliateAnalyticsService(
        shopee_app_id=shopee_app_id,
        shopee_secret=shopee_secret,
        user_id=current_user["id"]
    )
    return await service.get_shopee_commission_report()

@router.get("/mercadolivre/sales")
async def get_ml_sales(current_user: dict = Depends(get_current_user)):
    """Consulta vendas e comissões do Mercado Livre Afiliados."""
    service = AffiliateAnalyticsService(user_id=current_user["id"])
    return await service.get_mercadolivre_sales_summary()

@router.get("/group-events")
async def get_group_events_summary(days: int = Query(7), current_user: dict = Depends(get_current_user)):
    """Retorna o histórico e o resumo de entradas e saídas de membros nos grupos de WhatsApp."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    since = datetime.now(timezone.utc) - timedelta(days=days)
    events = list(db.group_events.find({"user_id": current_user["id"]}))

    # Filtra por período e agrupa por grupo e por dia
    recent_events = [e for e in events if e.get("timestamp") and e["timestamp"] >= since]
    
    total_entries = sum(1 for e in recent_events if e.get("event_type") in ("join", "add"))
    total_exits = sum(1 for e in recent_events if e.get("event_type") in ("leave", "remove"))

    # Agrupamento por grupo
    by_group: Dict[str, Dict[str, Any]] = {}
    for ev in recent_events:
        gname = ev.get("group_name") or ev.get("group_id") or "Grupo Desconhecido"
        if gname not in by_group:
            by_group[gname] = {"group_name": gname, "entries": 0, "exits": 0, "net": 0}
        if ev.get("event_type") in ("join", "add"):
            by_group[gname]["entries"] += 1
            by_group[gname]["net"] += 1
        elif ev.get("event_type") in ("leave", "remove"):
            by_group[gname]["exits"] += 1
            by_group[gname]["net"] -= 1

    return {
        "period_days": days,
        "total_entries": total_entries,
        "total_exits": total_exits,
        "net_growth": total_entries - total_exits,
        "by_group": list(by_group.values()),
        "recent_events": recent_events[:100]
    }
