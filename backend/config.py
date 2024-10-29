# backend/inventory_app/config.py

import os
from functools import lru_cache

class Config:
    # SQLite Database URI for a self-contained, in-codebase database setup
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///inventory_app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret keys for Flask sessions and JWT
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your_jwt_secret_key')
    
    # Optional Redis caching configuration
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    CACHE_DEFAULT_TIMEOUT = 300  # Timeout for cached items (in seconds)

    # SQLite-specific options (connection pooling can be less relevant for SQLite)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,  # Set pool size lower for SQLite
        'max_overflow': 10,
        'pool_timeout': 30,
        'pool_recycle': 1800,  # In seconds
    }

    # Optional caching for configuration object to enhance performance
    @classmethod
    @lru_cache(maxsize=None)
    def get_config(cls):
        return cls()

# Usage in the app: config = Config.get_config()
