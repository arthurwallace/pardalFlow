import os
import re
import base64
import urllib.parse
import unicodedata
from typing import List, Dict, Any, Optional, Callable
import httpx

from app.core.config import settings

class DispatcherService:
    def __init__(
        self,
        telegram_destinations: List[Dict[str, Any]],
        whatsapp_groups: List[Dict[str, Any]],
        whatsapp_sessions: List[Dict[str, Any]],
        default_footer: str,
        whatsapp_admin_dest: Optional[str] = None,
        whatsapp_send_errors: bool = True
    ):
        self.telegram_destinations = telegram_destinations or []
        self.whatsapp_groups = whatsapp_groups or []
        self.whatsapp_sessions = whatsapp_sessions or []
        self.default_footer = default_footer
        self.whatsapp_admin_dest = whatsapp_admin_dest
        self.whatsapp_send_errors = whatsapp_send_errors
        self._session_cycle_index = 0

    @staticmethod
    def _normalize_text_for_match(val: str) -> str:
        norm = unicodedata.normalize("NFKD", val).casefold()
        no_accents = "".join(c for c in norm if not unicodedata.combining(c))
        return re.sub(r"\s+", " ", no_accents).strip()

    def get_matching_whatsapp_groups(self, text: str, configured_ids: List[str]) -> List[str]:
        """Returns destination IDs: channels configured explicitly + matched by keyword rules."""
        dest_ids = list(dict.fromkeys(configured_ids))
        normalized_text = self._normalize_text_for_match(text)

        for group in self.whatsapp_groups:
            gid = group.get("id")
            if not gid:
                continue
            keywords = group.get("keywords", [])
            for kw in keywords:
                norm_kw = self._normalize_text_for_match(str(kw))
                if norm_kw and re.search(rf"(?<!\w){re.escape(norm_kw)}(?!\w)", normalized_text):
                    if gid not in dest_ids:
                        dest_ids.append(gid)
                    break
        return dest_ids

    def _get_next_whatsapp_session(self) -> str:
        active = [s for s in self.whatsapp_sessions if s.get("active", True)]
        if not active:
            return "WHATS_BUSSINESS_01"
        session_name = active[self._session_cycle_index % len(active)]["name"]
        self._session_cycle_index += 1
        return session_name

    async def send_to_telegram(
        self,
        telegram_client,
        text: str,
        media_path: Optional[str],
        conversion_success: bool,
        log_func: Callable[[str], None] = print
    ):
        """Dispatches formatted message to configured Telegram destinations."""
        if not self.telegram_destinations:
            log_func("⚠️ Nenhum destino Telegram configurado.")
            return

        # Separate admin channels (receive conversion errors) from public promo channels
        if conversion_success:
            targets = [d for d in self.telegram_destinations if not d.get("admin", False)]
        else:
            targets = [d for d in self.telegram_destinations if d.get("admin", False)]
            if targets:
                log_func(f"⚠️ Conversão com falha. Enviando apenas para {len(targets)} canal(is) admin do Telegram.")
            else:
                log_func("⚠️ Conversão com falha e nenhum canal admin configurado no Telegram.")
                return

        wa_encoded = urllib.parse.quote(text, safe="")
        wa_share_btn = f"\n\n📤 [Enviar no WhatsApp](https://wa.me/?text={wa_encoded})"
        full_text = text + wa_share_btn

        for dest in targets:
            dest_id = dest.get("id")
            dest_name = dest.get("name", dest_id)
            if not dest_id:
                continue

            try:
                try:
                    entity = int(dest_id)
                except ValueError:
                    entity = dest_id

                if media_path and os.path.exists(media_path):
                    await telegram_client.send_file(
                        entity,
                        media_path,
                        caption=full_text,
                        parse_mode="md",
                        link_preview=True
                    )
                else:
                    await telegram_client.send_message(
                        entity,
                        full_text,
                        parse_mode="md",
                        link_preview=True
                    )
                log_func(f"✅ Telegram: Publicado em '{dest_name}' ({dest_id})")
            except Exception as e:
                log_func(f"❌ Telegram: Erro ao enviar para '{dest_name}': {e}")

    async def send_to_whatsapp(
        self,
        text: str,
        media_path: Optional[str],
        destination_id: str,
        group_footer_override: Optional[str] = None,
        log_func: Callable[[str], None] = print
    ) -> bool:
        """Sends message or media to a single WhatsApp group/admin destination."""
        if not destination_id:
            return False

        # Clean any Telegram-specific button text
        clean_text = text.split("\n\n📤 [Enviar no WhatsApp]")[0]
        footer = group_footer_override or self.default_footer
        if footer and footer not in clean_text:
            clean_text = f"{clean_text.strip()}\n\n{footer}"

        session_name = self._get_next_whatsapp_session()
        headers = {
            "session_name": session_name,
            "Content-Type": "application/json"
        }

        # Encode image to base64 if present
        image_b64 = ""
        if media_path and os.path.exists(media_path):
            try:
                with open(media_path, "rb") as f:
                    image_b64 = base64.b64encode(f.read()).decode("utf-8")
            except Exception as e:
                log_func(f"⚠️ Erro ao codificar imagem WhatsApp: {e}")

        # Find preview url
        preview_url = ""
        url_match = re.search(r"https?://[^\s]+", clean_text)
        if url_match:
            preview_url = url_match.group(0)

        if image_b64:
            url = settings.WPP_IMAGE_WEBHOOK
            payload = {
                "destination": destination_id,
                "caption": clean_text,
                "image_base64": image_b64,
                "preview_url": preview_url,
                "destino": destination_id
            }
        else:
            url = settings.WPP_TEXT_WEBHOOK
            payload = {
                "destination": destination_id,
                "text": clean_text,
                "destino": destination_id
            }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(url, headers=headers, json=payload, timeout=45.0)
                resp.raise_for_status()
                log_func(f"✅ WhatsApp: Mensagem enviada para {destination_id} via '{session_name}'")
                return True
            except Exception as e:
                log_func(f"❌ WhatsApp: Erro ao enviar para {destination_id}: {e}")
                return False

    async def dispatch_whatsapp(
        self,
        original_text: str,
        formatted_text: str,
        media_path: Optional[str],
        configured_dest_ids: List[str],
        conversion_success: bool,
        log_func: Callable[[str], None] = print
    ):
        """Dispatches WhatsApp messages based on conversion success and keyword rules."""
        matched_dest_ids = self.get_matching_whatsapp_groups(original_text, configured_dest_ids)

        if conversion_success:
            if not matched_dest_ids:
                log_func("ℹ️ WhatsApp: Nenhum grupo de destino correspondente.")
                return

            log_func(f"📲 WhatsApp: Enviando para {len(matched_dest_ids)} grupo(s)...")
            for gid in matched_dest_ids:
                # Find group footer if defined
                custom_footer = None
                for grp in self.whatsapp_groups:
                    if grp.get("id") == gid and grp.get("footer_text"):
                        custom_footer = grp["footer_text"]
                        break
                await self.send_to_whatsapp(
                    formatted_text,
                    media_path,
                    gid,
                    group_footer_override=custom_footer,
                    log_func=log_func
                )
        else:
            if self.whatsapp_send_errors and self.whatsapp_admin_dest:
                log_func(f"⚠️ WhatsApp: Conversão com erro. Enviando alerta para admin ({self.whatsapp_admin_dest})...")
                await self.send_to_whatsapp(
                    formatted_text,
                    media_path,
                    self.whatsapp_admin_dest,
                    log_func=log_func
                )
