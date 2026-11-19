import re
import json
import time
import hashlib
import unicodedata
import urllib.parse
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional, Callable
import httpx
import aiohttp

from app.core.config import settings

# Shorteners
RE_BOA_OFERTA = re.compile(r"https://boaoferta\.me/[^\s]+")
RE_OFERTOU = re.compile(r"https://ofertou\.ai/[^\s]+")

# Default regex patterns
DEFAULT_REGEX_SHOPEE = r"(?:https?://)?(?:www\.)?(?:shopee\.com|shopee\.com\.br|shope\.ee|shp\.ee|br\.shp\.ee|s\.shopee\.com\.br)/[^\s]+"
DEFAULT_REGEX_MERCADO_LIVRE = r"(?:https?://)?(?:www\.)?(?:mercadolivre\.com(?:\.br)?|mercado-livre\.com(?:\.br)?|meli\.la)/[^\s]+"
DEFAULT_REGEX_AMAZON = r"(?:https?://)?(?:www\.)?(?:amazon\.[a-z.]+|amzn\.to|amzlink\.to|link\.amazon)/[^\s]+"
DEFAULT_REGEX_MAGALU = r"(?:https?://)?(?:(?:www\.)?divulgador\.magalu\.com|magazineluiza\.onelink\.me|(?:(?:www|m)\.)?magazineluiza\.com\.br|(?:www\.)?magazinevoce\.com\.br)/[^\s]+"

