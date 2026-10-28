import os
import json
import base64
import uuid
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse

from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/backup", tags=["Backup e Restauração"])

SESSIONS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "sessions")

@router.get("/export")
async def export_account_backup(current_user: dict = Depends(get_current_user)):
    """Exports all account data (configs, channels, groups, destinations, chips, and telegram session) as a portable JSON."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados indisponível")

    user_id = current_user["id"]
    user_email = current_user.get("email", "")

    # 1. User config (Shopee, AI models, custom prompts, etc.)
    user_config_doc = db.user_configs.find_one({"user_id": user_id})
    user_config = {}
    if user_config_doc:
        c_data = user_config_doc.get("data", {})
        user_config = json.loads(c_data) if isinstance(c_data, str) else c_data

    # 2. Monitored Channels
    raw_channels = list(db.channels.find({"user_id": user_id}))
    channels = []
    for ch in raw_channels:
        channels.append({
            "name": ch.get("name"),
            "description": ch.get("description", ""),
            "username": ch.get("username", ""),
            "active": ch.get("active", True),
            "replace_image": ch.get("replace_image", False),
            "is_coupon_group": ch.get("is_coupon_group", False),
            "target_whatsapp_groups": ch.get("target_whatsapp_groups") or ch.get("whatsapp_destinations") or [],
            "order": ch.get("order", 0)
        })

    # 3. WhatsApp Target Groups
    raw_groups = list(db.whatsapp_groups.find({"user_id": user_id}))
    whatsapp_groups = []
    for g in raw_groups:
        whatsapp_groups.append({
            "group_id": g.get("group_id") or g.get("id"),
            "name": g.get("name"),
            "keywords": g.get("keywords") or [],
            "footer_text": g.get("footer_text", ""),
            "active": g.get("active", True)
        })

    # 4. Telegram Destinations
    raw_dest = list(db.telegram_destinations.find({"user_id": user_id}))
    telegram_destinations = []
    for d in raw_dest:
        telegram_destinations.append({
            "telegram_id": d.get("telegram_id") or d.get("id"),
            "name": d.get("name"),
            "admin": d.get("admin", False),
            "active": d.get("active", True)
        })

    # 5. WhatsApp Sessions (Chips)
    raw_sess = list(db.whatsapp_sessions.find({"user_id": user_id}))
    whatsapp_sessions = []
    for s in raw_sess:
        whatsapp_sessions.append({
            "name": s.get("name"),
            "active": s.get("active", True)
        })

    # 6. Telegram Session (.session file) encoded in Base64
    telegram_session_b64 = None
    session_file_path = os.path.join(SESSIONS_DIR, f"user_{user_id}.session")
    if os.path.exists(session_file_path):
        try:
            with open(session_file_path, "rb") as f:
                telegram_session_b64 = base64.b64encode(f.read()).decode("utf-8")
        except Exception:
            pass

    backup_payload = {
        "format": "pardalflow_account_backup",
        "version": "2.0.0",
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "user_email": user_email,
        "user_config": user_config,
        "channels": channels,
        "whatsapp_groups": whatsapp_groups,
        "telegram_destinations": telegram_destinations,
        "whatsapp_sessions": whatsapp_sessions,
        "telegram_session_b64": telegram_session_b64
    }

    clean_email = user_email.split('@')[0] if '@' in user_email else "user"
    filename = f"pardalflow_backup_{clean_email}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    return JSONResponse(
        content=backup_payload,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post("/import")
async def import_account_backup(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Imports an account backup JSON file and restores all configs, channels, groups, and telegram sessions."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="Banco de dados indisponível")

    try:
        content = await file.read()
        backup_data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Arquivo de backup JSON inválido: {e}")

    if not isinstance(backup_data, dict):
        raise HTTPException(status_code=400, detail="Estrutura de dados de backup inválida.")

    user_id = current_user["id"]

    # 1. Restore User Configs
    user_config = backup_data.get("user_config")
    if isinstance(user_config, dict) and user_config:
        db.user_configs.update_one(
            {"user_id": user_id},
            {"$set": {"data": user_config}},
            upsert=True
        )

    # 2. Restore Channels
    channels = backup_data.get("channels") or []
    if isinstance(channels, list):
        db.channels.delete_many({"user_id": user_id})
        for ch in channels:
            ch_doc = {
                "id": uuid.uuid4().hex[:24],
                "user_id": user_id,
                "name": ch.get("name", "Canal"),
                "description": ch.get("description", ""),
                "username": ch.get("username", ""),
                "active": ch.get("active", True),
                "replace_image": ch.get("replace_image", False),
                "is_coupon_group": ch.get("is_coupon_group", False),
                "target_whatsapp_groups": ch.get("target_whatsapp_groups") or [],
                "order": ch.get("order", 0)
            }
            db.channels.insert_one(ch_doc)

    # 3. Restore WhatsApp Groups
    groups = backup_data.get("whatsapp_groups") or []
    if isinstance(groups, list):
        db.whatsapp_groups.delete_many({"user_id": user_id})
        for g in groups:
            g_doc = {
                "id": uuid.uuid4().hex[:24],
                "user_id": user_id,
                "group_id": g.get("group_id") or uuid.uuid4().hex[:24],
                "name": g.get("name", "Grupo"),
                "keywords": g.get("keywords") or [],
                "footer_text": g.get("footer_text", ""),
                "active": g.get("active", True)
            }
            db.whatsapp_groups.insert_one(g_doc)

    # 4. Restore Telegram Destinations
    destinations = backup_data.get("telegram_destinations") or []
    if isinstance(destinations, list):
        db.telegram_destinations.delete_many({"user_id": user_id})
        for d in destinations:
            d_doc = {
                "id": uuid.uuid4().hex[:24],
                "user_id": user_id,
                "telegram_id": d.get("telegram_id") or uuid.uuid4().hex[:24],
                "name": d.get("name", "Canal Destino"),
                "admin": d.get("admin", False),
                "active": d.get("active", True)
            }
            db.telegram_destinations.insert_one(d_doc)

    # 5. Restore WhatsApp Sessions (Chips)
    sessions = backup_data.get("whatsapp_sessions") or []
    if isinstance(sessions, list):
        db.whatsapp_sessions.delete_many({"user_id": user_id})
        for s in sessions:
            s_doc = {
                "id": uuid.uuid4().hex[:24],
                "user_id": user_id,
                "name": s.get("name", "Sessão"),
                "active": s.get("active", True)
            }
            db.whatsapp_sessions.insert_one(s_doc)

    # 6. Restore Telegram Session File (.session)
    telegram_session_b64 = backup_data.get("telegram_session_b64")
    telegram_session_restored = False
    if telegram_session_b64 and isinstance(telegram_session_b64, str):
        try:
            os.makedirs(SESSIONS_DIR, exist_ok=True)
            session_target = os.path.join(SESSIONS_DIR, f"user_{user_id}.session")
            session_bytes = base64.b64decode(telegram_session_b64)
            with open(session_target, "wb") as f:
                f.write(session_bytes)
            telegram_session_restored = True
        except Exception:
            pass

    return {
        "success": True,
        "message": "Backup da conta importado e restaurado com sucesso!",
        "restored": {
            "channels_count": len(channels),
            "whatsapp_groups_count": len(groups),
            "telegram_destinations_count": len(destinations),
            "whatsapp_sessions_count": len(sessions),
            "telegram_session_restored": telegram_session_restored
        }
    }
