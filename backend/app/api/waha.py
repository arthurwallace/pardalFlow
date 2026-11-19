import random
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, Request

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.waha_client import WahaClient
from app.services.telegram_bot_service import TelegramBotAssistant
from app.services.link_converter import LinkConverter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/waha", tags=["WhatsApp WAHA & Disparos"])

class BroadcastRequest(BaseModel):
    session_name: Optional[str] = "default"
    templates: List[str]
    min_participants: int = 70
    ignore_announce_only: bool = True
    mention_all: bool = False
    delay_between_groups: int = 8

class SessionCreateRequest(BaseModel):
    name: str
    start: bool = True

class GroupImportRequest(BaseModel):
    session_name: str
    group_id: str
    name: str
    action: str = "destination"  # "destination" | "monitored" | "both"
    ml_tag: Optional[str] = None
    shopee_subid: Optional[str] = None
    amazon_tag: Optional[str] = None
    magalu_store: Optional[str] = None
    footer_text: Optional[str] = None

def _get_waha_client(current_user: dict, db=None) -> WahaClient:
    if db is None:
        db = get_db()
    cfg_doc = db.user_configs.find_one({"user_id": current_user["id"]}) if db else None
    cfg = cfg_doc.get("data", {}) if cfg_doc else {}
    waha_url = (cfg.get("waha_base_url") or "http://192.168.1.25:3000").strip()
    if not waha_url or "localhost" in waha_url or "127.0.0.1" in waha_url:
        waha_url = "http://192.168.1.25:3000"
    waha_key = (cfg.get("waha_api_key") or "6f1186b6522246c1b0015b9117d56d05").strip()
    return WahaClient(base_url=waha_url, api_key=waha_key)

@router.get("/sessions")
async def list_waha_sessions(current_user: dict = Depends(get_current_user)):
    """Lista as sessões do WAHA conectadas e seus respectivos status."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    sessions = await client.list_sessions()

    # Sincroniza sessões no banco do usuário se encontradas
    if db and sessions:
        for s in sessions:
            s_name = s.get("name")
            if s_name:
                me_info = s.get("me") or {}
                raw_phone = me_info.get("id") or s.get("phone") or ""
                phone = raw_phone.split("@")[0] if "@" in str(raw_phone) else str(raw_phone)
                s["phone"] = phone
                db.whatsapp_sessions.update_one(
                    {"user_id": current_user["id"], "name": s_name},
                    {"$set": {
                        "status": s.get("status", "WORKING"),
                        "phone": phone,
                        "engine": s.get("engine", "NOWEB"),
                        "updated_at": datetime.now(timezone.utc)
                    }},
                    upsert=True
                )
    return {"sessions": sessions, "base_url": client.base_url}

@router.post("/sessions")
async def create_waha_session(body: SessionCreateRequest, current_user: dict = Depends(get_current_user)):
    """Cria uma nova sessão no WAHA e registra no banco do usuário."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    res = await client.create_session(body.name, start=body.start)
    
    # Salva na tabela do usuário se não existir
    if db:
        existing = db.whatsapp_sessions.find_one({"user_id": current_user["id"], "name": body.name})
        if not existing:
            db.whatsapp_sessions.insert_one({
                "user_id": current_user["id"],
                "name": body.name,
                "phone": "",
                "status": "STARTING" if body.start else "STOPPED",
                "active": True
            })

    return {"ok": True, "session": res}

@router.post("/sessions/{session_name}/start")
async def start_waha_session(session_name: str, current_user: dict = Depends(get_current_user)):
    """Inicia uma sessão no WAHA."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    res = await client.start_session(session_name)
    return {"ok": True, "result": res}

@router.post("/sessions/{session_name}/stop")
async def stop_waha_session(session_name: str, current_user: dict = Depends(get_current_user)):
    """Para uma sessão no WAHA."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    res = await client.stop_session(session_name)
    return {"ok": True, "result": res}

