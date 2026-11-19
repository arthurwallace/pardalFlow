import os
import json
import uuid
import time
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urlunparse
from sqlalchemy import (
    create_engine, Column, String, Integer, Boolean, Text, DateTime, Float, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from app.core.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

# ==========================================
# SQLAlchemy Models for PostgreSQL
# ==========================================

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String(64), primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), default="")
    is_active = Column(Boolean, default=True)
    role = Column(String(50), default="user")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "email": self.email,
            "hashed_password": self.hashed_password,
            "full_name": self.full_name,
            "is_active": self.is_active,
            "active": self.is_active,
            "role": self.role,
            "created_at": self.created_at
        }

class UserConfigModel(Base):
    __tablename__ = "user_configs"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), unique=True, nullable=False, index=True)
    data = Column(Text, default="{}")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        try:
            cfg = json.loads(self.data)
        except Exception:
            cfg = {}
        return {
            "_id": str(self.id),
            "id": str(self.id),
            "user_id": self.user_id,
            "data": cfg,
            "updated_at": self.updated_at
        }

class ChannelModel(Base):
    __tablename__ = "channels"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(500), default="")
    username = Column(String(255), default="")
    active = Column(Boolean, default=True)
    replace_image = Column(Boolean, default=False)
    is_coupon_group = Column(Boolean, default=False)
    target_whatsapp_groups = Column(Text, default="[]")
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            tg_groups = json.loads(self.target_whatsapp_groups)
        except Exception:
            tg_groups = []
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description or "",
            "username": self.username or "",
            "active": self.active,
            "replace_image": self.replace_image,
            "is_coupon_group": self.is_coupon_group,
            "whatsapp_destinations": tg_groups,
            "target_whatsapp_groups": tg_groups,
            "order": self.order or 0,
            "created_at": self.created_at
        }

class WhatsAppGroupModel(Base):
    __tablename__ = "whatsapp_groups"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    group_id = Column(String(100), default="", index=True)
    name = Column(String(255), nullable=False)
    keywords = Column(Text, default="[]")
    footer_text = Column(Text, default="")
    active = Column(Boolean, default=True)
    ml_tag = Column(String(100), default="")
    shopee_subid = Column(String(100), default="")
    amazon_tag = Column(String(100), default="")
    magalu_store = Column(String(100), default="")
    session_name = Column(String(100), default="")
    custom_template = Column(Text, default="")
    is_monitored = Column(Boolean, default=False)
    mirror_enabled = Column(Boolean, default=False)
    target_whatsapp_groups = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        try:
            kw = json.loads(self.keywords)
        except Exception:
            kw = []
        try:
            targets = json.loads(self.target_whatsapp_groups) if self.target_whatsapp_groups else []
        except Exception:
            targets = []
        return {
            "_id": self.id,
            "id": self.group_id or self.id,
            "id_db": self.id,
            "group_id": self.group_id or self.id,
            "user_id": self.user_id,
            "name": self.name,
            "keywords": kw,
            "footer_text": self.footer_text or "",
            "active": self.active,
            "ml_tag": self.ml_tag or "",
            "shopee_subid": self.shopee_subid or "",
            "amazon_tag": self.amazon_tag or "",
            "magalu_store": self.magalu_store or "",
            "session_name": self.session_name or "",
            "custom_template": self.custom_template or "",
            "is_monitored": self.is_monitored if self.is_monitored is not None else False,
            "mirror_enabled": self.mirror_enabled if self.mirror_enabled is not None else False,
            "target_whatsapp_groups": targets,
            "created_at": self.created_at
        }

class TelegramDestinationModel(Base):
    __tablename__ = "telegram_destinations"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    telegram_id = Column(String(100), default="", index=True)
    name = Column(String(255), nullable=False)
    admin = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.telegram_id or self.id,
            "id_db": self.id,
            "telegram_id": self.telegram_id or self.id,
            "user_id": self.user_id,
            "name": self.name,
            "admin": self.admin,
            "active": self.active,
            "created_at": self.created_at
        }

