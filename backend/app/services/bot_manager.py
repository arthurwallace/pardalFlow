import asyncio
import threading
import os
import re
import uuid
import pytz
import shutil
from datetime import datetime, timezone
from collections import deque
from typing import Dict, Any, Optional, List
from telethon import TelegramClient, events

from app.core.config import settings
from app.core.database import get_db
from app.services.link_converter import LinkConverterService
from app.services.ai_formatter import AiFormatterService
from app.services.media_processor import MediaProcessorService
from app.services.dispatcher import DispatcherService

BRAZIL_TZ = pytz.timezone("America/Sao_Paulo")

def extract_product_title_and_price(text: str) -> tuple[str, Optional[str]]:
    """Extracts a readable product title and optional price from offer text."""
    if not text:
        return "Oferta sem título", None
    
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    title = "Oferta"
    price = None

    # Find price like R$ 99,90 or R$ 1.299,00 or 1299.99
    price_match = re.search(r"(?:Por:?\s*|R\$\s*)([\d.,]+)", text, re.IGNORECASE)
    if price_match:
        raw_val = price_match.group(1).strip()
        # Format strictly with dot for thousands and comma for decimals (pt-BR)
        try:
            if "," in raw_val and "." in raw_val:
                # If dot followed by 2 digits at end (US format: 1,299.90 -> 1.299,90)
                if re.search(r"\.\d{2}$", raw_val):
                    val = float(raw_val.replace(",", ""))
                    price = f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                else:
                    price = f"R$ {raw_val}"
            elif "." in raw_val and len(raw_val.split(".")[-1]) == 2:
                # 1299.90 -> 1.299,90
                val = float(raw_val)
                price = f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            elif raw_val.isdigit():
                # 1299 -> 1.299,00
                val = int(raw_val)
                price = f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
            else:
                price = f"R$ {raw_val}"
        except Exception:
            price = f"R$ {raw_val}"

    # Identify best candidate for title (line without URLs or discount buzzwords)
    for line in lines:
        cleaned = re.sub(r"[*~_`🔥⚡🚨💥🎟️🛒📦🚚]", "", line).strip()
        if not cleaned:
            continue
        if re.search(r"https?://", cleaned):
            continue
        if re.search(r"^(de:|por:|cupom:|compre|link:|frete)", cleaned, re.IGNORECASE):
            continue
        if len(cleaned) > 5:
            title = cleaned[:80]
            break

    if title == "Oferta" and lines:
        title = lines[0][:80]

    return title, price

