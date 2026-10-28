#!/bin/sh
set -e

echo "============================================="
echo "🦅 Pardal PromoHub - Inicializando Container"
echo "============================================="

# 1. Aguarda e sincroniza o banco de dados PostgreSQL
echo "🔄 Verificando e sincronizando banco de dados..."
python migrate_to_postgres.py || echo "⚠️ Aviso: Verificação de migração finalizada."

# 2. Inicia a API REST FastAPI e interface web integrada
echo "🚀 Iniciando servidor FastAPI na porta ${PORT:-8000}..."
exec python run_server.py
