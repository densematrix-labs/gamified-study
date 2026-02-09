"""Application configuration."""
import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""
    
    # App
    app_name: str = "Gamified Study Platform"
    debug: bool = False
    
    # LLM Proxy
    llm_proxy_url: str = "https://llm-proxy.densematrix.ai"
    llm_proxy_key: str = ""
    
    # Database
    database_url: str = "sqlite:///./gamified_study.db"
    
    # Creem Payment
    creem_api_key: str = ""
    creem_webhook_secret: str = ""
    creem_product_ids: str = "{}"  # JSON string
    
    # Tool name for metrics
    tool_name: str = "gamified-study"
    
    class Config:
        env_file = ".env"
        extra = "allow"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()