class WhatsAppSessionModel(Base):
    __tablename__ = "whatsapp_sessions"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    active = Column(Boolean, default=True)
    phone = Column(String(50), default="")
    status = Column(String(50), default="STOPPED")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "id_db": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "active": self.active,
            "phone": self.phone or "",
            "status": self.status or "STOPPED",
            "created_at": self.created_at
        }

class SentOfferModel(Base):
    __tablename__ = "sent_offers"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    product_name = Column(String(500), nullable=False)
    price = Column(String(100), default=None)
    channel_name = Column(String(255), default="")
    original_text = Column(Text, default="")
    converted_text = Column(Text, default="")
    target_groups = Column(Text, default="[]")
    platform = Column(String(100), default="Multi-plataforma")
    status = Column(String(100), default="Enviado com sucesso")
    sent_at = Column(DateTime, default=datetime.utcnow, index=True)
    success = Column(Boolean, default=True)

    def to_dict(self):
        try:
            tg = json.loads(self.target_groups)
        except Exception:
            tg = []
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "product_name": self.product_name,
            "price": self.price,
            "channel_name": self.channel_name,
            "original_text": self.original_text,
            "converted_text": self.converted_text,
            "target_groups": tg,
            "platform": self.platform,
            "status": self.status,
            "sent_at": self.sent_at,
            "success": self.success
        }

class TelegramSessionModel(Base):
    __tablename__ = "telegram_sessions"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), unique=True, nullable=False, index=True)
    phone = Column(String(50), default="")
    api_id = Column(String(50), default="")
    api_hash = Column(String(100), default="")
    session_string = Column(Text, default="")
    phone_code_hash = Column(String(100), default="")
    is_connected = Column(Boolean, default=False)
    account_name = Column(String(255), default="")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "phone": self.phone,
            "api_id": self.api_id,
            "api_hash": self.api_hash,
            "session_string": self.session_string,
            "phone_code_hash": self.phone_code_hash,
            "is_connected": self.is_connected,
            "account_name": self.account_name,
            "updated_at": self.updated_at
        }

class LogModel(Base):
    __tablename__ = "logs"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    message = Column(Text, default="")

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "timestamp": self.timestamp,
            "message": self.message
        }

class PlatformCookieModel(Base):
    __tablename__ = "platform_cookies"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True) # mercadolivre, amazon, magalu, shopee
    cookies = Column(Text, default="")
    status = Column(String(50), default="unknown") # valid, expired, unknown
    last_updated = Column(DateTime, default=datetime.utcnow)
    extra_data = Column(Text, default="{}")

    def to_dict(self):
        try:
            extra = json.loads(self.extra_data) if self.extra_data else {}
        except Exception:
            extra = {}
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "cookies": self.cookies,
            "status": self.status,
            "last_updated": self.last_updated,
            "extra_data": extra
        }

class MessageQueueModel(Base):
    __tablename__ = "message_queue"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    queue_type = Column(String(50), default="ofertas", index=True) # ofertas, cupons, vitrine, broadcast
    payload = Column(Text, default="{}")
    status = Column(String(50), default="pending", index=True) # pending, processing, sent, failed, paused
    attempts = Column(Integer, default=0)
    error_message = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    scheduled_for = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        try:
            p = json.loads(self.payload) if self.payload else {}
        except Exception:
            p = {}
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "queue_type": self.queue_type,
            "payload": p,
            "status": self.status,
            "attempts": self.attempts,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "scheduled_for": self.scheduled_for
        }

class GroupEventModel(Base):
    __tablename__ = "group_events"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    group_id = Column(String(100), nullable=False, index=True)
    group_name = Column(String(255), default="")
    event_type = Column(String(50), nullable=False, index=True) # join, leave, add, remove
    participant = Column(String(100), default="")
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "group_id": self.group_id,
            "group_name": self.group_name,
            "event_type": self.event_type,
            "participant": self.participant,
            "timestamp": self.timestamp
        }

