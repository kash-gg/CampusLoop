from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str = Field(default="http://localhost:8000")
    supabase_key: str = Field(default="")
    database_url: str = Field(default="postgresql://postgres:password@localhost:5432/campusloop")
    
    model_config = SettingsConfigDict(env_file=".env")

@lru_cache()
def get_settings():
    return Settings()
