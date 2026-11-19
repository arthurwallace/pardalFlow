import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

root_dir = Path(__file__).resolve().parent.parent.parent
env_default = root_dir / '.env'
env_dev = root_dir / '.env.development'

# Carrega primeiro o .env base
if env_default.exists():
    load_dotenv(dotenv_path=env_default)

# Se estiver em desenvolvimento e houver .env.development, sobrescreve variáveis para dev
current_env = os.getenv('ENVIRONMENT', 'development').lower()
if current_env != 'production' and env_dev.exists():
    load_dotenv(dotenv_path=env_dev, override=True)

def _get_or_generate_jwt_secret() -> str:
    """
    Obtém a chave JWT do ambiente (SECRET_KEY ou JWT_SECRET_KEY).
    Se não informada, gera uma chave criptográfica dinâmica segura (256 bits)
    e a persiste localmente no arquivo .jwt_secret, evitando qualquer valor estático
    exposto no código-fonte.
    """
    secret = (os.getenv('SECRET_KEY') or os.getenv('JWT_SECRET_KEY') or '').strip()
    if secret:
        return secret

    secret_file = Path(__file__).resolve().parent.parent.parent / '.jwt_secret'
    if secret_file.exists():
        try:
            cached = secret_file.read_text(encoding='utf-8').strip()
            if len(cached) >= 32:
                return cached
        except Exception:
            pass

    new_secret = secrets.token_hex(32)
    try:
        secret_file.write_text(new_secret, encoding='utf-8')
    except Exception:
        pass
    return new_secret

class Settings:
    PROJECT_NAME: str = os.getenv('PROJECT_NAME', 'Pardal PromoHub')
    VERSION: str = os.getenv('VERSION', '2.0.0')
    API_V1_PREFIX: str = os.getenv('API_V1_PREFIX', '/api/v1')
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development').lower()

    # Security & JWT (Chave criptográfica gerada dinamicamente ou lida do .env)
    JWT_SECRET_KEY: str = _get_or_generate_jwt_secret()
    JWT_ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', str(60 * 24 * 7)))

    # Primary Database: PostgreSQL (Arquitetura e Conexão)
    _default_db = 'pardal_flow' if os.getenv('ENVIRONMENT', 'development').lower() == 'production' else 'pardal_flow_dev'
    POSTGRES_HOST: str = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT: int = int(os.getenv('POSTGRES_PORT', '5432'))
    POSTGRES_DB: str = os.getenv('POSTGRES_DB', _default_db)
    POSTGRES_USER: str = os.getenv('POSTGRES_USER', 'postgres')
    POSTGRES_PASSWORD: str = os.getenv('POSTGRES_PASSWORD', '')
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
    )

    # Analytics e Monitoramento
    ANALYTICS_API_BASE_URL: str = os.getenv('ANALYTICS_API_BASE_URL', os.getenv('ANALYTICS_API_URL', ''))

settings = Settings()