class VitrineProductModel(Base):
    __tablename__ = "vitrine_products"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    item_id = Column(String(100), default="", index=True)
    shop_id = Column(String(100), default="", index=True)
    title = Column(String(500), nullable=False)
    price = Column(String(100), default="")
    commission_rate = Column(Float, default=0.0)
    commission_value = Column(Float, default=0.0)
    image_url = Column(String(1000), default="")
    product_url = Column(String(1000), default="")
    affiliate_url = Column(String(1000), default="")
    category = Column(String(100), default="noivas")
    status = Column(String(50), default="active", index=True) # active, paused, posted
    last_posted_at = Column(DateTime, default=None)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "item_id": self.item_id,
            "shop_id": self.shop_id,
            "title": self.title,
            "price": self.price,
            "commission_rate": self.commission_rate,
            "commission_value": self.commission_value,
            "image_url": self.image_url,
            "product_url": self.product_url,
            "affiliate_url": self.affiliate_url,
            "category": self.category,
            "status": self.status,
            "last_posted_at": self.last_posted_at,
            "created_at": self.created_at
        }

class AffiliateMetricModel(Base):
    __tablename__ = "affiliate_metrics"
    id = Column(String(64), primary_key=True)
    user_id = Column(String(64), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True) # shopee, mercadolivre, amazon, magalu
    metric_type = Column(String(50), nullable=False, index=True) # clicks, commission, sales
    date = Column(DateTime, default=datetime.utcnow, index=True)
    data = Column(Text, default="{}")

    def to_dict(self):
        try:
            d = json.loads(self.data) if self.data else {}
        except Exception:
            d = {}
        return {
            "_id": self.id,
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "metric_type": self.metric_type,
            "date": self.date,
            "data": d
        }

# ==========================================
# Generic Table Collection Adapter
# ==========================================

class InsertResult:
    def __init__(self, doc_id: str):
        self.inserted_id = doc_id
        self.inserted_ids = [doc_id]

class InsertManyResult:
    def __init__(self, doc_ids: List[str]):
        self.inserted_ids = doc_ids

class DeleteResult:
    def __init__(self, count: int):
        self.deleted_count = count

    def __bool__(self):
        return self.deleted_count > 0

