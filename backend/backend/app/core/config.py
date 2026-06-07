from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./twtrip.db"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    KAKAO_CLIENT_ID: str = ""
    KAKAO_REDIRECT_URI: str = "http://localhost:5173/auth/kakao/callback"

    GEMINI_API_KEY: str = ""
    KAKAO_MAP_API_KEY: str = ""
    KMA_API_KEY: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