class UserBotInstance:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.client: Optional[TelegramClient] = None
        self.thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.logs = deque(maxlen=2000)
        self.subscribers: List[asyncio.Queue] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.metrics = {
            "detected": 0,
            "sent": 0,
            "ai_errors": 0,
            "conversion_errors": 0,
            "latencies": []
        }
        self.is_running = False

    def log(self, msg: str):
        ts = datetime.now(BRAZIL_TZ).strftime("%Y-%m-%d %H:%M:%S")
        entry = f"[{ts}] {msg}"
        self.logs.appendleft(entry)
        print(f"[{self.user_id[:8]}] {entry}")
        
        # Broadcast to active SSE queues
        dead_subscribers = []
        for q in self.subscribers:
            try:
                q.put_nowait(entry)
            except Exception:
                dead_subscribers.append(q)
        for d in dead_subscribers:
            if d in self.subscribers:
                self.subscribers.remove(d)

        try:
            db = get_db()
            if db is not None:
                db.logs.insert_one({
                    "user_id": self.user_id,
                    "timestamp": datetime.now(timezone.utc),
                    "message": entry
                })
        except Exception:
            pass

    def add_subscriber(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        self.subscribers.append(q)
        return q

    def remove_subscriber(self, q: asyncio.Queue):
        if q in self.subscribers:
            self.subscribers.remove(q)

    def get_user_config(self) -> dict:
        db = get_db()
        if db is not None:
            doc = db.user_configs.find_one({"user_id": self.user_id})
            if doc and "data" in doc:
                return doc["data"]
        return {}

    def get_user_channels(self) -> List[dict]:
        db = get_db()
        if db is not None:
            return list(db.channels.find({"user_id": self.user_id, "active": True}))
        return []

    def get_user_destinations(self) -> tuple[List[dict], List[dict], List[dict]]:
        db = get_db()
        if db is not None:
            tg = list(db.telegram_destinations.find({"user_id": self.user_id}))
            wa = list(db.whatsapp_groups.find({"user_id": self.user_id}))
            sessions = list(db.whatsapp_sessions.find({"user_id": self.user_id, "active": True}))
            return tg, wa, sessions
        return [], [], []

    def get_user_session_name(self) -> str:
        """Ensures each user has their own unique, non-shared Telegram Telethon session file."""
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sessions_dir = os.path.join(backend_dir, "sessions")
        os.makedirs(sessions_dir, exist_ok=True)

        user_config = self.get_user_config()
        custom_session = user_config.get("custom_telegram_session") or user_config.get("telegram_session_name")
        if custom_session:
            return custom_session

        # Dedicated user session
        user_session_path = os.path.join(sessions_dir, f"telegram_user_{self.user_id}")

        # If this is Arthur and he has the existing authenticated session, migrate/copy it so auth is retained
        if self.user_id == "6ae0df757ec0ae10ea42e1a5":
            legacy_session = os.path.join(backend_dir, "pardaldaspromos_session_local.session")
            target_session_file = f"{user_session_path}.session"
            if os.path.exists(legacy_session) and not os.path.exists(target_session_file):
                try:
                    shutil.copy(legacy_session, target_session_file)
                    print(f"Migrated legacy session to user session: {target_session_file}")
                except Exception as e:
                    print(f"Could not copy legacy session: {e}")

        return user_session_path

    async def _handle_message_event(self, event):
        start_time = datetime.now(BRAZIL_TZ)
        try:
            msg = event.message
            chat = await event.get_chat()
            chat_username = getattr(chat, "username", None)
            chat_id = getattr(chat, "id", None)
            chat_title = getattr(chat, "title", "Sem título")

            # 1. VERIFICAÇÃO ESTRITA: Apenas canais com monitoramento ATIVO
            active_channels = self.get_user_channels()
            channel_match = None
            for ch in active_channels:
                ch_name = ch.get("name", "")
                if (chat_username and ch_name.lstrip("@").lower() == chat_username.lower()) or (str(chat_id) == ch_name):
                    channel_match = ch
                    break

            # Se o canal não estiver na lista de canais ATIVOS do usuário, descarta imediatamente SEM poluir o log
            if not channel_match:
                return

            channel_display_name = channel_match.get("description") or chat_title or f"@{chat_username}"
            self.metrics["detected"] += 1
            self.log(f"📩 Nova mensagem de canal ativo '{channel_display_name}' (ID: {chat_id})")

            original_text = msg.message or ""
            user_config = self.get_user_config()
            converter = LinkConverterService(user_config)
            formatter = AiFormatterService(user_config)

            # 2. Resolve shorteners
            resolved_text = await converter.resolve_shorteners(original_text, self.log)

            # 3. Check if text has promo links
            if not converter.has_any_valid_link(resolved_text):
                self.log(f"ℹ️ [{channel_display_name}] Mensagem sem links de afiliados válidos. Ignorada.")
                return

            # 4. Clean forbidden keywords
            cleaned_text = formatter.remove_forbidden_lines(resolved_text)

            # 5. Convert affiliate links
            ml_tag = "cupom" if channel_match.get("is_coupon_group", False) else None
            converted_text, conversion_success = await converter.convert_all_links(
                cleaned_text,
                ml_tag=ml_tag,
                log_func=self.log
            )
            if not conversion_success:
                self.metrics["conversion_errors"] += 1

            # 6. Format with AI
            if user_config.get("ai_enabled", True):
                self.log(f"🤖 [{channel_display_name}] Formatando texto com IA (OpenRouter)...")
                try:
                    formatted_text = await formatter.format_text(converted_text, log_func=self.log)
                except Exception as e:
                    self.metrics["ai_errors"] += 1
                    self.log(f"❌ Erro IA: {e}. Usando texto convertido direto.")
                    formatted_text = converted_text
            else:
                formatted_text = converted_text

            formatted_text = formatter.remove_forbidden_lines(formatted_text)

            # 7. Media processing (og:image or Telegram media download)
            media_path = None
            should_replace_image = channel_match.get("replace_image", False)
            if should_replace_image:
                first_url = None
                match = re.search(r"https?://[^\s]+", converted_text)
                if match:
                    first_url = match.group(0)
                if first_url:
                    og_url = await MediaProcessorService.get_og_image_url(first_url, self.log)
                    if og_url:
                        media_path = await MediaProcessorService.download_image_as_jpg(og_url, self.log)

            if not media_path and msg.media:
                try:
                    downloaded = await msg.download_media()
                    if downloaded:
                        media_path = await MediaProcessorService.convert_to_jpg_if_needed(downloaded, self.log)
                except Exception as e:
                    self.log(f"⚠️ Erro ao baixar mídia do Telegram: {e}")

            # 8. Dispatcher (Telegram + WhatsApp)
            tg_dest, wa_groups, wa_sessions = self.get_user_destinations()
            default_footer = user_config.get("footer_text", "")
            dispatcher = DispatcherService(
                telegram_destinations=tg_dest,
                whatsapp_groups=wa_groups,
                whatsapp_sessions=wa_sessions,
                default_footer=default_footer,
                whatsapp_admin_dest=user_config.get("whatsapp_admin_dest"),
                whatsapp_send_errors=user_config.get("whatsapp_send_errors", True)
            )

            # Send Telegram
            await dispatcher.send_to_telegram(
                telegram_client=self.client,
                text=formatted_text,
                media_path=media_path,
                conversion_success=conversion_success,
                log_func=self.log
            )

            # Send WhatsApp
            configured_wa = channel_match.get("whatsapp_destinations", [])
            await dispatcher.dispatch_whatsapp(
                original_text=original_text,
                formatted_text=formatted_text,
                media_path=media_path,
                configured_dest_ids=configured_wa,
                conversion_success=conversion_success,
                log_func=self.log
            )

            self.metrics["sent"] += 1

            # 9. PERSISTÊNCIA DE OFERTAS DISPARADAS NO BANCO (Para exibição no Dashboard)
            try:
                prod_title, prod_price = extract_product_title_and_price(formatted_text)
                target_group_names = []
                for g_id in configured_wa:
                    matching_g = next((g.get("name") for g in wa_groups if g.get("id") == g_id), None)
                    target_group_names.append(matching_g or g_id)
                if tg_dest:
                    target_group_names.extend([t.get("name", "Telegram") for t in tg_dest if not t.get("admin")])

                db = get_db()
                if db is not None:
                    db.sent_offers.insert_one({
                        "user_id": self.user_id,
                        "product_name": prod_title,
                        "price": prod_price,
                        "channel_name": channel_display_name,
                        "original_text": original_text,
                        "converted_text": formatted_text,
                        "target_groups": target_group_names,
                        "platform": "Multi-plataforma",
                        "status": "Enviado com sucesso",
                        "sent_at": datetime.now(timezone.utc)
                    })
            except Exception as e:
                self.log(f"⚠️ Erro ao registrar oferta enviada no histórico: {e}")

            # Latency metric
            end_time = datetime.now(BRAZIL_TZ)
            duration = (end_time - start_time).total_seconds()
            self.metrics["latencies"].append(duration)
            if len(self.metrics["latencies"]) > 100:
                self.metrics["latencies"].pop(0)

            # Cleanup media file
            if media_path and os.path.exists(media_path):
                try:
                    os.remove(media_path)
                except Exception:
                    pass

        except Exception as e:
            self.log(f"❌ Erro no processamento do evento: {e}")

    async def _run_loop(self):
        self.loop = asyncio.get_running_loop()
        user_config = self.get_user_config()
        api_id_val = user_config.get("custom_telegram_api_id") or user_config.get("telegram_api_id")
        api_id = int(api_id_val) if api_id_val else 0
        api_hash = user_config.get("custom_telegram_api_hash") or user_config.get("telegram_api_hash") or ""
        
        if not api_id or not api_hash:
            self.log("⚠️ Credenciais do Telegram (API ID / Hash) não configuradas para este usuário. Configure na aba Configurações.")
            self.is_running = False
            return
        
        # Cada usuário com sua própria sessão individual do Telegram
        session_name = self.get_user_session_name()
        session_display = os.path.basename(session_name)

        self.log(f"Iniciando cliente Telegram Telethon (Sessão exclusiva: {session_display})...")
        self.client = TelegramClient(session_name, api_id, api_hash)
        await self.client.start()
        self.log(f"✅ Cliente Telegram conectado com sucesso para o usuário! (Sessão: {session_display})")
        self.is_running = True

        self.client.add_event_handler(self._handle_message_event, events.NewMessage())
        self.log("👂 Monitorando canais ativos e configurados...")

        try:
            while not self.stop_event.is_set():
                await asyncio.sleep(1)
        finally:
            self.log("Desconectando cliente Telegram...")
            if self.client:
                try:
                    self.client.remove_event_handler(self._handle_message_event)
                    await self.client.disconnect()
                except Exception:
                    pass
            self.is_running = False
            self.log("🛑 Bot finalizado.")

    def start(self):
        if self.thread and self.thread.is_alive():
            self.log("⚠️ Bot já está em execução.")
            self.is_running = True
            return
        self.stop_event.clear()
        def runner():
            try:
                asyncio.run(self._run_loop())
            except Exception as e:
                self.log(f"❌ Erro na thread do bot: {e}")
                self.is_running = False
        self.thread = threading.Thread(target=runner, daemon=True)
        self.thread.start()
        self.is_running = True

    def stop(self):
        if not (self.thread and self.thread.is_alive()):
            self.is_running = False
            return
        self.log("⛔ Solicitando parada do bot...")
        self.stop_event.set()
        self.thread.join(timeout=8)
        self.thread = None
        self.is_running = False

class BotManager:
    _instances: Dict[str, UserBotInstance] = {}

    @classmethod
    def get_instance(cls, user_id: str) -> UserBotInstance:
        if user_id not in cls._instances:
            cls._instances[user_id] = UserBotInstance(user_id)
        return cls._instances[user_id]
