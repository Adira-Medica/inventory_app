import os
import urllib.parse
from dotenv import load_dotenv  # type: ignore
import secrets

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base configuration"""
    # Common settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_HEADERS = 'Content-Type'
    
    # PDF settings
    PDF_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    PDF_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated')
    
    # Security fallbacks (only used if env vars not set)
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_hex(32)
    
    # JWT settings - default no expiration for development
    JWT_ACCESS_TOKEN_EXPIRES = False

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    
    # Database configuration with environment variable support
    # Check for full DATABASE_URL first (for development flexibility)
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
        print("Using DATABASE_URL from environment")
    else:
        # Build from individual components
        db_user = os.environ.get('DB_USER', 'postgres')
        db_password = os.environ.get('DB_PASSWORD', 'Gom@thinger123')
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_port = os.environ.get('DB_PORT', '5432')
        db_name = os.environ.get('DB_NAME', 'inventory_db')
        
        # URL encode the password for special characters
        encoded_password = urllib.parse.quote_plus(db_password)
        
        # Database connection string
        SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
        print(f"Development database: postgresql://{db_user}:******@{db_host}:{db_port}/{db_name}")

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = False
    TESTING = True
    WTF_CSRF_ENABLED = False
    
    # Use DATABASE_URL if provided (for CI), otherwise use test database
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
        print("Testing: Using DATABASE_URL from environment")
    else:
        # Default test database
        db_user = os.environ.get('DB_USER', 'postgres')
        db_password = os.environ.get('DB_PASSWORD', 'postgres')
        db_host = os.environ.get('DB_HOST', 'localhost')
        db_port = os.environ.get('DB_PORT', '5432')
        db_name = os.environ.get('DB_NAME', 'test_inventory_db')
        
        encoded_password = urllib.parse.quote_plus(db_password)
        SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
        print(f"Testing database: postgresql://{db_user}:******@{db_host}:{db_port}/{db_name}")

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # In production, require DATABASE_URL or all individual components
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    else:
        # Build from individual components - all required in production
        db_user = os.environ.get('PROD_DB_USER')
        db_password = os.environ.get('PROD_DB_PASSWORD')
        db_host = os.environ.get('PROD_DB_HOST')
        db_port = os.environ.get('PROD_DB_PORT', '5432')
        db_name = os.environ.get('PROD_DB_NAME')
        
        if not all([db_user, db_password, db_host, db_name]):
            raise ValueError("Production database configuration incomplete. Set DATABASE_URL or all PROD_DB_* variables.")
        
        # URL encode the password for special characters
        encoded_password = urllib.parse.quote_plus(db_password)
        SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
    
    # Require security keys to be set in production
    if not os.environ.get('SECRET_KEY'):
        raise ValueError("SECRET_KEY must be set in production")
    if not os.environ.get('JWT_SECRET_KEY'):
        raise ValueError("JWT_SECRET_KEY must be set in production")
    
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Set token expiration for production (default 24 hours)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Select configuration based on environment
def get_config(config_name=None):
    """Get configuration class based on environment"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    return config.get(config_name, DevelopmentConfig)

# For backward compatibility
env = os.environ.get('FLASK_ENV', 'development')
active_config = get_config(env)