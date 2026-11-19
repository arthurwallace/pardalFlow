import os
import json
import uuid
import time
import logging
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
import httpx

from app.core.database import get_db
from app.services.waha_client import WahaClient

logger = logging.getLogger(__name__)

class QueueManager:
    """
    Gerenciador unificado de filas de envio de mensagens do WhatsApp ('ofertas_pendentes', 'cupons_pendentes', 'urls_enviadas_*').
    Garante anti-duplicação, taxa controlada de envio (rate limit) e confiabilidade.
    """
    def __init__(self, user_id: str, waha_base_url: str = "http://192.168.1.25:3000", waha_api_key: Optional[str] = None):
        self.user_id = user_id
        self.waha = WahaClient(base_url=waha_base_url, api_key=waha_api_key)
        self._paused = False

    def is_url_recently_sent(self, url: str, hours: int = 24) -> bool:
        """Verifica se uma URL específica já foi enviada nas últimas X horas (anti-duplicação)."""
        if not url:
            return False
        db = get_db()
        if not db:
            return False

        since = datetime.now(timezone.utc) - timedelta(hours=hours)
        clean_url = url.split("?")[0].strip()
        
        # Procura em sent_offers
        try:
            for offer in db.sent_offers.find({"user_id": self.user_id}):
                sent_at = offer.get("sent_at")
                if sent_at and isinstance(sent_at, datetime) and sent_at < since:
                    continue
                conv_text = offer.get("converted_text", "")
                orig_text = offer.get("original_text", "")
                if clean_url in conv_text or clean_url in orig_text:
                    return True
        except Exception:
            pass
        return False

    def enqueue(
        self,
        queue_type: str,
        text: str,
        media_path: Optional[str] = None,
        destination_ids: Optional[List[str]] = None,
        preview_url: Optional[str] = None,
        custom_delay: Optional[int] = None
    ) -> str:
        """Adiciona uma mensagem à fila correspondente."""
        db = get_db()
        if not db:
            raise RuntimeError("Banco de dados indisponível")

        scheduled_for = datetime.now(timezone.utc)
        if custom_delay and custom_delay > 0:
            scheduled_for += timedelta(seconds=custom_delay)

        doc_id = uuid.uuid4().hex[:24]
        payload = {
            "text": text,
            "media_path": media_path,
            "destination_ids": destination_ids or [],
            "preview_url": preview_url or ""
        }

        db.message_queue.insert_one({
            "id": doc_id,
            "user_id": self.user_id,
            "queue_type": queue_type,
            "payload": payload,
            "status": "pending",
            "attempts": 0,
            "error_message": "",
            "created_at": datetime.now(timezone.utc),
            "scheduled_for": scheduled_for
        })
        logger.info(f"[QueueManager] Mensagem adicionada à fila '{queue_type}': {doc_id}")
        return doc_id

    def list_queue(self, queue_type: Optional[str] = None, status: str = "pending", limit: int = 50) -> List[Dict[str, Any]]:
        """Lista mensagens na fila filtradas por tipo e status."""
        db = get_db()
        if not db:
            return []

        filter_q: Dict[str, Any] = {"user_id": self.user_id}
        if queue_type:
            filter_q["queue_type"] = queue_type
        if status:
            filter_q["status"] = status

        cursor = db.message_queue.find(filter_q)
        items = list(cursor)
        return items[:limit]

    def count_pending(self) -> Dict[str, int]:
        """Retorna a contagem de mensagens pendentes por fila."""
        db = get_db()
        if not db:
            return {"ofertas": 0, "cupons": 0, "broadcast": 0, "total": 0}

        counts = {"ofertas": 0, "cupons": 0, "broadcast": 0, "total": 0}
        for item in db.message_queue.find({"user_id": self.user_id, "status": "pending"}):
            q_type = item.get("queue_type", "ofertas")
            if q_type in counts:
                counts[q_type] += 1
            counts["total"] += 1
        return counts

    def clear_queue(self, queue_type: Optional[str] = None) -> int:
        """Limpa as mensagens pendentes da fila."""
        db = get_db()
        if not db:
            return 0

        filter_q: Dict[str, Any] = {"user_id": self.user_id, "status": "pending"}
        if queue_type:
            filter_q["queue_type"] = queue_type

        removed = 0
        for item in list(db.message_queue.find(filter_q)):
            db.message_queue.delete_one({"id": item["id"]})
            removed += 1

        logger.info(f"[QueueManager] Limpeza de fila ({queue_type or 'todas'}): {removed} mensagens removidas.")
        return removed

    def trim_queue(self, queue_type: str, keep_last: int = 20) -> int:
        """Se fila > 50, apara mantendo apenas as últimas X mensagens mais recentes."""
        db = get_db()
        if not db:
            return 0

        pending = list(db.message_queue.find({"user_id": self.user_id, "queue_type": queue_type, "status": "pending"}))
        if len(pending) <= keep_last:
            return 0

        # Remove as mais antigas excedentes
        to_remove = pending[:len(pending) - keep_last]
        for item in to_remove:
            db.message_queue.delete_one({"id": item["id"]})

        logger.info(f"[QueueManager] Fila '{queue_type}' aparada: {len(to_remove)} itens antigos descartados.")
        return len(to_remove)

    async def process_next(self, queue_type: str = "ofertas", session_name: str = "WHATS_BUSSINESS_01") -> Optional[bool]:
        """Processa e despacha a próxima mensagem pendente da fila especificada."""
        if self._paused:
            return None

        db = get_db()
        if not db:
            return None

        now = datetime.now(timezone.utc)
        filter_q = {
            "user_id": self.user_id,
            "queue_type": queue_type,
            "status": "pending"
        }

        # Encontra o primeiro item pronto para envio
        item = None
        for cand in db.message_queue.find(filter_q):
            sched = cand.get("scheduled_for")
            if not sched or (isinstance(sched, datetime) and sched <= now):
                item = cand
                break

        if not item:
            return None

        msg_id = item["id"]
        # Marca como em processamento
        db.message_queue.update_one({"id": msg_id}, {"$set": {"status": "processing"}})

        payload = item.get("payload", {})
        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except Exception:
                payload = {}

        text = payload.get("text", "")
        media_path = payload.get("media_path")
        dest_ids = payload.get("destination_ids", [])

        if not dest_ids:
            # Se não tem destinos específicos, busca os grupos ativos do usuário
            groups = list(db.whatsapp_groups.find({"user_id": self.user_id, "active": True}))
            dest_ids = [g.get("id") or g.get("group_id") for g in groups if g.get("id") or g.get("group_id")]

        all_success = True
        for dest in dest_ids:
            try:
                if media_path and os.path.exists(media_path):
                    with open(media_path, "rb") as f:
                        import base64
                        b64 = base64.b64encode(f.read()).decode("utf-8")
                    ok = await self.waha.send_image(
                        session_name=session_name,
                        chat_id=dest,
                        caption=text,
                        image_base64=b64,
                        simulate_typing=True
                    )
                else:
                    ok = await self.waha.send_text(
                        session_name=session_name,
                        chat_id=dest,
                        text=text,
                        simulate_typing=True
                    )
                if not ok:
                    all_success = False
            except Exception as e:
                logger.error(f"[QueueManager] Erro ao despachar {msg_id} para {dest}: {e}")
                all_success = False

        if all_success:
            db.message_queue.update_one({"id": msg_id}, {"$set": {"status": "sent"}})
        else:
            attempts = item.get("attempts", 0) + 1
            status = "failed" if attempts >= 3 else "pending"
            db.message_queue.update_one(
                {"id": msg_id},
                {"$set": {"status": status, "attempts": attempts, "error_message": "Falha no envio para um ou mais destinos"}}
            )

        return all_success
