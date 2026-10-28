import asyncio
import json
import os
import re
import logging
from datetime import datetime
from typing import Optional, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import (
    SessionPasswordNeededError,
    PhoneCodeInvalidError,
    PhoneCodeExpiredError,
    PasswordHashInvalidError
)

from app.services.bot_manager import BotManager
from app.api.deps import get_current_user
from app.core.security import verify_access_token
from app.core.database import get_db
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bot", tags=["Controle do Bot"])

# In-memory dictionary for pending Telethon login clients during 2-step auth
_pending_logins: Dict[str, dict] = {}

class SendCodeRequest(BaseModel):
    phone: str
    api_id: Optional[str] = None
    api_hash: Optional[str] = None

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str
    phone_code_hash: str
    password: Optional[str] = None
    api_id: Optional[str] = None
    api_hash: Optional[str] = None

class ImportSessionRequest(BaseModel):
    session_string: str
    api_id: Optional[str] = None
    api_hash: Optional[str] = None

def _format_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", str(phone or ""))
    if len(digits) == 13 and digits.startswith("55"):
        return f"+55 ({digits[2:4]}) {digits[4:9]}-{digits[9:]}"
    if len(digits) == 12 and digits.startswith("55"):
        return f"+55 ({digits[2:4]}) {digits[4:8]}-{digits[8:]}"
    return f"+{digits}" if digits else phone

@router.get("/status")
async def get_bot_status(current_user: dict = Depends(get_current_user)):
    bot = BotManager.get_instance(current_user["id"])
    return bot.get_status_dict()