class TableCollection:
    def __init__(self, model_class, session_factory):
        self.model = model_class
        self.session_factory = session_factory

    def _apply_filter(self, query, filter_dict: dict):
        for k, v in filter_dict.items():
            str_v = str(v) if v is not None else None
            if k == "id_db":
                query = query.filter(self.model.id == str_v)
            elif k in ("_id", "id"):
                if hasattr(self.model, "group_id"):
                    query = query.filter((self.model.id == str_v) | (self.model.group_id == str_v))
                elif hasattr(self.model, "telegram_id"):
                    query = query.filter((self.model.id == str_v) | (self.model.telegram_id == str_v))
                else:
                    query = query.filter(self.model.id == str_v)
            elif hasattr(self.model, k):
                query = query.filter(getattr(self.model, k) == v)
        return query

    def find_one(self, filter_dict: dict) -> Optional[dict]:
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            item = query.first()
            return item.to_dict() if item else None
        finally:
            session.close()

    def find(self, filter_dict: Optional[dict] = None):
        filter_dict = filter_dict or {}
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            return QueryCursor(query, session)
        except Exception:
            session.close()
            raise

    def insert_one(self, doc: dict) -> InsertResult:
        session = self.session_factory()
        try:
            data = dict(doc)
            if hasattr(self.model, "group_id"):
                data["group_id"] = str(doc.get("group_id") or doc.get("id") or "")
                doc_id = str(doc.get("_id") or doc.get("id_db") or uuid.uuid4().hex[:24])
            elif hasattr(self.model, "telegram_id"):
                data["telegram_id"] = str(doc.get("telegram_id") or doc.get("id") or "")
                doc_id = str(doc.get("_id") or doc.get("id_db") or uuid.uuid4().hex[:24])
            else:
                doc_id = str(doc.get("_id") or doc.get("id") or doc.get("id_db") or uuid.uuid4().hex[:24])

            data["id"] = doc_id
            if "_id" in data:
                del data["_id"]
            if "id_db" in data:
                del data["id_db"]

            # Map alias columns
            if "whatsapp_destinations" in data and "target_whatsapp_groups" not in data:
                data["target_whatsapp_groups"] = data["whatsapp_destinations"]

            # Convert JSON serialized fields
            for field in ("data", "target_whatsapp_groups", "target_groups", "keywords", "payload", "extra_data"):
                if field in data and not isinstance(data[field], str):
                    data[field] = json.dumps(data[field], default=str)

            # Filter valid columns
            valid_cols = {c.name for c in self.model.__table__.columns}
            filtered_data = {k: v for k, v in data.items() if k in valid_cols}

            instance = self.model(**filtered_data)
            session.add(instance)
            session.commit()
            return InsertResult(doc_id)
        finally:
            session.close()

    def insert_many(self, docs: List[dict]) -> InsertManyResult:
        session = self.session_factory()
        try:
            inserted_ids = []
            instances = []
            valid_cols = {c.name for c in self.model.__table__.columns}

            for doc in docs:
                data = dict(doc)
                if hasattr(self.model, "group_id"):
                    data["group_id"] = str(doc.get("group_id") or doc.get("id") or "")
                    doc_id = str(doc.get("_id") or doc.get("id_db") or uuid.uuid4().hex[:24])
                elif hasattr(self.model, "telegram_id"):
                    data["telegram_id"] = str(doc.get("telegram_id") or doc.get("id") or "")
                    doc_id = str(doc.get("_id") or doc.get("id_db") or uuid.uuid4().hex[:24])
                else:
                    doc_id = str(doc.get("_id") or doc.get("id") or doc.get("id_db") or uuid.uuid4().hex[:24])

                data["id"] = doc_id
                if "_id" in data:
                    del data["_id"]
                if "id_db" in data:
                    del data["id_db"]

                if "whatsapp_destinations" in data and "target_whatsapp_groups" not in data:
                    data["target_whatsapp_groups"] = data["whatsapp_destinations"]

                for field in ("data", "target_whatsapp_groups", "target_groups", "keywords", "payload", "extra_data"):
                    if field in data and not isinstance(data[field], str):
                        data[field] = json.dumps(data[field], default=str)

                filtered_data = {k: v for k, v in data.items() if k in valid_cols}
                instances.append(self.model(**filtered_data))
                inserted_ids.append(doc_id)

            session.add_all(instances)
            session.commit()
            return InsertManyResult(inserted_ids)
        finally:
            session.close()

    def update_one(self, filter_dict: dict, update_dict: dict, upsert: bool = False) -> Any:
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            instance = query.first()
            set_data = update_dict.get("$set", update_dict)

            # Map alias
            if "whatsapp_destinations" in set_data and "target_whatsapp_groups" not in set_data:
                set_data["target_whatsapp_groups"] = set_data["whatsapp_destinations"]
            if hasattr(self.model, "group_id") and "id" in set_data:
                set_data["group_id"] = str(set_data["id"]).strip()
            if hasattr(self.model, "telegram_id") and "id" in set_data:
                set_data["telegram_id"] = str(set_data["id"]).strip()

            if not instance and upsert:
                doc_id = str(filter_dict.get("id") or filter_dict.get("_id") or filter_dict.get("id_db") or uuid.uuid4().hex[:24])
                init_data = dict(filter_dict)
                init_data.update(set_data)
                init_data["id"] = doc_id
                if "_id" in init_data:
                    del init_data["_id"]
                if "id_db" in init_data:
                    del init_data["id_db"]

                for field in ("data", "target_whatsapp_groups", "target_groups", "keywords", "payload", "extra_data"):
                    if field in init_data and not isinstance(init_data[field], str):
                        init_data[field] = json.dumps(init_data[field])

                valid_cols = {c.name for c in self.model.__table__.columns}
                init_data = {k: v for k, v in init_data.items() if k in valid_cols}
                instance = self.model(**init_data)
                session.add(instance)
            elif instance:
                for k, v in set_data.items():
                    if k in ("_id", "id", "id_db"):
                        continue
                    if k in ("data", "target_whatsapp_groups", "target_groups", "keywords", "payload", "extra_data") and not isinstance(v, str):
                        v = json.dumps(v)
                    if hasattr(instance, k):
                        setattr(instance, k, v)

            session.commit()
        finally:
            session.close()

    def find_one_and_update(self, filter_dict: dict, update_dict: dict, return_document: bool = True) -> Optional[dict]:
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            instance = query.first()
            if not instance:
                return None

            set_data = update_dict.get("$set", update_dict)
            if "whatsapp_destinations" in set_data and "target_whatsapp_groups" not in set_data:
                set_data["target_whatsapp_groups"] = set_data["whatsapp_destinations"]
            if hasattr(self.model, "group_id") and "id" in set_data:
                set_data["group_id"] = str(set_data["id"]).strip()
            if hasattr(self.model, "telegram_id") and "id" in set_data:
                set_data["telegram_id"] = str(set_data["id"]).strip()

            for k, v in set_data.items():
                if k in ("_id", "id", "id_db"):
                    continue
                if k in ("data", "target_whatsapp_groups", "target_groups", "keywords") and not isinstance(v, str):
                    v = json.dumps(v)
                if hasattr(instance, k):
                    setattr(instance, k, v)

            session.commit()
            return instance.to_dict()
        finally:
            session.close()

    def delete_one(self, filter_dict: dict) -> DeleteResult:
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            item = query.first()
            if item:
                session.delete(item)
                session.commit()
                return DeleteResult(1)
            return DeleteResult(0)
        finally:
            session.close()

    def delete_many(self, filter_dict: dict) -> DeleteResult:
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            count = query.delete(synchronize_session=False)
            session.commit()
            return DeleteResult(count)
        finally:
            session.close()

    def count_documents(self, filter_dict: Optional[dict] = None) -> int:
        filter_dict = filter_dict or {}
        session = self.session_factory()
        try:
            query = self._apply_filter(session.query(self.model), filter_dict)
            return query.count()
        finally:
            session.close()