@router.post("/sessions/{session_name}/restart")
async def restart_waha_session(session_name: str, current_user: dict = Depends(get_current_user)):
    """Reinicia uma sessão no WAHA."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    res = await client.restart_session(session_name)
    return {"ok": True, "result": res}

@router.post("/sessions/{session_name}/logout")
async def logout_waha_session(session_name: str, current_user: dict = Depends(get_current_user)):
    """Desconecta a conta do WhatsApp da sessão informada."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    res = await client.logout_session(session_name)
    return {"ok": True, "result": res}

@router.get("/sessions/{session_name}/qr")
async def get_session_qr(session_name: str, current_user: dict = Depends(get_current_user)):
    """Obtém o QR Code de autenticação para a sessão informada."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    qr_data = await client.get_qr_code(session_name)
    if not qr_data:
        raise HTTPException(status_code=404, detail="QR Code não disponível ou sessão já conectada")
    return qr_data

@router.get("/groups")
async def list_waha_groups(session_name: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Lista todos os grupos disponíveis na sessão com contagem de participantes e status de registro no app."""
    db = get_db()
    client = _get_waha_client(current_user, db)
    
    target_session = session_name
    if not target_session or target_session == "default":
        active_sessions = await client.list_sessions()
        if active_sessions:
            target_session = active_sessions[0].get("name", "default")
        else:
            target_session = "default"

    groups = await client.list_groups(target_session)

    # Cruza com grupos já cadastrados pelo usuário
    saved_groups = list(db.whatsapp_groups.find({"user_id": current_user["id"]})) if db else []
    saved_map = {g.get("id"): g for g in saved_groups if g.get("id")}

    enriched_groups = []
    for g in groups:
        gid = g.get("id")
        saved = saved_map.get(gid)
        g_data = dict(g)
        g_data["is_registered"] = bool(saved)
        g_data["is_destination"] = bool(saved and not saved.get("is_monitored"))
        g_data["is_monitored"] = bool(saved and saved.get("is_monitored"))
        g_data["mirror_enabled"] = bool(saved and saved.get("mirror_enabled"))
        g_data["saved_id"] = saved.get("id") if saved else None
        g_data["ml_tag"] = saved.get("ml_tag") if saved else None
        g_data["shopee_subid"] = saved.get("shopee_subid") if saved else None
        g_data["amazon_tag"] = saved.get("amazon_tag") if saved else None
        g_data["magalu_store"] = saved.get("magalu_store") if saved else None
        enriched_groups.append(g_data)

    return {"session": session_name, "total": len(enriched_groups), "groups": enriched_groups}