@router.get("/status/stream")
async def stream_bot_status(token: str = Query(..., description="JWT Bearer token")):
    """
    Continuous Server-Sent Events (SSE) streaming endpoint for live real-time bot status.
    Eliminates client polling: browser maintains 1 single persistent HTTP connection.
    Server pushes updates reactively whenever the state changes.
    """
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    bot = BotManager.get_instance(user_id)
    queue = bot.add_status_subscriber()

    async def event_generator():
        try:
            # Send current status immediately upon connection
            initial_status = bot.get_status_dict()
            yield f"data: {json.dumps(initial_status)}\n\n"

            while True:
                try:
                    update = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {json.dumps(update)}\n\n"
                except asyncio.TimeoutError:
                    # Lightweight keep-alive comment so proxy/browser never drops connection
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            bot.remove_status_subscriber(queue)
        finally:
            bot.remove_status_subscriber(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/start")
async def start_bot(current_user: dict = Depends(get_current_user)):
    bot = BotManager.get_instance(current_user["id"])
    bot.start()
    return {
        "message": "Bot iniciado com sucesso",
        "is_running": True,
        "session": os.path.basename(bot.get_user_session_name())
    }

@router.post("/stop")
async def stop_bot(current_user: dict = Depends(get_current_user)):
    bot = BotManager.get_instance(current_user["id"])
    bot.stop()
    return {
        "message": "Bot pausado com sucesso",
        "is_running": False
    }

@router.get("/logs")
async def get_bot_logs(limit: int = 150, current_user: dict = Depends(get_current_user)):
    bot = BotManager.get_instance(current_user["id"])
    return {
        "user_id": current_user["id"],
        "logs": list(bot.logs)[:limit]
    }

@router.get("/logs/stream")
async def stream_bot_logs(token: str = Query(..., description="JWT Bearer token")):
    """Server-Sent Events (SSE) streaming endpoint for live real-time bot logs."""
    user_id = verify_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    bot = BotManager.get_instance(user_id)
    queue = bot.add_subscriber()

    async def event_generator():
        try:
            yield f"data: {json.dumps({'type': 'connected', 'message': 'Conectado ao streaming de logs em tempo real'})}\n\n"
            recent_logs = list(bot.logs)[:20]
            recent_logs.reverse()
            for r in recent_logs:
                yield f"data: {json.dumps({'type': 'log', 'message': r})}\n\n"

            while True:
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=20.0)
                    yield f"data: {json.dumps({'type': 'log', 'message': entry})}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        except asyncio.CancelledError:
            bot.remove_subscriber(queue)
        finally:
            bot.remove_subscriber(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# ==========================================
# Telegram Session Configuration Endpoints
# ==========================================

@router.get("/telegram/session-status")
async def get_telegram_session_status(current_user: dict = Depends(get_current_user)):
    """Checks the live connection and authorization status of the user's Telegram session."""
    user_id = current_user["id"]
    bot = BotManager.get_instance(user_id)
    session_file = bot.get_user_session_name()
    full_session_path = f"{session_file}.session"

    db = get_db()
    user_config = {}
    if db:
        doc = db.user_configs.find_one({"user_id": user_id})
        if doc:
            user_config = doc.get("data", {})

    api_id_val = user_config.get("telegram_api_id") or user_config.get("custom_telegram_api_id")
    api_id = int(api_id_val) if api_id_val else 0
    api_hash = user_config.get("telegram_api_hash") or user_config.get("custom_telegram_api_hash") or ""

    if not os.path.exists(full_session_path):
        return {
            "is_connected": False,
            "session_exists": False,
            "account_name": "",
            "phone": "",
            "username": "",
            "session_file": os.path.basename(session_file),
            "api_id": str(api_id),
            "api_hash_masked": api_hash[:4] + "..." + api_hash[-4:] if len(api_hash) > 8 else "***"
        }

    # Verify authorization with Telethon
    client = TelegramClient(session_file, api_id, api_hash)
    try:
        await client.connect()
        is_auth = await client.is_user_authorized()
        if is_auth:
            me = await client.get_me()
            first_name = getattr(me, "first_name", "") or ""
            last_name = getattr(me, "last_name", "") or ""
            full_name = f"{first_name} {last_name}".strip() or "Conta Telegram"
            phone_raw = getattr(me, "phone", "") or ""
            username = getattr(me, "username", "") or ""

            return {
                "is_connected": True,
                "session_exists": True,
                "account_name": full_name,
                "phone": _format_phone(phone_raw),
                "username": f"@{username}" if username else "",
                "session_file": os.path.basename(session_file),
                "api_id": str(api_id),
                "api_hash_masked": api_hash[:4] + "..." + api_hash[-4:] if len(api_hash) > 8 else "***"
            }
        else:
            return {
                "is_connected": False,
                "session_exists": True,
                "account_name": "Sessão Expirada / Não Autorizada",
                "phone": "",
                "username": "",
                "session_file": os.path.basename(session_file),
                "api_id": str(api_id),
                "api_hash_masked": api_hash[:4] + "..." + api_hash[-4:] if len(api_hash) > 8 else "***"
            }
    except Exception as e:
        logger.warning(f"Erro ao verificar sessão do Telegram: {e}")
        return {
            "is_connected": False,
            "session_exists": True,
            "account_name": f"Erro de Conexão ({e})",
            "phone": "",
            "username": "",
            "session_file": os.path.basename(session_file),
            "api_id": str(api_id),
            "api_hash_masked": "***"
        }
    finally:
        if client.is_connected():
            await client.disconnect()

@router.post("/telegram/send-code")
async def telegram_send_code(req: SendCodeRequest, current_user: dict = Depends(get_current_user)):
    """Sends SMS/Telegram login verification code to phone number."""
    user_id = current_user["id"]
    db = get_db()
    user_config = {}
    if db:
        doc = db.user_configs.find_one({"user_id": user_id})
        if doc:
            user_config = doc.get("data", {})

    api_id_val = req.api_id or user_config.get("telegram_api_id") or user_config.get("custom_telegram_api_id")
    api_id = int(api_id_val) if api_id_val else 0
    api_hash = req.api_hash or user_config.get("telegram_api_hash") or user_config.get("custom_telegram_api_hash") or ""

    if not api_id or not api_hash:
        raise HTTPException(
            status_code=400,
            detail="Credenciais do Telegram (API ID e API Hash) não configuradas. Configure em Configurações > Telegram ou informe na requisição."
        )

    phone_clean = re.sub(r"[^0-9+]", "", req.phone.strip())
    if not phone_clean.startswith("+"):
        phone_clean = f"+{phone_clean}"

    bot = BotManager.get_instance(user_id)
    session_file = bot.get_user_session_name()

    client = TelegramClient(session_file, api_id, api_hash)
    try:
        await client.connect()
        sent_code = await client.send_code_request(phone_clean)
        
        _pending_logins[user_id] = {
            "client": client,
            "phone": phone_clean,
            "phone_code_hash": sent_code.phone_code_hash,
            "api_id": api_id,
            "api_hash": api_hash
        }

        return {
            "success": True,
            "message": f"Código enviado com sucesso para o Telegram ({_format_phone(phone_clean)})!",
            "phone_code_hash": sent_code.phone_code_hash,
            "phone": _format_phone(phone_clean)
        }
    except Exception as e:
        if client.is_connected():
            await client.disconnect()
        logger.error(f"Erro ao enviar código do Telegram: {e}")
        raise HTTPException(status_code=400, detail=f"Erro ao solicitar código do Telegram: {str(e)}")

@router.post("/telegram/verify-code")
async def telegram_verify_code(req: VerifyCodeRequest, current_user: dict = Depends(get_current_user)):
    """Verifies login code (and optional 2FA password) and establishes authenticated session."""
    user_id = current_user["id"]
    pending = _pending_logins.get(user_id)

    client = None
    if pending and pending.get("client") and pending["client"].is_connected():
        client = pending["client"]
        phone = pending["phone"]
        phone_code_hash = req.phone_code_hash or pending["phone_code_hash"]
        api_id = pending["api_id"]
        api_hash = pending["api_hash"]
    else:
        bot = BotManager.get_instance(user_id)
        session_file = bot.get_user_session_name()
        db = get_db()
        user_config = {}
        if db:
            doc = db.user_configs.find_one({"user_id": user_id})
            if doc:
                user_config = doc.get("data", {})
        api_id_val = req.api_id or user_config.get("telegram_api_id") or user_config.get("custom_telegram_api_id")
        api_id = int(api_id_val) if api_id_val else 0
        api_hash = req.api_hash or user_config.get("telegram_api_hash") or user_config.get("custom_telegram_api_hash") or ""

        if not api_id or not api_hash:
            raise HTTPException(
                status_code=400,
                detail="Credenciais do Telegram (API ID e API Hash) não configuradas. Configure em Configurações > Telegram ou informe na requisição."
            )
        phone = req.phone
        phone_code_hash = req.phone_code_hash
        client = TelegramClient(session_file, api_id, api_hash)
        await client.connect()

    try:
        try:
            await client.sign_in(phone=phone, code=req.code.strip(), phone_code_hash=phone_code_hash)
        except SessionPasswordNeededError:
            if not req.password:
                return {
                    "success": False,
                    "needs_password": True,
                    "message": "Sua conta do Telegram possui Verificação em Duas Etapas (2FA). Por favor, digite sua senha."
                }
            await client.sign_in(password=req.password)

        me = await client.get_me()
        full_name = f"{getattr(me, 'first_name', '') or ''} {getattr(me, 'last_name', '') or ''}".strip()
        username = getattr(me, "username", "") or ""

        db = get_db()
        if db:
            db.telegram_sessions.update_one(
                {"user_id": user_id},
                {"$set": {
                    "phone": phone,
                    "api_id": str(api_id),
                    "api_hash": api_hash,
                    "is_connected": True,
                    "account_name": full_name,
                    "updated_at": datetime.utcnow()
                }},
                upsert=True
            )

        if user_id in _pending_logins:
            del _pending_logins[user_id]

        return {
            "success": True,
            "message": "Conta do Telegram conectada com sucesso!",
            "account_name": full_name,
            "phone": _format_phone(phone),
            "username": f"@{username}" if username else ""
        }
    except PhoneCodeInvalidError:
        raise HTTPException(status_code=400, detail="Código de verificação incorreto.")
    except PhoneCodeExpiredError:
        raise HTTPException(status_code=400, detail="Código de verificação expirou. Solicite um novo código.")
    except PasswordHashInvalidError:
        raise HTTPException(status_code=400, detail="Senha de 2FA incorreta.")
    except Exception as e:
        logger.error(f"Erro ao autenticar código Telegram: {e}")
        raise HTTPException(status_code=400, detail=f"Erro ao validar autenticação: {str(e)}")
    finally:
        if client and client.is_connected():
            await client.disconnect()

@router.post("/telegram/import-session")
async def telegram_import_session(req: ImportSessionRequest, current_user: dict = Depends(get_current_user)):
    """Imports an existing Telethon StringSession into the user's bot session file."""
    user_id = current_user["id"]
    db = get_db()
    user_config = {}
    if db:
        doc = db.user_configs.find_one({"user_id": user_id})
        if doc:
            user_config = doc.get("data", {})

    api_id_val = req.api_id or user_config.get("telegram_api_id") or user_config.get("custom_telegram_api_id")
    api_id = int(api_id_val) if api_id_val else 0
    api_hash = req.api_hash or user_config.get("telegram_api_hash") or user_config.get("custom_telegram_api_hash") or ""

    if not api_id or not api_hash:
        raise HTTPException(
            status_code=400,
            detail="Credenciais do Telegram (API ID e API Hash) não configuradas. Configure em Configurações > Telegram ou informe na requisição."
        )

    session_str = req.session_string.strip()
    temp_client = TelegramClient(StringSession(session_str), api_id, api_hash)
    try:
        await temp_client.connect()
        if not await temp_client.is_user_authorized():
            raise HTTPException(status_code=400, detail="A StringSession informada não está autorizada ou já expirou.")

        me = await temp_client.get_me()
        full_name = f"{getattr(me, 'first_name', '') or ''} {getattr(me, 'last_name', '') or ''}".strip()
        phone = getattr(me, "phone", "") or ""
        username = getattr(me, "username", "") or ""

        # Save session file for user
        bot = BotManager.get_instance(user_id)
        session_file = bot.get_user_session_name()
        
        # Connect to SQLite/file session with same credentials and copy auth
        file_client = TelegramClient(session_file, api_id, api_hash)
        await file_client.connect()
        # Save session string to db
        if db:
            db.telegram_sessions.update_one(
                {"user_id": user_id},
                {"$set": {
                    "phone": phone,
                    "session_string": session_str,
                    "is_connected": True,
                    "account_name": full_name,
                    "api_id": str(api_id),
                    "api_hash": api_hash
                }},
                upsert=True
            )
        await file_client.disconnect()

        return {
            "success": True,
            "message": "Sessão importada com sucesso!",
            "account_name": full_name,
            "phone": _format_phone(phone),
            "username": f"@{username}" if username else ""
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao validar session string: {str(e)}")
    finally:
        if temp_client.is_connected():
            await temp_client.disconnect()

@router.post("/telegram/disconnect")
async def telegram_disconnect(current_user: dict = Depends(get_current_user)):
    """Disconnects and removes the user's Telegram session file."""
    user_id = current_user["id"]
    bot = BotManager.get_instance(user_id)
    if bot.is_running:
        bot.stop()

    session_file = bot.get_user_session_name()
    full_path = f"{session_file}.session"
    if os.path.exists(full_path):
        try:
            os.remove(full_path)
        except Exception as e:
            logger.warning(f"Erro ao remover arquivo de sessão: {e}")

    db = get_db()
    if db:
        db.telegram_sessions.delete_one({"user_id": user_id})

    return {
        "success": True,
        "message": "Sessão do Telegram desconectada e removida com sucesso."
    }
