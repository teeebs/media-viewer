from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    video_dir: str = "/videos"
    database_url: str = "sqlite:////data/media.db"
    port: int = 8000
    scan_on_startup: bool = True
    page_size: int = 24

    class Config:
        env_file = ".env"


settings = Settings()
