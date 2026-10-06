import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    class Settings(BaseSettings):
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./radar.db")
        GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
        GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        MAX_COST_PER_RUN: float = float(os.getenv("MAX_COST_PER_RUN", "0.50"))
        PRODUCTHUNT_TOKEN: Optional[str] = os.getenv("PRODUCTHUNT_TOKEN")
        REDDIT_CLIENT_ID: Optional[str] = os.getenv("REDDIT_CLIENT_ID")
        REDDIT_CLIENT_SECRET: Optional[str] = os.getenv("REDDIT_CLIENT_SECRET")
        REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "BusinessRadar/1.0")
        TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
        TELEGRAM_CHAT_ID: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")
        TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
        RUN_INTERVAL_HOURS: int = int(os.getenv("RUN_INTERVAL_HOURS", "5"))
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    settings = Settings()
except ImportError:
    class BasicSettings:
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./radar.db")
        GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
        GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
        MAX_COST_PER_RUN: float = float(os.getenv("MAX_COST_PER_RUN", "0.50"))
        PRODUCTHUNT_TOKEN: Optional[str] = os.getenv("PRODUCTHUNT_TOKEN")
        REDDIT_CLIENT_ID: Optional[str] = os.getenv("REDDIT_CLIENT_ID")
        REDDIT_CLIENT_SECRET: Optional[str] = os.getenv("REDDIT_CLIENT_SECRET")
        REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "BusinessRadar/1.0")
        TELEGRAM_BOT_TOKEN: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
        TELEGRAM_CHAT_ID: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")
        TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")
        RUN_INTERVAL_HOURS: int = int(os.getenv("RUN_INTERVAL_HOURS", "5"))
        FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    settings = BasicSettings()
