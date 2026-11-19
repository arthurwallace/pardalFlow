import asyncio
import logging
from datetime import datetime, timezone
import pytz

from app.core.database import get_db
from app.services.queue_manager import QueueManager
from app.services.affiliate_analytics import AffiliateAnalyticsService
from app.services.telegram_bot_service import TelegramBotAssistant

logger = logging.getLogger(__name__)
BRAZIL_TZ = pytz.timezone("America/Sao_Paulo")

class InternalScheduler:
    """
    Agendador interno nativo em background (loop asyncio):
    - Despacho da fila de ofertas e cupons a cada X segundos
    - Relatório diário de cliques da Shopee (12:00 BRT)
    - Relatório diário de comissões da Shopee (09:00 BRT)
    - Verificação de vendas do Mercado Livre a cada 30 min (08:00 - 23:00 BRT)
    - Resumo diário de entradas e saídas de membros (23:59 BRT)
    - Limpeza de filas antigas (03:00 BRT)
    """
    def __init__(self):
        self._running = False
        self._task: asyncio.Task | None = None
        self._last_shopee_clicks_date = ""
        self._last_shopee_comm_date = ""
        self._last_daily_summary_date = ""
        self._last_ml_check_minute = -1

    def start(self):
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._main_loop())
            logger.info("[Scheduler] Agendador interno nativo iniciado.")

    def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            logger.info("[Scheduler] Agendador interno nativo encerrado.")

    async def _main_loop(self):
        while self._running:
            try:
                db = get_db()
                if db:
                    # Executa isoladamente para CADA usuário ativo do sistema
                    active_users = list(db.users.find({"is_active": True}))
                    now_brt = datetime.now(BRAZIL_TZ)
                    today_str = now_brt.strftime("%Y-%m-%d")
                    current_hour = now_brt.hour
                    current_minute = now_brt.minute

                    for user in active_users:
                        user_id = user["id"]
                        user_cfg_doc = db.user_configs.find_one({"user_id": user_id})
                        cfg = user_cfg_doc.get("data", {}) if user_cfg_doc else {}

                        # 1. Processamento da Fila de Mensagens do Usuário (se ativado)
                        if cfg.get("auto_dispatch_enabled", True):
                            waha_url = cfg.get("waha_base_url") or "http://192.168.1.25:3000"
                            if "localhost" in waha_url or "127.0.0.1" in waha_url:
                                waha_url = "http://192.168.1.25:3000"
                            waha_key = cfg.get("waha_api_key") or "6f1186b6522246c1b0015b9117d56d05"
                            qm = QueueManager(user_id=user_id, waha_base_url=waha_url, waha_api_key=waha_key)
                            
                            # Tenta processar cupons (prioritários) ou ofertas
                            processed_coupon = await qm.process_next("cupons")
                            if not processed_coupon:
                                await qm.process_next("ofertas")

                        # 2. Tarefas Agendadas por Horário (Horário de Brasília) - Apenas se credenciais configuradas
                        tg_token = cfg.get("telegram_bot_token")
                        tg_chat = cfg.get("telegram_admin_chat_id")
                        shopee_id = cfg.get("shopee_app_id")
                        shopee_sec = cfg.get("shopee_app_secret")

                        tg_bot = TelegramBotAssistant(
                            bot_token=tg_token,
                            admin_chat_id=tg_chat
                        )
                        analytics_svc = AffiliateAnalyticsService(
                            shopee_app_id=shopee_id,
                            shopee_secret=shopee_sec,
                            user_id=user_id
                        )

                        # 2.1 Relatório de Comissões Shopee (09:00 BRT) - Estritamente se Shopee configurada
                        if current_hour == 9 and self._last_shopee_comm_date != today_str and shopee_id and shopee_sec:
                            report = await analytics_svc.get_shopee_commission_report()
                            if report.get("ok") and tg_token and tg_chat:
                                msg = (
                                    f"📈 <b>Relatório de Comissões Shopee (09:00)</b>\n\n"
                                    f"📦 Pedidos computados: <b>{report.get('total_orders')}</b>\n"
                                    f"💰 Total Comissões: <b>R$ {report.get('total_commission')}</b>"
                                )
                                await tg_bot.send_message(msg)

                        # 2.2 Relatório de Cliques Shopee (12:00 BRT) - Estritamente se Shopee configurada
                        if current_hour == 12 and self._last_shopee_clicks_date != today_str and shopee_id and shopee_sec:
                            clicks_rep = await analytics_svc.get_shopee_clicks_report(days_back=1)
                            if clicks_rep.get("ok") and tg_token and tg_chat:
                                msg = (
                                    f"🎯 <b>Relatório Diário de Cliques Shopee (12:00)</b>\n\n"
                                    f"🖱️ Cliques nas últimas 24h: <b>{clicks_rep.get('total_clicks')}</b>"
                                )
                                await tg_bot.send_message(msg)

                        # 2.3 Resumo Diário de Entradas/Saídas e Envios (23:59 BRT)
                        if current_hour == 23 and current_minute >= 58 and self._last_daily_summary_date != today_str:
                            start_day = now_brt.replace(hour=0, minute=0, second=0).astimezone(timezone.utc)
                            events = list(db.group_events.find({"user_id": user_id}))
                            entries = sum(1 for e in events if e.get("event_type") in ("join", "add") and e.get("timestamp") and e["timestamp"] >= start_day)
                            exits = sum(1 for e in events if e.get("event_type") in ("leave", "remove") and e.get("timestamp") and e["timestamp"] >= start_day)
                            
                            sent_count = db.sent_offers.count_documents({"user_id": user_id})
                            clicks_data = await analytics_svc.get_shopee_clicks_report(days_back=1) if (shopee_id and shopee_sec) else {}

                            if tg_token and tg_chat:
                                await tg_bot.notify_daily_summary({
                                    "entries": entries,
                                    "exits": exits,
                                    "offers_sent": sent_count,
                                    "shopee_clicks": clicks_data.get("total_clicks", 0) if clicks_data.get("ok") else 0
                                })

                    if current_hour == 9 and self._last_shopee_comm_date != today_str:
                        self._last_shopee_comm_date = today_str
                    if current_hour == 12 and self._last_shopee_clicks_date != today_str:
                        self._last_shopee_clicks_date = today_str
                    if current_hour == 23 and current_minute >= 58 and self._last_daily_summary_date != today_str:
                        self._last_daily_summary_date = today_str

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[Scheduler] Erro no loop de agendamento: {e}")

            # Intervalo entre iterações da fila (default 15s)
            await asyncio.sleep(15)

scheduler_instance = InternalScheduler()