class QueryCursor:
    def __init__(self, query, session):
        self.query = query
        self.session = session
        self._order_by = None
        self._skip = 0
        self._limit = None

    def sort(self, field: str, direction: int = 1):
        # direction 1 = ASC, -1 = DESC
        model = self.query.column_descriptions[0]["type"]
        if hasattr(model, field):
            col = getattr(model, field)
            self.query = self.query.order_by(col.desc() if direction == -1 else col.asc())
        return self

    def skip(self, n: int):
        self.query = self.query.offset(n)
        return self

    def limit(self, n: int):
        self.query = self.query.limit(n)
        return self

    def count(self) -> int:
        return self.query.count()

    def __iter__(self):
        try:
            for item in self.query.all():
                yield item.to_dict()
        finally:
            self.session.close()

# ==========================================
# Database Connection Manager
# ==========================================

class PostgresDB:
    def __init__(self, engine, session_factory):
        self.engine = engine
        self.session_factory = session_factory
        self.users = TableCollection(UserModel, session_factory)
        self.user_configs = TableCollection(UserConfigModel, session_factory)
        self.channels = TableCollection(ChannelModel, session_factory)
        self.whatsapp_groups = TableCollection(WhatsAppGroupModel, session_factory)
        self.telegram_destinations = TableCollection(TelegramDestinationModel, session_factory)
        self.whatsapp_sessions = TableCollection(WhatsAppSessionModel, session_factory)
        self.sent_offers = TableCollection(SentOfferModel, session_factory)
        self.telegram_sessions = TableCollection(TelegramSessionModel, session_factory)
        self.logs = TableCollection(LogModel, session_factory)
        self.platform_cookies = TableCollection(PlatformCookieModel, session_factory)
        self.message_queue = TableCollection(MessageQueueModel, session_factory)
        self.group_events = TableCollection(GroupEventModel, session_factory)
        self.vitrine_products = TableCollection(VitrineProductModel, session_factory)
        self.affiliate_metrics = TableCollection(AffiliateMetricModel, session_factory)

