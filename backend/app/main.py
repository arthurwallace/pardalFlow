import sys
import os
import logging

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import get_db
from app.api import auth, channels, destinations, settings as settings_api, bot, tester, metrics, analytics, backup

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure DB connection and initial tables
    try:
        print("[Startup] Iniciando Pardal PromoHub Backend...")
    except Exception:
        pass
    db = get_db()
    if db is not None:
        try:
            print("[Startup] Banco de dados pronto e sincronizado.")
        except Exception:
            pass
    yield
    try:
        print("[Shutdown] Encerrando Pardal PromoHub Backend...")
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Sistema completo de gestão para afiliados e automação de promoções.",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_v1 = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_v1)
app.include_router(channels.router, prefix=api_v1)
app.include_router(destinations.router, prefix=api_v1)
app.include_router(settings_api.router, prefix=api_v1)
app.include_router(bot.router, prefix=api_v1)
app.include_router(tester.router, prefix=api_v1)
app.include_router(metrics.router, prefix=api_v1)
app.include_router(analytics.router, prefix=api_v1)
app.include_router(backup.router, prefix=api_v1)

@app.get("/health", tags=["Health"])
async def health_check():
    db = get_db()
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "connected" if db is not None else "disconnected"
    }

# SPA Frontend Static Hosting (Single-container deployment for CasaOS / Docker)
frontend_local_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist", "frontend", "browser"))
frontend_docker_dist = "/app/frontend_dist"

dist_dir = None
if os.path.exists(frontend_docker_dist) and os.path.exists(os.path.join(frontend_docker_dist, "index.html")):
    dist_dir = frontend_docker_dist
elif os.path.exists(frontend_local_dist) and os.path.exists(os.path.join(frontend_local_dist, "index.html")):
    dist_dir = frontend_local_dist

if dist_dir:
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Do not intercept API or health endpoints
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path == "health":
            return None
        candidate = os.path.join(dist_dir, full_path)
        if os.path.isfile(candidate):
            return FileResponse(candidate)
        return FileResponse(os.path.join(dist_dir, "index.html"))
