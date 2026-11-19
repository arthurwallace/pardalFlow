import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends, Query

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.affiliate_analytics import AffiliateAnalyticsService
from app.services.queue_manager import QueueManager

router = APIRouter(prefix="/vitrine", tags=["Vitrine & Catálogo de Produtos"])

class VitrineProductCreate(BaseModel):
    title: str
    price: str
    commission_rate: Optional[float] = 0.0
    commission_value: Optional[float] = 0.0
    image_url: Optional[str] = ""
    product_url: Optional[str] = ""
    affiliate_url: Optional[str] = ""
    category: Optional[str] = "noivas"
    status: Optional[str] = "active"

class SearchShopeeRequest(BaseModel):
    keyword: str
    category: Optional[str] = "noivas"
    limit: Optional[int] = 15

@router.get("")
async def list_vitrine_products(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Lista todos os produtos da vitrine com filtros por categoria e status."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    filter_q: Dict[str, Any] = {"user_id": current_user["id"]}
    if category:
        filter_q["category"] = category
    if status:
        filter_q["status"] = status

    products = list(db.vitrine_products.find(filter_q))
    return {
        "total": len(products),
        "products": products
    }

@router.post("")
async def create_vitrine_product(
    body: VitrineProductCreate,
    current_user: dict = Depends(get_current_user)
):
    """Cadastra um novo produto na vitrine."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    doc_id = uuid.uuid4().hex[:24]
    data = body.model_dump()
    data["id"] = doc_id
    data["user_id"] = current_user["id"]
    data["created_at"] = datetime.now(timezone.utc)

    db.vitrine_products.insert_one(data)
    return {"ok": True, "id": doc_id, "message": "Produto cadastrado com sucesso na vitrine."}

@router.post("/search-shopee")
async def search_and_import_shopee(
    body: SearchShopeeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Busca produtos com melhor comissão na Shopee por palavra-chave e importa para a vitrine.
    Substitui o sub-workflow 'Sub_Shopee_BuscarProdutos.json'.
    """
    db = get_db()
    cfg_doc = db.user_configs.find_one({"user_id": current_user["id"]}) if db else None
    cfg = cfg_doc.get("data", {}) if cfg_doc else {}

    shopee_app_id = cfg.get("shopee_app_id") or cfg.get("custom_shopee_app_id")
    shopee_secret = cfg.get("shopee_app_secret") or cfg.get("custom_shopee_secret")
    if not shopee_app_id or not shopee_secret:
        raise HTTPException(
            status_code=400,
            detail="Credenciais particulares da Shopee (App ID e App Secret) não estão configuradas para o seu usuário. Configure em 'Configurações' > 'Credenciais Afiliados'."
        )

    service = AffiliateAnalyticsService(
        shopee_app_id=shopee_app_id,
        shopee_secret=shopee_secret,
        user_id=current_user["id"]
    )
    products = await service.search_shopee_top_products(body.keyword, limit=body.limit or 15)

    imported_count = 0
    for p in products:
        item_id = str(p.get("itemId") or "")
        # Verifica se já existe
        existing = db.vitrine_products.find_one({"user_id": current_user["id"], "item_id": item_id}) if item_id else None
        if not existing:
            db.vitrine_products.insert_one({
                "id": uuid.uuid4().hex[:24],
                "user_id": current_user["id"],
                "item_id": item_id,
                "shop_id": str(p.get("shopId") or ""),
                "title": p.get("productName", ""),
                "price": str(p.get("price", "")),
                "commission_rate": float(p.get("commissionRate", 0) or 0),
                "commission_value": float(p.get("commission", 0) or 0),
                "image_url": p.get("imageUrl", ""),
                "product_url": p.get("productLink", ""),
                "affiliate_url": p.get("offerLink", ""),
                "category": body.category or "noivas",
                "status": "active",
                "created_at": datetime.now(timezone.utc)
            })
            imported_count += 1

    return {
        "ok": True,
        "found": len(products),
        "imported": imported_count,
        "message": f"{imported_count} novo(s) produto(s) importado(s) para a vitrine."
    }

@router.post("/pause-all")
async def pause_all_vitrine(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Pausa todos os produtos da vitrine (equivalente ao webhook noivas-pausar-todos-vitrine)."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    filter_q: Dict[str, Any] = {"user_id": current_user["id"]}
    if category:
        filter_q["category"] = category

    count = 0
    for p in list(db.vitrine_products.find(filter_q)):
        db.vitrine_products.update_one({"id": p["id"]}, {"$set": {"status": "paused"}})
        count += 1

    return {"ok": True, "paused_count": count, "message": f"{count} produtos pausados na vitrine."}

@router.post("/clear")
async def clear_vitrine(
    category: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Zera a vitrine (equivalente ao webhook noivas-zerar-vitrine)."""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    filter_q: Dict[str, Any] = {"user_id": current_user["id"]}
    if category:
        filter_q["category"] = category

    removed = 0
    for p in list(db.vitrine_products.find(filter_q)):
        db.vitrine_products.delete_one({"id": p["id"]})
        removed += 1

    return {"ok": True, "removed_count": removed, "message": f"{removed} produtos removidos da vitrine."}

@router.post("/generate-offers")
async def generate_vitrine_offers(
    category: Optional[str] = Query("noivas"),
    limit: int = Query(5),
    current_user: dict = Depends(get_current_user)
):
    """
    Pega produtos ativos da vitrine, gera mensagens formatadas e enfileira para envio.
    Substitui o webhook 'noivas-gerar-mensagens-ml'.
    """
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB indisponível")

    products = list(db.vitrine_products.find({
        "user_id": current_user["id"],
        "category": category,
        "status": "active"
    }))

    if not products:
        return {"ok": False, "message": "Nenhum produto ativo na vitrine para gerar ofertas."}

    qm = QueueManager(user_id=current_user["id"])
    enqueued = 0

    for p in products[:limit]:
        title = p.get("title", "")
        price = p.get("price", "")
        link = p.get("affiliate_url") or p.get("product_url") or ""
        img = p.get("image_url", "")

        msg = (
            f"👰 *{title}*\n\n"
            f"✅ Apenas: *R$ {price}*\n"
            f"🛒 Compre aqui: {link}\n\n"
            f"🚚 Frete Grátis e Cupons no app!"
        )

        qm.enqueue(
            queue_type="vitrine",
            text=msg,
            preview_url=link
        )
        enqueued += 1

    return {"ok": True, "enqueued": enqueued, "message": f"{enqueued} oferta(s) da vitrine enviada(s) para a fila de disparo."}
