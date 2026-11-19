import logging
from typing import Optional, Dict, Any
import httpx

logger = logging.getLogger(__name__)

class TelegramBotAssistant:
    """
    Assistente Telegram para envio de alertas, relatórios e atendimento de comandos remotos.
    Substitui a integração de bot do Telegram do fluxo 'Monitor_entradas_saidas_grupos.json'.
    """
    def __init__(self, bot_token: Optional[str] = None, admin_chat_id: Optional[str] = None):
        self.bot_token = (bot_token or "").strip()
        self.admin_chat_id = str(admin_chat_id or "").strip()
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else ""

    async def send_message(self, text: str, chat_id: Optional[str] = None, parse_mode: str = "HTML") -> bool:
        """Envia mensagem para o chat de administração ou chat específico."""
        target_chat = chat_id or self.admin_chat_id
        if not self.bot_token or not target_chat:
            logger.debug("[TelegramBot] Token ou Chat ID ausente, mensagem não enviada.")
            return False

        payload = {
            "chat_id": target_chat,
            "text": text,
            "parse_mode": parse_mode,
            "disable_web_page_preview": True
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(f"{self.base_url}/sendMessage", json=payload)
                if resp.status_code == 200:
                    return True
                logger.warning(f"[TelegramBot] Erro ao enviar mensagem: {resp.status_code} - {resp.text}")
                return False
        except Exception as e:
            logger.error(f"[TelegramBot] Erro de rede: {e}")
            return False

    async def notify_sale(self, platform: str, product_name: str, commission: str):
        """Notifica uma nova venda de afiliado confirmada."""
        msg = (
            f"🎉 <b>Nova Venda Confirmada!</b>\n\n"
            f"🛒 Plataforma: <b>{platform}</b>\n"
            f"📦 Item: {product_name}\n"
            f"💰 Comissão: <b>{commission}</b>\n\n"
            f"🚀 <i>PardalFlow Automação</i>"
        )
        await self.send_message(msg)

    async def notify_daily_summary(self, summary_data: Dict[str, Any]):
        """Notifica o resumo diário (envios, entradas e saídas)."""
        entries = summary_data.get("entries", 0)
        exits = summary_data.get("exits", 0)
        offers_sent = summary_data.get("offers_sent", 0)
        clicks_shopee = summary_data.get("shopee_clicks", 0)

        msg = (
            f"📊 <b>Resumo Diário PardalFlow</b>\n\n"
            f"📤 Ofertas disparadas hoje: <b>{offers_sent}</b>\n"
            f"👥 Novos membros nos grupos: <b>+{entries}</b>\n"
            f"🚪 Saídas de membros: <b>-{exits}</b>\n"
            f"🎯 Cliques Shopee registrados: <b>{clicks_shopee}</b>\n\n"
            f"✅ Todos os sistemas operando normalmente."
        )
        await self.send_message(msg)