class LinkConverterService:
    def __init__(
        self,
        user_settings: Optional[dict] = None,
        user_id: Optional[str] = None,
        shopee_subid: Optional[str] = None,
        ml_tag: Optional[str] = None,
        amazon_tag: Optional[str] = None,
        magalu_store: Optional[str] = None,
        **kwargs
    ):
        self.user_settings = user_settings or {}
        self.user_id = user_id or ""
        
        self.shopee_app_id = (
            self.user_settings.get("custom_shopee_app_id") or
            self.user_settings.get("shopee_app_id") or
            ""
        )
        self.shopee_secret = (
            self.user_settings.get("custom_shopee_secret") or
            self.user_settings.get("shopee_app_secret") or
            ""
        )
        self.magalu_enabled = self.user_settings.get("magalu_enabled", True)
        self.amazon_tag = amazon_tag or self.user_settings.get("amazon_tag") or ""
        self.magalu_store = magalu_store or self.user_settings.get("magalu_store") or ""
        ml_tags = self.user_settings.get("ml_tags") or []
        self.ml_default_tag = ml_tag or (ml_tags[0] if (ml_tags and len(ml_tags) > 0) else "")
        self.shopee_subid = shopee_subid or self.user_settings.get("shopee_subid") or "afiliado"

        shopee_pat = self.user_settings.get("regex_shopee", DEFAULT_REGEX_SHOPEE)
        ml_pat = self.user_settings.get("regex_mercado_livre", DEFAULT_REGEX_MERCADO_LIVRE)
        amazon_pat = self.user_settings.get("regex_amazon", DEFAULT_REGEX_AMAZON)
        magalu_pat = self.user_settings.get("regex_magalu", DEFAULT_REGEX_MAGALU)

        self.re_shopee = re.compile(shopee_pat)
        self.re_ml = re.compile(ml_pat)
        self.re_amazon = re.compile(amazon_pat)
        self.re_magalu = re.compile(magalu_pat)
        self.re_any = re.compile(f"(?:{amazon_pat})|(?:{ml_pat})|(?:{shopee_pat})|(?:{magalu_pat})")

    def _get_platform_cookie(self, platform: str) -> str:
        """Busca os cookies armazenados no banco estritamente para o usuário instanciado (sem vazamento)."""
        if not self.user_id:
            return ""
        try:
            from app.core.database import get_db
            db = get_db()
            if db:
                doc = db.platform_cookies.find_one({"user_id": self.user_id, "platform": platform})
                if doc and doc.get("cookies"):
                    return doc["cookies"].strip()
        except Exception:
            pass
        return ""

    def has_any_valid_link(self, text: str) -> bool:
        return bool(self.re_any.search(text))

    async def resolve_shorteners(self, text: str, log_func: Callable[[str], None] = print) -> str:
        """Resolves known URL shorteners like boaoferta.me and ofertou.ai."""
        new_text = text

        # boaoferta.me
        boaoferta_links = RE_BOA_OFERTA.findall(new_text)
        if boaoferta_links:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                for link in boaoferta_links:
                    try:
                        resp = await client.get(link, timeout=15.0)
                        final_url = str(resp.url)
                        if final_url and final_url != link:
                            new_text = new_text.replace(link, final_url)
                            log_func(f"✅ Resolvido boaoferta.me: {link} -> {final_url}")
                    except Exception as e:
                        log_func(f"⚠️ Erro ao resolver boaoferta.me ({link}): {e}")

        # ofertou.ai
        ofertou_links = RE_OFERTOU.findall(new_text)
        if ofertou_links:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                for link in ofertou_links:
                    try:
                        resp = await client.get(link, timeout=15.0)
                        final_url = str(resp.url)
                        if final_url and final_url != link:
                            new_text = new_text.replace(link, final_url)
                            log_func(f"✅ Resolvido ofertou.ai: {link} -> {final_url}")
                    except Exception as e:
                        log_func(f"⚠️ Erro ao resolver ofertou.ai ({link}): {e}")

        return new_text

    # --- Shopee Helpers ---
    async def _resolve_shopee_short(self, url: str) -> str:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        try:
            async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=10.0) as client:
                resp = await client.get(url)
                return str(resp.url)
        except Exception:
            try:
                async with aiohttp.ClientSession(headers=headers) as session:
                    async with session.get(url, allow_redirects=True, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                        return str(resp.url)
            except Exception:
                return url

    def _extract_shopee_ids(self, url: str) -> tuple[Optional[str], Optional[str]]:
        if not url:
            return None, None
            
        # Pattern 1: Title-i.123456789.987654321
        m_i = re.search(r"-i\.(\d+)\.(\d+)", url)
        if m_i:
            return m_i.group(1), m_i.group(2)

        # Pattern 2: /(?:product|opaanlp)/123456789/987654321
        m_slash = re.search(r"/(?:product|opaanlp)/(\d{5,20})/(\d{5,20})", url)
        if m_slash:
            return m_slash.group(1), m_slash.group(2)

        # Pattern 3: generic /(\d{6,20})/(\d{6,20})
        m_gen = re.search(r"/(\d{6,20})/(\d{6,20})", url)
        if m_gen:
            return m_gen.group(1), m_gen.group(2)

        # Pattern 4: query params ?shop_id=...&item_id=... or ?shopId=...&itemId=...
        m_qs_shop = re.search(r"[?&](?:shop_id|shopId)=(\d+)", url)
        m_qs_item = re.search(r"[?&](?:item_id|itemId)=(\d+)", url)
        if m_qs_shop and m_qs_item:
            return m_qs_shop.group(1), m_qs_item.group(1)

        return None, None

    def _clean_name_for_subid(self, text: str) -> str:
        if not text:
            return ""
        text = unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8').lower()
        words = text.split()[:3]
        processed = [re.sub(r'[^a-z0-9]', '', w) for w in words]
        return "".join(processed)

    async def _get_shopee_product_offer(self, item_id: str, shop_id: str):
        query = f"query {{ productOfferV2(itemId: {item_id}, shopId: {shop_id}) {{ nodes {{ productName }} }} }}"
        payload = json.dumps({"query": query}, separators=(",", ":"))
        timestamp = str(int(time.time()))
        signature_raw = self.shopee_app_id + timestamp + payload + self.shopee_secret
        signature = hashlib.sha256(signature_raw.encode()).hexdigest()

        headers = {
            "Authorization": f"SHA256 Credential={self.shopee_app_id}, Timestamp={timestamp}, Signature={signature}",
            "Content-Type": "application/json"
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://open-api.affiliate.shopee.com.br/graphql",
                    data=payload,
                    headers=headers,
                    timeout=15
                ) as resp:
                    return await resp.json()
        except Exception:
            return {}

    async def convert_shopee(self, text: str, subid_override: Optional[str] = None, log_func: Callable[[str], None] = print) -> tuple[str, bool]:
        """Converts Shopee links using the official GraphQL Affiliate API with canonical URL resolution."""
        found_links = self.re_shopee.findall(text)
        if not found_links:
            return text, True

        if not self.shopee_app_id or not self.shopee_secret:
            log_func("⚠️ Credenciais da Shopee (App ID / Secret) não configuradas para este usuário em Configurações > Credenciais Afiliados.")
            return text, False

        new_text = text
        success = True
        chosen_subid = subid_override or self.shopee_subid or "afiliado"

        for link in found_links:
            try:
                sub_id_list = [chosen_subid]
                
                # Timestamp SubId (DDMMHHmm)
                try:
                    now_br = datetime.now(ZoneInfo("America/Sao_Paulo"))
                    sub_id_list.append(now_br.strftime("%d%m%H%M"))
                except Exception:
                    pass

                # Resolve shortlink and extract product IDs
                is_shortlink = any(short in link for short in ["s.shopee.com.br", "shope.ee", "shp.ee", "br.shp.ee"])
                final_url = link
                if is_shortlink:
                    final_url = await self._resolve_shopee_short(link)

                shop_id, item_id = self._extract_shopee_ids(final_url)
                if not (shop_id and item_id):
                    shop_id, item_id = self._extract_shopee_ids(link)

                # Fetch product name for SubId if product IDs are available
                if shop_id and item_id:
                    try:
                        data = await self._get_shopee_product_offer(item_id, shop_id)
                        nodes = data.get("data", {}).get("productOfferV2", {}).get("nodes", [])
                        if nodes and "productName" in nodes[0]:
                            prod_sub = self._clean_name_for_subid(nodes[0]["productName"])
                            if prod_sub:
                                sub_id_list.append(prod_sub)
                    except Exception as e:
                        log_func(f"⚠️ Não foi possível extrair subId de produto Shopee: {e}")

                # Determine best canonical originUrl for Shopee Open API
                if shop_id and item_id:
                    target_origin = f"https://shopee.com.br/product/{shop_id}/{item_id}"
                elif "shopee.com.br" in final_url and not any(k in final_url for k in ["s.shopee.com.br", "shope.ee"]):
                    clean_url = final_url.split("?")[0]
                    target_origin = clean_url if clean_url.startswith("http") else final_url
                else:
                    target_origin = final_url or link

                sub_ids_json = json.dumps(sub_id_list)
                query = {
                    "query": (
                        'mutation { '
                        f'generateShortLink(input: {{ originUrl: "{target_origin}", subIds: {sub_ids_json} }}) '
                        '{ shortLink } }'
                    )
                }
                payload_str = json.dumps(query, separators=(',', ':'))
                timestamp = str(int(time.time()))
                sig_raw = self.shopee_app_id + timestamp + payload_str + self.shopee_secret
                signature = hashlib.sha256(sig_raw.encode("utf-8")).hexdigest()

                headers = {
                    "Authorization": f"SHA256 Credential={self.shopee_app_id}, Timestamp={timestamp}, Signature={signature}",
                    "Content-Type": "application/json",
                }

                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        "https://open-api.affiliate.shopee.com.br/graphql",
                        headers=headers,
                        data=payload_str,
                        timeout=20
                    ) as resp:
                        res_data = await resp.json()

                short_link = res_data.get("data", {}).get("generateShortLink", {}).get("shortLink")
                if short_link:
                    new_text = new_text.replace(link, short_link)
                    log_func(f"✅ Shopee link convertido: {short_link}")
                else:
                    err_msg = ""
                    if "errors" in res_data and res_data["errors"]:
                        err_code = res_data["errors"][0].get("extensions", {}).get("code")
                        err_raw = res_data["errors"][0].get("message", "")
                        if err_code == 11001 or "invalid origin url" in err_raw.lower():
                            err_msg = "código 11001: URL de origem inválida ou produto indisponível na Shopee"
                        else:
                            err_msg = f"{err_code}: {err_raw}"
                    else:
                        err_msg = str(res_data)

                    new_text = new_text.replace(link, f"`{link} (⚠️ Falha Shopee: {err_msg})`")
                    log_func(f"⚠️ Shopee API retornou erro para {link}: {err_msg}")
                    success = False

            except Exception as e:
                new_text = new_text.replace(link, f"`{link} (⚠️ Erro ao converter)`")
                log_func(f"⚠️ Erro ao converter Shopee: {e}")
                success = False

        return new_text, success

    async def convert_mercadolivre(self, text: str, tag: Optional[str] = None, log_func: Callable[[str], None] = print) -> tuple[str, bool]:
        """
        Converte links do Mercado Livre de forma 100% nativa.
        Resolve encurtadores (meli.la, sec, social) e gera link de afiliado via API oficial do ML
        utilizando os cookies armazenados no banco. Possui fallback gracioso.
        """
        links = self.re_ml.findall(text)
        if not links:
            return text, True

        new_text = text
        success = True
        chosen_tag = tag or self.ml_default_tag
        if not chosen_tag:
            log_func("⚠️ Tag de afiliado do Mercado Livre não configurada nas suas configurações de usuário.")
            return text, False
        cookies = self._get_platform_cookie("mercadolivre")

        headers_desktop = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
        }

        async with httpx.AsyncClient(headers=headers_desktop, follow_redirects=True, timeout=20.0) as client:
            for link in links:
                try:
                    full_link = link if link.startswith("http") else f"https://{link}"
                    
                    # Passo 1: Desencurta link intermediário (meli.la, sec, social)
                    resolved_url = full_link
                    if any(s in full_link for s in ["meli.la", "/sec/", "/social/", "click1"]):
                        try:
                            resp = await client.get(full_link)
                            resolved_url = str(resp.url)
                        except Exception as e:
                            log_func(f"⚠️ Aviso ao resolver redirecionamento ML ({link}): {e}")

                    # Limpa parâmetros excessivos de rastreio mantendo a URL canônica do produto
                    clean_ml_url = resolved_url.split("?")[0]
                    if not clean_ml_url.startswith("http"):
                        clean_ml_url = resolved_url

                    # Passo 2: Tentativa Nativa via API Mercado Livre Afiliados (usando cookies)
                    short_url = None
                    if cookies:
                        try:
                            # Extrai csrf token se presente nos cookies
                            csrf_token = ""
                            for part in cookies.split(";"):
                                if "_csrf" in part or "csrf" in part:
                                    csrf_token = part.split("=")[-1].strip()

                            api_headers = {
                                "User-Agent": headers_desktop["User-Agent"],
                                "Cookie": cookies,
                                "Content-Type": "application/json",
                                "Origin": "https://www.mercadolivre.com.br",
                                "Referer": "https://www.mercadolivre.com.br/affiliates/link-builder"
                            }
                            if csrf_token:
                                api_headers["x-csrf-token"] = csrf_token

                            payload = {
                                "urls": [clean_ml_url],
                                "tag": chosen_tag
                            }
                            resp_api = await client.post(
                                "https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink",
                                headers=api_headers,
                                json=payload,
                                timeout=15.0
                            )
                            if resp_api.status_code == 200:
                                res_json = resp_api.json()
                                urls_out = res_json.get("urls", [])
                                if urls_out and urls_out[0].get("short_url"):
                                    short_url = urls_out[0]["short_url"]
                                    log_func(f"✅ Mercado Livre convertido via API Nativa: {short_url}")
                        except Exception as ex_nat:
                            log_func(f"⚠️ Tentativa nativa ML API falhou: {ex_nat}")

                    # Passo 3: Geração de link com tag de afiliado (Canônica oficial)
                    if not short_url:
                        sep = "&" if "?" in clean_ml_url else "?"
                        short_url = f"{clean_ml_url}{sep}matt_tool={chosen_tag}"
                        log_func(f"ℹ️ Mercado Livre link formatado com tag canônica: {short_url}")

                    if short_url:
                        new_text = new_text.replace(link, short_url)
                    else:
                        new_text = new_text.replace(link, f"`{link} (❌ Erro ao converter)`")
                        success = False

                except Exception as e:
                    new_text = new_text.replace(link, f"`{link} (❌ Erro ao converter)`")
                    log_func(f"❌ Erro conversão ML: {e}")
                    success = False

        return new_text, success

    async def convert_amazon(self, text: str, tag_override: Optional[str] = None, log_func: Callable[[str], None] = print) -> tuple[str, bool]:
        """
        Converte links da Amazon de forma 100% nativa.
        Resolve encurtadores (amzn.to, link.amazon, a.co), extrai o código ASIN/canonical URL,
        aplica a tag de afiliado e tenta gerar short link pelo SiteStripe se houver cookies.
        Suporta tag_override por grupo.
        """
        links = self.re_amazon.findall(text)
        if not links:
            return text, True

        new_text = text
        success = True
        tag = tag_override or self.amazon_tag
        if not tag:
            log_func("⚠️ Tag de afiliado da Amazon (Store ID) não configurada nas suas configurações de usuário ou grupo.")
            return text, False
        cookies = self._get_platform_cookie("amazon")

        headers_desktop = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        async with httpx.AsyncClient(headers=headers_desktop, follow_redirects=True, timeout=20.0) as client:
            for link in links:
                try:
                    full_link = link if link.startswith("http") else f"https://{link}"

                    # Passo 1: Segue redirecionamentos (amzn.to -> amazon.com.br)
                    canonical_url = full_link
                    if any(s in full_link for s in ["amzn.to", "amzlink.to", "link.amazon", "a.co"]):
                        try:
                            resp = await client.get(full_link)
                            canonical_url = str(resp.url)
                        except Exception as e:
                            log_func(f"⚠️ Aviso ao resolver redirecionamento Amazon ({link}): {e}")

                    # Passo 2: Extrai ASIN do produto
                    asin_match = re.search(r"/(?:dp|gp/product|d|gp/aw/d)/([A-Z0-9]{10})", canonical_url)
                    short_link = None

                    if asin_match:
                        asin = asin_match.group(1)
                        clean_amazon_url = f"https://www.amazon.com.br/dp/{asin}?tag={tag}"
                    else:
                        clean_base = canonical_url.split("?")[0]
                        clean_amazon_url = f"{clean_base}?tag={tag}"

                    # Passo 3: Tentativa de gerar short link via SiteStripe com cookies de associado
                    if cookies:
                        try:
                            stripe_headers = {
                                "User-Agent": headers_desktop["User-Agent"],
                                "Cookie": cookies,
                                "Referer": "https://www.amazon.com.br/"
                            }
                            stripe_api_url = f"https://affiliate-program.amazon.com.br/home/tools/sitestripe/shorturl?url={urllib.parse.quote(clean_amazon_url)}"
                            resp_stripe = await client.get(stripe_api_url, headers=stripe_headers, timeout=10.0)
                            if resp_stripe.status_code == 200:
                                res_st = resp_stripe.json()
                                if res_st.get("ok") and res_st.get("shortUrl"):
                                    short_link = res_st["shortUrl"]
                                    log_func(f"✅ Amazon encurtado via SiteStripe Nativo: {short_link}")
                        except Exception as ex_st:
                            log_func(f"ℹ️ SiteStripe Amazon não disponível: {ex_st}")

                    # Passo 4: Fallback para URL limpa com tag de afiliado oficial (100% válida e canônica)
                    if not short_link:
                        short_link = clean_amazon_url
                        log_func(f"✅ Amazon link canônico com tag gerado: {short_link}")

                    new_text = new_text.replace(link, short_link)

                except Exception as e:
                    new_text = new_text.replace(link, f"`{link} (❌ Erro ao converter)`")
                    log_func(f"❌ Erro conversão Amazon: {e}")
                    success = False

        return new_text, success

    async def convert_magalu(self, text: str, store_override: Optional[str] = None, log_func: Callable[[str], None] = print) -> tuple[str, bool]:
        """
        Converte links do Magazine Luiza de forma 100% nativa via API Magazine Você onelink.
        Suporta store_override por grupo.
        """
        if not self.magalu_enabled:
            return text, True

        links = self.re_magalu.findall(text)
        if not links:
            return text, True

        new_text = text
        success = True
        store = store_override or self.magalu_store
        if not store:
            log_func("⚠️ Nome da loja Magazine Você (Magalu) não configurado nas suas configurações de usuário ou grupo.")
            return text, False

        headers_desktop = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(headers=headers_desktop, follow_redirects=True, timeout=20.0) as client:
            for link in links:
                try:
                    full_link = link if link.startswith("http") else f"https://{link}"

                    # Desencurta
                    resolved_url = full_link
                    if "onelink.me" in full_link or "divulgador.magalu.com" in full_link:
                        try:
                            resp = await client.get(full_link)
                            resolved_url = str(resp.url)
                        except Exception:
                            pass

                    clean_magalu_url = resolved_url.split("?")[0]
                    short_link = None

                    # Tentativa 1: API Magazine Você Onelink
                    try:
                        onelink_api = "https://www.magazinevoce.com.br/azion-rochelle-proxy/v1/shortenlink/onelink"
                        resp_onelink = await client.post(
                            onelink_api,
                            json={"url": clean_magalu_url, "magazine": store},
                            timeout=15.0
                        )
                        if resp_onelink.status_code == 200:
                            data = resp_onelink.json()
                            short_link = data.get("short_link") or data.get("shortUrl")
                            if short_link:
                                log_func(f"✅ Magalu convertido via API Nativa: {short_link}")
                    except Exception as ex_onelink:
                        log_func(f"ℹ️ Tentativa nativa Magalu onelink: {ex_onelink}")

                    # Tentativa 2: Formatação da URL canônica da vitrine Magazine Você
                    if not short_link:
                        # Extrai código do produto /p/XXXXX
                        p_match = re.search(r"/p/([a-zA-Z0-9]+)", clean_magalu_url)
                        if p_match:
                            pid = p_match.group(1)
                            short_link = f"https://www.magazinevoce.com.br/{store}/p/{pid}/"
                        else:
                            short_link = f"https://www.magazinevoce.com.br/{store}/"
                        log_func(f"ℹ️ Magalu link formatado com vitrine: {short_link}")

                    new_text = new_text.replace(link, short_link)

                except Exception as e:
                    new_text = new_text.replace(link, f"`{link} (❌ Erro ao converter)`")
                    log_func(f"❌ Erro conversão Magalu: {e}")
                    success = False

        return new_text, success

    async def convert_all_links(
        self,
        text: str,
        ml_tag: Optional[str] = None,
        shopee_subid: Optional[str] = None,
        amazon_tag: Optional[str] = None,
        magalu_store: Optional[str] = None,
        log_func: Callable[[str], None] = print
    ) -> tuple[str, bool]:
        """Runs the complete conversion pipeline across all platforms with optional group-specific tag overrides."""
        # Step 1: Resolve shorteners
        resolved_text = await self.resolve_shorteners(text, log_func)

        # Step 2: Convert Shopee
        t_shopee, ok_shopee = await self.convert_shopee(resolved_text, subid_override=shopee_subid, log_func=log_func)

        # Step 3: Convert Mercado Livre
        t_ml, ok_ml = await self.convert_mercadolivre(t_shopee, tag=ml_tag, log_func=log_func)

        # Step 4: Convert Amazon
        t_amazon, ok_amazon = await self.convert_amazon(t_ml, tag_override=amazon_tag, log_func=log_func)

        # Step 5: Convert Magalu
        t_magalu, ok_magalu = await self.convert_magalu(t_amazon, store_override=magalu_store, log_func=log_func)

        overall_ok = ok_shopee and ok_ml and ok_amazon and ok_magalu
        return t_magalu, overall_ok

# Alias para compatibilidade
LinkConverter = LinkConverterService
