"""
Script de migração de dados para PostgreSQL / Banco Relacional do Pardal PromoHub.
Migra dados da base MongoDB Atlas (ou SQLite existente) para a base relacional com suporte idempotente.
Pode ser executado localmente ou dentro do container Docker.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("migration")

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import (
    get_db, Base, UserModel, UserConfigModel, ChannelModel,
    WhatsAppGroupModel, TelegramDestinationModel, WhatsAppSessionModel,
    SentOfferModel, LogModel
)

MONGO_URI = os.getenv("MONGO_URI", "")
DB_NAME = os.getenv("DB_NAME", "PardalDasPromosBotDB")

def get_mongo_data():
    """Tenta extrair dados do MongoDB caso MONGO_URI esteja definida no ambiente."""
    if not MONGO_URI:
        return None
    try:
        from pymongo import MongoClient
        logger.info("Conectando ao MongoDB...")
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        m_db = client[DB_NAME]
        logger.info("✅ Conexão com MongoDB estabelecida com sucesso.")
        return m_db
    except Exception as e:
        logger.warning(f"⚠️ Não foi possível conectar ao MongoDB ({e}).")
        return None

def get_seed_file_data():
    """Lê os dados locais de contingência de seed_data.json caso o MongoDB esteja offline."""
    seed_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_data.json")
    if os.path.exists(seed_file):
        try:
            with open(seed_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Não foi possível ler seed_data.json: {e}")
    return None

def migrate():
    logger.info("🦅 Iniciando Migração para Banco Relacional / PostgreSQL...")
    db = get_db()
    default_user_id = os.getenv("DEFAULT_USER_ID", "6ae0df757ec0ae10ea42e1a5")

    m_db = get_mongo_data()

    if m_db is not None:
        logger.info("📥 Extraindo e migrando dados do MongoDB Atlas...")

        # 1. Usuários
        mongo_users = list(m_db.users.find({}))
        logger.info(f"Encontrados {len(mongo_users)} usuários no MongoDB.")
        for u in mongo_users:
            u_id = str(u.get("_id") or u.get("id"))
            existing = db.users.find_one({"id": u_id})
            if not existing:
                db.users.insert_one({
                    "id": u_id,
                    "email": u.get("email"),
                    "hashed_password": u.get("hashed_password"),
                    "full_name": u.get("full_name", ""),
                    "is_active": u.get("is_active", True),
                    "role": u.get("role", "user"),
                    "created_at": u.get("created_at") or datetime.now(timezone.utc)
                })

        # 2. Configurações de Usuário
        mongo_configs = list(m_db.user_configs.find({}))
        logger.info(f"Encontradas {len(mongo_configs)} configurações no MongoDB.")
        for cfg in mongo_configs:
            u_id = str(cfg.get("user_id"))
            cfg_data = cfg.get("data", {})
            if isinstance(cfg_data, dict):
                cfg_str = json.dumps(cfg_data, default=str)
            else:
                cfg_str = str(cfg_data)
            db.user_configs.update_one(
                {"user_id": u_id},
                {"$set": {"data": cfg_str}},
                upsert=True
            )

        # 3. Canais Monitorados
        mongo_channels = list(m_db.channels.find({}))
        logger.info(f"Encontrados {len(mongo_channels)} canais monitorados no MongoDB.")
        for c in mongo_channels:
            c_id = str(c.get("id") or c.get("_id"))
            u_id = str(c.get("user_id") or default_user_id)
            c_name = c.get("name", "").strip()

            target_wa = c.get("target_whatsapp_groups") or c.get("whatsapp_destinations") or []
            if not isinstance(target_wa, list):
                try:
                    target_wa = json.loads(target_wa)
                except Exception:
                    target_wa = []

            existing = db.channels.find_one({"user_id": u_id, "name": c_name})
            channel_doc = {
                "id": c_id,
                "user_id": u_id,
                "name": c_name,
                "description": c.get("description", "") or "",
                "username": c.get("username", "") or "",
                "active": c.get("active", True),
                "replace_image": c.get("replace_image", False),
                "is_coupon_group": c.get("is_coupon_group", False),
                "target_whatsapp_groups": target_wa,
                "order": c.get("order", 0) or 0
            }

            if existing:
                db.channels.update_one({"id": existing["id"]}, {"$set": channel_doc})
            else:
                db.channels.insert_one(channel_doc)

        # 4. Grupos do WhatsApp
        mongo_wa = list(m_db.whatsapp_groups.find({}))
        logger.info(f"Encontrados {len(mongo_wa)} grupos do WhatsApp no MongoDB.")
        for w in mongo_wa:
            w_id = str(w.get("id") or w.get("_id") or "")
            db_id = str(w.get("_id") or "")
            u_id = str(w.get("user_id") or default_user_id)
            existing = db.whatsapp_groups.find_one({"id": w_id, "user_id": u_id})
            wa_doc = {
                "id": w_id,
                "group_id": w_id,
                "_id": db_id if db_id else None,
                "user_id": u_id,
                "name": w.get("name", "Grupo WhatsApp"),
                "keywords": w.get("keywords", []) or [],
                "footer_text": w.get("footer_text", "") or "",
                "active": w.get("active", True)
            }
            if existing:
                db.whatsapp_groups.update_one({"id_db": existing["id_db"]}, {"$set": wa_doc})
            else:
                db.whatsapp_groups.insert_one(wa_doc)

        # 5. Destinos do Telegram
        mongo_tg = list(m_db.telegram_destinations.find({}))
        logger.info(f"Encontrados {len(mongo_tg)} destinos do Telegram no MongoDB.")
        for t in mongo_tg:
            t_id = str(t.get("id") or t.get("_id") or "")
            db_id = str(t.get("_id") or "")
            u_id = str(t.get("user_id") or default_user_id)
            existing = db.telegram_destinations.find_one({"id": t_id, "user_id": u_id})
            tg_doc = {
                "id": t_id,
                "telegram_id": t_id,
                "_id": db_id if db_id else None,
                "user_id": u_id,
                "name": t.get("name", "Canal Telegram"),
                "admin": t.get("admin", False),
                "active": t.get("active", True)
            }
            if existing:
                db.telegram_destinations.update_one({"id_db": existing["id_db"]}, {"$set": tg_doc})
            else:
                db.telegram_destinations.insert_one(tg_doc)

        # 6. Sessões WhatsApp
        mongo_sessions = list(m_db.whatsapp_sessions.find({}))
        logger.info(f"Encontradas {len(mongo_sessions)} sessões WhatsApp no MongoDB.")
        for s in mongo_sessions:
            s_name = s.get("name", "WHATS_BUSSINESS_01")
            u_id = str(s.get("user_id") or default_user_id)
            existing = db.whatsapp_sessions.find_one({"name": s_name, "user_id": u_id})
            if not existing:
                db.whatsapp_sessions.insert_one({
                    "id": str(s.get("_id") or s.get("id")),
                    "user_id": u_id,
                    "name": s_name,
                    "active": s.get("active", True)
                })

        # 7. Ofertas Disparadas (Apenas reais, ignorando fakes de teste)
        mock_titles = {
            "Smartphone Xiaomi Redmi Note 13 256GB 8GB RAM",
            "Vestido Noiva Minimalista Tubinho Branco Cetim",
            "Fritadeira Sem Óleo Air Fryer Mondial 4L Inox",
            "Creatina Monohidratada 100% Pura 500g Soldiers Nutrition",
            "Carrinho de Bebê Burigotto com Bebê Conforto"
        }
        mongo_offers = list(m_db.sent_offers.find({}))
        logger.info(f"Encontradas {len(mongo_offers)} ofertas disparadas no MongoDB.")
        for o in mongo_offers:
            prod_name = o.get("product_name", "Oferta")
            if prod_name in mock_titles:
                continue
            o_id = str(o.get("_id") or o.get("id"))
            u_id = str(o.get("user_id") or default_user_id)
            existing = db.sent_offers.find_one({"id": o_id})
            if not existing:
                db.sent_offers.insert_one({
                    "id": o_id,
                    "user_id": u_id,
                    "product_name": prod_name,
                    "price": o.get("price"),
                    "channel_name": o.get("channel_name", ""),
                    "original_text": o.get("original_text", ""),
                    "converted_text": o.get("converted_text", ""),
                    "target_groups": o.get("target_groups", []),
                    "platform": o.get("platform", "Multi-plataforma"),
                    "status": o.get("status", "Enviado com sucesso"),
                    "sent_at": o.get("sent_at") or datetime.now(timezone.utc),
                    "success": o.get("success", True)
                })
    else:
        seed = get_seed_file_data()
        if seed:
            logger.info("📦 Utilizando seed_data.json como fonte de migração offline...")
            for u in seed.get("users", []):
                u_id = str(u.get("id") or u.get("_id"))
                if not db.users.find_one({"id": u_id}):
                    db.users.insert_one(u)
            for cfg in seed.get("user_configs", []):
                u_id = str(cfg.get("user_id"))
                cfg_data = cfg.get("data", {})
                cfg_str = json.dumps(cfg_data, default=str) if isinstance(cfg_data, dict) else str(cfg_data)
                db.user_configs.update_one({"user_id": u_id}, {"$set": {"data": cfg_str}}, upsert=True)
            for c in seed.get("channels", []):
                c_name = c.get("name", "").strip()
                u_id = str(c.get("user_id") or default_user_id)
                if not db.channels.find_one({"user_id": u_id, "name": c_name}):
                    db.channels.insert_one(c)
            for w in seed.get("whatsapp_groups", []):
                w_id = str(w.get("id") or "")
                u_id = str(w.get("user_id") or default_user_id)
                if not db.whatsapp_groups.find_one({"id": w_id, "user_id": u_id}):
                    db.whatsapp_groups.insert_one(w)
            for t in seed.get("telegram_destinations", []):
                t_id = str(t.get("id") or "")
                u_id = str(t.get("user_id") or default_user_id)
                if not db.telegram_destinations.find_one({"id": t_id, "user_id": u_id}):
                    db.telegram_destinations.insert_one(t)
            for s in seed.get("whatsapp_sessions", []):
                s_name = s.get("name", "")
                u_id = str(s.get("user_id") or default_user_id)
                if not db.whatsapp_sessions.find_one({"name": s_name, "user_id": u_id}):
                    db.whatsapp_sessions.insert_one(s)
            for o in seed.get("sent_offers", []):
                o_id = str(o.get("id") or o.get("_id") or "")
                if not db.sent_offers.find_one({"id": o_id}):
                    db.sent_offers.insert_one(o)

    # Summary report
    logger.info("="*50)
    logger.info("RESUMO DO BANCO RELACIONAL APOS MIGRACAO:")
    logger.info("="*50)
    logger.info(f"Usuarios: {db.users.count_documents({})}")
    logger.info(f"Configuracoes: {db.user_configs.count_documents({})}")
    logger.info(f"Canais Monitorados: {db.channels.count_documents({})}")
    logger.info(f"Grupos WhatsApp: {db.whatsapp_groups.count_documents({})}")
    logger.info(f"Destinos Telegram: {db.telegram_destinations.count_documents({})}")
    logger.info(f"Sessoes WhatsApp: {db.whatsapp_sessions.count_documents({})}")
    logger.info(f"Ofertas Disparadas: {db.sent_offers.count_documents({})}")
    logger.info("="*50)
    logger.info("Migracao concluida com sucesso!")

if __name__ == "__main__":
    migrate()