@router.post("/groups/import")
async def import_group(body: GroupImportRequest, current_user: dict = Depends(get_current_user)):
    """Importa ou atualiza um grupo do WAHA para o banco de dados como destino ou monitorado."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Banco de dados indisponível")

    is_monitored = body.action in ("monitored", "both")
    mirror_enabled = is_monitored

    existing = db.whatsapp_groups.find_one({"user_id": current_user["id"], "id": body.group_id})
    if existing:
        db.whatsapp_groups.update_one(
            {"user_id": current_user["id"], "id": body.group_id},
            {"$set": {
                "name": body.name,
                "session_name": body.session_name,
                "is_monitored": is_monitored,
                "mirror_enabled": mirror_enabled,
                "ml_tag": body.ml_tag or existing.get("ml_tag"),
                "shopee_subid": body.shopee_subid or existing.get("shopee_subid"),
                "amazon_tag": body.amazon_tag or existing.get("amazon_tag"),
                "magalu_store": body.magalu_store or existing.get("magalu_store"),
                "footer_text": body.footer_text or existing.get("footer_text"),
                "active": True
            }}
        )
        msg = f"Grupo '{body.name}' atualizado com sucesso."
    else:
        db.whatsapp_groups.insert_one({
            "user_id": current_user["id"],
            "id": body.group_id,
            "name": body.name,
            "session_name": body.session_name,
            "keywords": [],
            "footer_text": body.footer_text or "",
            "active": True,
            "is_monitored": is_monitored,
            "mirror_enabled": mirror_enabled,
            "ml_tag": body.ml_tag or "",
            "shopee_subid": body.shopee_subid or "",
            "amazon_tag": body.amazon_tag or "",
            "magalu_store": body.magalu_store or "",
            "target_whatsapp_groups": []
        })
        msg = f"Grupo '{body.name}' adicionado com sucesso."

    return {"ok": True, "message": msg}

@router.post("/broadcast")
async def broadcast_to_groups(body: BroadcastRequest, current_user: dict = Depends(get_current_user)):
    """
    Disparo em massa para grupos de WhatsApp.
    Substitui integralmente o fluxo 'Grupos_whatsapp.json'.
    Filtra: grupos com > min_participants, não apenas-avisos, templates randômicos e @todos opcional.
    """
    if not body.templates:
        raise HTTPException(status_code=400, detail="Pelo menos um template de mensagem é obrigatório")

    db = get_db()
    client = _get_waha_client(current_user, db)
    session = body.session_name or "WHATS_BUSSINESS_TESTE"

    all_groups = await client.list_groups(session)

    # Filtragem dos grupos
    eligible_groups = []
    for g in all_groups:
        if g.get("participants_count", 0) < body.min_participants:
            continue
        if body.ignore_announce_only and g.get("is_announce"):
            continue
        eligible_groups.append(g)

    if not eligible_groups:
        return {"ok": False, "message": "Nenhum grupo atende aos critérios de participantes/permissão de envio."}

    # Notifica início via Telegram se configurado
    tg_bot = TelegramBotAssistant(
        bot_token=cfg.get("telegram_bot_token"),
        admin_chat_id=cfg.get("telegram_admin_chat_id")
    )
    await tg_bot.send_message(f"🚀 <b>Iniciando Disparo em Massa</b> para {len(eligible_groups)} grupos via '{session}'.")

    # Inicia disparo em background
    import asyncio
    async def run_broadcast():
        success_count = 0
        for grp in eligible_groups:
            gid = grp["id"]
            template = random.choice(body.templates)
            mentions = None
            if body.mention_all:
                mentions = [p.get("id") for p in grp.get("participants", []) if isinstance(p, dict) and p.get("id")]

            ok = await client.send_text(session, gid, template, simulate_typing=True, mentions=mentions)
            if ok:
                success_count += 1
            await asyncio.sleep(body.delay_between_groups)

        await tg_bot.send_message(
            f"✅ <b>Disparo em Massa Concluído!</b>\n"
            f"📤 Mensagens enviadas: <b>{success_count}/{len(eligible_groups)}</b>"
        )

    asyncio.create_task(run_broadcast())

    return {
        "ok": True,
        "message": f"Disparo iniciado em segundo plano para {len(eligible_groups)} grupos elegíveis.",
        "eligible_groups_count": len(eligible_groups)
    }

class DirectBroadcastPayload(BaseModel):
    text: str
    image_url: Optional[str] = None
    session_name: Optional[str] = "default"
    target_groups: List[str]

@router.post("/broadcast-direct")
async def waha_broadcast_direct(body: DirectBroadcastPayload, current_user: dict = Depends(get_current_user)):
    """
    Disparo direto para uma lista de grupos de destino especificados.
    Enfileira ou despacha respeitando as tags e instâncias de cada grupo.
    """
    if not body.text:
        raise HTTPException(status_code=400, detail="Texto da mensagem é obrigatório")
    if not body.target_groups:
        raise HTTPException(status_code=400, detail="Nenhum grupo de destino informado")

    db = get_db()
    client = _get_waha_client(current_user, db)

    import asyncio
    async def run_direct_broadcast():
        for gid in body.target_groups:
            # Busca tags do grupo se existirem
            group_doc = db.whatsapp_groups.find_one({"group_id": gid, "user_id": current_user["id"]}) if db else None
            msg_text = body.text
            if group_doc:
                # Converte os links para as tags específicas deste grupo
                converter = LinkConverter(
                    shopee_subid=group_doc.get("shopee_subid"),
                    ml_tag=group_doc.get("ml_tag"),
                    amazon_tag=group_doc.get("amazon_tag"),
                    magalu_store=group_doc.get("magalu_store")
                )
                converted_text, _ = await converter.convert_all_links(
                    body.text,
                    ml_tag=group_doc.get("ml_tag"),
                    shopee_subid=group_doc.get("shopee_subid"),
                    amazon_tag=group_doc.get("amazon_tag"),
                    magalu_store=group_doc.get("magalu_store")
                )
                msg_text = converted_text
                if group_doc.get("footer_text"):
                    msg_text += f"\n\n{group_doc.get('footer_text')}"

            sess = (group_doc and group_doc.get("session_name")) or body.session_name or "default"
            if body.image_url:
                await client.send_image(sess, gid, body.image_url, msg_text)
            else:
                await client.send_text(sess, gid, msg_text, simulate_typing=True)
            await asyncio.sleep(4)

    asyncio.create_task(run_direct_broadcast())

    return {
        "ok": True,
        "enqueued": len(body.target_groups),
        "message": f"Disparo iniciado para {len(body.target_groups)} grupos."
    }

@router.post("/webhook")
async def waha_events_webhook(request: Request):
    """
    Webhook unificado para eventos do WAHA:
    1. Monitoramento de entradas e saídas de grupos (substitui Monitor_entradas_saidas_grupos.json).
    2. Espelhamento automático de grupos do WhatsApp com conversão de tags personalizadas
       (substitui integralmente o fluxo 'Noivas - Webhook waha.json').
    """
    db = get_db()
    if not db:
        return {"status": "db_unavailable"}

    try:
        data = await request.json()
    except Exception:
        return {"status": "invalid_json"}

    event = data.get("event", "")
    payload = data.get("payload", {})
    session_name = payload.get("session") or data.get("session") or "default"
    
    # -------------------------------------------------------------
    # CASO A: Mensagem Recebida (Espelhamento de Grupos de WhatsApp)
    # -------------------------------------------------------------
    is_message = "message" in event.lower() or "body" in payload or "text" in payload
    if is_message:
        from_id = payload.get("from") or payload.get("chatId") or ""
        body_text = payload.get("body") or payload.get("text") or ""
        has_media = payload.get("hasMedia", False)
        media_url = payload.get("mediaUrl") or (payload.get("media", {}).get("url") if isinstance(payload.get("media"), dict) else None)

        if from_id and body_text:
            # Busca se o grupo de origem está cadastrado como monitorado / com espelhamento ativo
            source_group = db.whatsapp_groups.find_one({"id": from_id, "active": True})
            if not source_group:
                # Tenta sem o sufixo @g.us ou busca alternativa
                clean_id = from_id.split("@")[0]
                source_group = db.whatsapp_groups.find_one({"id": {"$regex": f"^{clean_id}"}, "active": True})

            if source_group and (source_group.get("is_monitored") or source_group.get("mirror_enabled")):
                user_id = source_group.get("user_id")
                target_ids = source_group.get("target_whatsapp_groups") or []

                # Se não houver alvos explícitos, busca todos os grupos destinos ativos do mesmo usuário
                if not target_ids:
                    all_dests = list(db.whatsapp_groups.find({"user_id": user_id, "active": True, "is_monitored": False}))
                    target_ids = [d["id"] for d in all_dests if d.get("id") and d.get("id") != from_id]

                if target_ids:
                    logger.info(f"[WAHA Mirror] Espelhando mensagem do grupo monitorado '{source_group.get('name')}' para {len(target_ids)} destino(s)")
                    
                    # Carrega configurações e cliente WAHA
                    cfg_doc = db.user_configs.find_one({"user_id": user_id})
                    user_config = cfg_doc.get("data", {}) if cfg_doc else {}
                    waha_url = user_config.get("waha_base_url", "http://192.168.1.25:3000")
                    waha_key = user_config.get("waha_api_key")
                    waha_client = WahaClient(base_url=waha_url, api_key=waha_key)

                    from app.services.link_converter import LinkConverterService
                    converter = LinkConverterService(user_config, user_id=user_id)

                    # Para cada grupo de destino, converte com as tags exclusivas DAQUELE grupo
                    for tid in target_ids:
                        target_grp = db.whatsapp_groups.find_one({"user_id": user_id, "id": tid})
                        if not target_grp or not target_grp.get("active", True):
                            continue

                        dest_session = target_grp.get("session_name") or session_name or "default"
                        t_ml = target_grp.get("ml_tag")
                        t_shopee = target_grp.get("shopee_subid")
                        t_amazon = target_grp.get("amazon_tag")
                        t_magalu = target_grp.get("magalu_store")
                        t_footer = target_grp.get("footer_text") or user_config.get("footer_text", "")

                        try:
                            # Converte links especificamente com as tags deste grupo de destino
                            converted_text, _ = await converter.convert_all_links(
                                body_text,
                                ml_tag=t_ml,
                                shopee_subid=t_shopee,
                                amazon_tag=t_amazon,
                                magalu_store=t_magalu,
                                log_func=logger.info
                            )

                            if t_footer and t_footer not in converted_text:
                                converted_text = f"{converted_text.strip()}\n\n{t_footer}"

                            # Envia texto ou mídia
                            if has_media and media_url:
                                await waha_client.send_image(
                                    session_name=dest_session,
                                    chat_id=tid,
                                    caption=converted_text,
                                    image_url=media_url,
                                    simulate_typing=True
                                )
                            else:
                                await waha_client.send_text(
                                    session_name=dest_session,
                                    chat_id=tid,
                                    text=converted_text,
                                    simulate_typing=True
                                )
                            logger.info(f"[WAHA Mirror] Mensagem espelhada com sucesso para grupo '{target_grp.get('name', tid)}'")
                        except Exception as ex_mirror:
                            logger.error(f"[WAHA Mirror] Erro ao espelhar para grupo {tid}: {ex_mirror}")

        return {"status": "ok", "action": "mirrored"}

    # -------------------------------------------------------------
    # CASO B: Eventos de Entrada/Saída de Participantes
    # -------------------------------------------------------------
    group_id = payload.get("chatId") or payload.get("id") or ""
    group_name = payload.get("chatName") or payload.get("groupName") or ""
    participant = payload.get("participant") or ""

    event_type = None
    if "join" in event.lower() or "add" in event.lower():
        event_type = "join"
    elif "leave" in event.lower() or "remove" in event.lower():
        event_type = "leave"

    if event_type and group_id:
        user_id = request.query_params.get("user_id") or request.headers.get("x-user-id")
        if not user_id:
            grp = db.whatsapp_groups.find_one({"id": group_id}) or db.whatsapp_groups.find_one({"group_id": group_id})
            if grp:
                user_id = grp.get("user_id")

        if not user_id and payload.get("session"):
            sess = db.whatsapp_sessions.find_one({"name": payload["session"]})
            if sess:
                user_id = sess.get("user_id")

        if user_id:
            db.group_events.insert_one({
                "user_id": user_id,
                "group_id": group_id,
                "group_name": group_name,
                "event_type": event_type,
                "participant": participant,
                "timestamp": datetime.now(timezone.utc)
            })
            logger.info(f"[WAHA Webhook] Evento '{event_type}' registrado no grupo {group_name or group_id} para usuário {user_id}")
        else:
            logger.warning(f"[WAHA Webhook] Evento ignorado: grupo {group_id} não pertence a nenhum usuário identificado.")

    return {"status": "ok", "event": event}
