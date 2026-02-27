from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    # MongoDB
    mongo_url: str = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name: str = os.getenv('DB_NAME', 'spetap_db')
    
    # Postgres
    postgres_url: str = os.getenv('POSTGRES_URL', 'postgresql://localhost:5432/spetap')
    
    # Auth
    jwt_secret: str = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
    jwt_algorithm: str = 'HS256'
    jwt_expiration_hours: int = 168  # 7 days
    
    # Stripe
    stripe_api_key: str = os.getenv('STRIPE_API_KEY', 'sk_test_emergent')
    stripe_webhook_secret: str = os.getenv('STRIPE_WEBHOOK_SECRET', '')
    
    # CORS
    cors_origins: str = os.getenv('CORS_ORIGINS', '*')

    # LLM
    emergent_llm_key: str = os.getenv('EMERGENT_LLM_KEY', '')
    
    class Config:
        env_file = '.env'

@lru_cache()
def get_settings():
    return Settings()
