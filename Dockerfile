# ==============================================================
# Estágio 1: Compilação do Frontend Angular SPA
# ==============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ==============================================================
# Estágio 2: Imagem Final de Execução (FastAPI + SPA Integrado)
# ==============================================================
FROM python:3.11-slim

WORKDIR /app

# Instala dependências de sistema (ffmpeg para processamento de vídeo/imagem, curl para healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências do Python
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia o bundle compilado do Angular para servir diretamente pelo FastAPI
COPY --from=frontend-builder /build/dist/frontend/browser /app/frontend_dist

# Copia o código da aplicação backend
COPY backend ./backend

EXPOSE 8000

ENV PYTHONPATH=/app/backend
WORKDIR /app/backend

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["/bin/sh", "docker-entrypoint.sh"]
