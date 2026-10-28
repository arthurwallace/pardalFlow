import os
import secrets
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

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

    # Security & JWT (Chave criptográfica gerada dinamicamente ou lida do .env)
    JWT_SECRET_KEY: str = _get_or_generate_jwt_secret()
    JWT_ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES', str(60 * 24 * 7)))

    # Primary Database: PostgreSQL (Arquitetura e Conexão)
    DATABASE_URL: str = os.getenv('DATABASE_URL', '')
    POSTGRES_PORT: int = int(os.getenv('POSTGRES_PORT', '5438'))
    POSTGRES_DB: str = os.getenv('POSTGRES_DB', 'pardal_promohub')
    POSTGRES_USER: str = os.getenv('POSTGRES_USER', 'pardal_user')
    POSTGRES_PASSWORD: str = os.getenv('POSTGRES_PASSWORD', '')

    # Webhook Integrations de Arquitetura (n8n / Microserviços opcionais de infraestrutura)
    ML_WEBHOOK_URL: str = os.getenv('N8N_MERCADOLIVRE_WEBHOOK', '')
    AMAZON_WEBHOOK_URL: str = os.getenv('N8N_AMAZON_WEBHOOK', '')
    MAGALU_WEBHOOK_URL: str = os.getenv('N8N_MAGALU_WEBHOOK', '')
    WPP_IMAGE_WEBHOOK: str = os.getenv('WPP_IMAGE_WEBHOOK', '')
    WPP_TEXT_WEBHOOK: str = os.getenv('WPP_TEXT_WEBHOOK', '')
    ANALYTICS_API_BASE_URL: str = os.getenv('ANALYTICS_API_BASE_URL', os.getenv('ANALYTICS_API_URL', ''))

settings = Settings()

