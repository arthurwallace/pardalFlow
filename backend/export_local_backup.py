import os
import sys
import json
import base64
from datetime import datetime

# Adjust path to import backend app
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import get_db

def export_backup():
    db = get_db()
    if db is None:
        print("[ERRO] Nao foi possivel conectar ao banco de dados.")
        return

    # Find Arthur's account
    user = db.users.find_one({"email": "arthur.wallace.silva@gmail.com"})
    if not user:
        print("[ERRO] Usuario arthur.wallace.silva@gmail.com nao encontrado no banco local.")
        return

    user_id = user["id"]
    print(f"[INFO] Exportando dados do usuario: {user['email']} (ID: {user_id})")

    # 1. User Config
    user_config_doc = db.user_configs.find_one({"user_id": user_id})
    user_config = {}
    if user_config_doc:
        c_data = user_config_doc.get("data", {})
        user_config = json.loads(c_data) if isinstance(c_data, str) else c_data

    # 2. Channels
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

    # 3. WhatsApp Groups
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

    # 5. WhatsApp Sessions
    raw_sess = list(db.whatsapp_sessions.find({"user_id": user_id}))
    whatsapp_sessions = []
    for s in raw_sess:
        whatsapp_sessions.append({
            "name": s.get("name"),
            "active": s.get("active", True)
        })

    # 6. Telegram Session file (.session)
    telegram_session_b64 = None
    sessions_dir = os.path.join(os.path.dirname(__file__), "sessions")
    session_file_path = os.path.join(sessions_dir, f"user_{user_id}.session")
    if not os.path.exists(session_file_path):
        # Check if individual session file exists
        session_file_path = os.path.join(sessions_dir, "telegram_user.session")

    if os.path.exists(session_file_path):
        try:
            with open(session_file_path, "rb") as f:
                telegram_session_b64 = base64.b64encode(f.read()).decode("utf-8")
                print(f"[OK] Sessao do Telegram encontrada e anexada ({len(telegram_session_b64)} chars)!")
        except Exception as e:
            print(f"[AVISO] Aviso ao ler sessao: {e}")

    backup_payload = {
        "format": "pardalflow_account_backup",
        "version": "2.0.0",
        "exported_at": datetime.utcnow().isoformat() + "Z",
        "user_email": user["email"],
        "user_config": user_config,
        "channels": channels,
        "whatsapp_groups": whatsapp_groups,
        "telegram_destinations": telegram_destinations,
        "whatsapp_sessions": whatsapp_sessions,
        "telegram_session_b64": telegram_session_b64
    }

    output_filename = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backup_conta_arthur.json")
    with open(output_filename, "w", encoding="utf-8") as f:
        json.dump(backup_payload, f, indent=2, ensure_ascii=False)

    print("==================================================")
    print(f"[SUCESSO] Backup gerado com sucesso!")
    print(f"Arquivo salvo em: {output_filename}")
    print(f"Resumo exportado:")
    print(f"   - Canais Monitorados: {len(channels)}")
    print(f"   - Grupos WhatsApp: {len(whatsapp_groups)}")
    print(f"   - Destinos Telegram: {len(telegram_destinations)}")
    print(f"   - Sessoes WhatsApp: {len(whatsapp_sessions)}")
    print(f"   - Sessao Telegram ativa: {'SIM' if telegram_session_b64 else 'NAO'}")
    print("==================================================")

if __name__ == "__main__":
    export_backup()