_db_instance: Optional[PostgresDB] = None

def _ensure_database_exists(db_url: str):
    """
    Verifica se o banco de dados de destino existe no PostgreSQL.
    Caso não exista (ex: pardal_flow ou pardal_flow_dev), conecta ao banco 'postgres'
    com AUTOCOMMIT e executa 'CREATE DATABASE <nome>' automaticamente.
    """
    try:
        raw_url = db_url
        if raw_url.startswith("postgresql+psycopg2://"):
            raw_url = raw_url.replace("postgresql+psycopg2://", "postgresql://", 1)

        parsed = urlparse(raw_url)
        db_name = parsed.path.lstrip('/')
        if '?' in db_name:
            db_name = db_name.split('?')[0]

        if not db_name or db_name.lower() in ('postgres', 'template1'):
            return

        admin_path = '/postgres'
        admin_url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            admin_path,
            '',
            parsed.query,
            ''
        ))
        if admin_url.startswith("postgresql://"):
            admin_url = admin_url.replace("postgresql://", "postgresql+psycopg2://", 1)

        connect_args = {"connect_timeout": 5}
        if "sslmode=require" in admin_url.lower():
            connect_args["sslmode"] = "require"

        admin_engine = create_engine(
            admin_url,
            isolation_level="AUTOCOMMIT",
            connect_args=connect_args
        )
        with admin_engine.connect() as conn:
            check_sql = text("SELECT 1 FROM pg_database WHERE datname = :dname")
            exists = conn.execute(check_sql, {"dname": db_name}).fetchone()
            if not exists:
                logger.info(f"🛠️ Banco '{db_name}' não existe no PostgreSQL ({parsed.netloc}). Criando banco automaticamente...")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"✅ Banco de dados '{db_name}' criado com sucesso no PostgreSQL!")
        admin_engine.dispose()
    except Exception as e:
        logger.debug(f"Aviso na verificação automática de banco '{db_url}': {e}")

def get_db() -> PostgresDB:
    """
    Retorna a instância do banco de dados relacional PostgreSQL.
    Conecta de forma direta e estrita ao PostgreSQL configurado no .env (DATABASE_URL),
    seja ele na nuvem (Cloudflare Hyperdrive / Neon / Supabase) ou local/Docker.
    Elimina 100% qualquer uso ou dependência de arquivos SQLite locais (.db).
    """
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    db_url = (os.getenv("DATABASE_URL") or settings.DATABASE_URL or "").strip()
    if not db_url:
        pg_user = os.getenv("POSTGRES_USER") or settings.POSTGRES_USER or "postgres"
        pg_pass = os.getenv("POSTGRES_PASSWORD") or settings.POSTGRES_PASSWORD or ""
        pg_host = os.getenv("POSTGRES_HOST") or settings.POSTGRES_HOST or "localhost"
        pg_port = os.getenv("POSTGRES_PORT") or settings.POSTGRES_PORT or "5432"
        pg_db = os.getenv("POSTGRES_DB") or settings.POSTGRES_DB or "pardal_flow_dev"
        db_url = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

    # Garante que o banco exista antes de tentar conectar
    _ensure_database_exists(db_url)

    # Ensure SQLAlchemy uses psycopg2 driver directly without requiring psycopg v3
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    masked_url = db_url.split('@')[-1] if '@' in db_url else db_url
    logger.info(f"🐘 Conectando ao PostgreSQL ({masked_url})...")

    max_retries = 3
    retry_delay = 2
    engine = None

    for attempt in range(1, max_retries + 1):
        try:
            connect_args = {"connect_timeout": 10}
            if "sslmode=require" in db_url.lower() or "neon.tech" in db_url.lower() or "supabase" in db_url.lower():
                connect_args["sslmode"] = "require"

            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args=connect_args
            )
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            Base.metadata.create_all(engine)
            # Garante que novas colunas adicionadas ao modelo existam no PostgreSQL
            try:
                with engine.connect() as conn:
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS ml_tag VARCHAR(100) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS shopee_subid VARCHAR(100) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS amazon_tag VARCHAR(100) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS magalu_store VARCHAR(100) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS session_name VARCHAR(100) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS custom_template TEXT DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS is_monitored BOOLEAN DEFAULT FALSE"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS mirror_enabled BOOLEAN DEFAULT FALSE"))
                    conn.execute(text("ALTER TABLE whatsapp_groups ADD COLUMN IF NOT EXISTS target_whatsapp_groups TEXT DEFAULT '[]'"))
                    conn.execute(text("ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT ''"))
                    conn.execute(text("ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'STOPPED'"))
                    conn.commit()
            except Exception as e_col:
                logger.debug(f"Aviso de verificação de colunas PostgreSQL: {e_col}")
            logger.info("✅ Conexão com banco PostgreSQL estabelecida com sucesso!")
            break
        except Exception as e:
            if attempt < max_retries:
                logger.warning(f"⚠️ Tentativa {attempt}/{max_retries} de conexão com PostgreSQL falhou ({e}). Tentando novamente em {retry_delay}s...")
                time.sleep(retry_delay)
            else:
                logger.error(f"❌ FALHA CRÍTICA: Não foi possível conectar ao banco PostgreSQL ({masked_url}): {e}")
                raise RuntimeError(
                    f"Falha de conexão com PostgreSQL ({masked_url}): {e}.\n"
                    f"Verifique se o DATABASE_URL no .env (ou .env.development) aponta para um banco PostgreSQL válido (ex: Cloudflare Hyperdrive / Neon / Supabase)."
                )

    session_factory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
    _db_instance = PostgresDB(engine, session_factory)
    
    # Auto-seed essential default user and channels if database is completely empty
    _ensure_initial_seed(_db_instance)
    return _db_instance


def _ensure_initial_seed(db: PostgresDB):
    """
    Carrega dados iniciais opcionais a partir de seed_data.json se presente.
    Nunca expõe credenciais ou contatos pessoais no código-fonte.
    """
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        seed_path = os.path.join(backend_dir, "seed_data.json")
        if not os.path.exists(seed_path):
            return

        with open(seed_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        users = data.get("users", [])
        if users and db.users.count_documents({}) == 0:
            for u in users:
                db.users.insert_one(u)
            logger.info(f"{len(users)} usuário(s) carregado(s) a partir do seed_data.json.")

        channels = data.get("channels", [])
        if channels and db.channels.count_documents({}) == 0:
            for c in channels:
                db.channels.insert_one(c)

        wa_groups = data.get("whatsapp_groups", [])
        if wa_groups and db.whatsapp_groups.count_documents({}) == 0:
            for g in wa_groups:
                db.whatsapp_groups.insert_one(g)

        wa_sessions = data.get("whatsapp_sessions", [])
        if wa_sessions and db.whatsapp_sessions.count_documents({}) == 0:
            for s in wa_sessions:
                db.whatsapp_sessions.insert_one(s)

        tg_dests = data.get("telegram_destinations", [])
        if tg_dests and db.telegram_destinations.count_documents({}) == 0:
            for t in tg_dests:
                db.telegram_destinations.insert_one(t)

    except Exception as e:
        logger.debug(f"Aviso no seed opcional do banco: {e}")

