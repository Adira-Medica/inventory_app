import os
import urllib.parse
from dotenv import load_dotenv # type: ignore
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

class DevelopmentConfig(Config):
    """Development configuration"""
    # Database configuration
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'Gom@thinger123')
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'inventory_db')
    
    # URL encode the password for special characters
    encoded_password = urllib.parse.quote_plus(db_password)
    
    # Show debug info
    print("Development database:", f'postgresql://{db_user}:******@{db_host}:{db_port}/{db_name}')
    
    # Database connection string
    SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
    
    # JWT settings
    JWT_ACCESS_TOKEN_EXPIRES = False  # No expiration in development

class ProductionConfig(Config):
    """Production configuration"""
    # Database configuration 
    db_user = os.environ.get('PROD_DB_USER')
    db_password = os.environ.get('PROD_DB_PASSWORD')
    db_host = os.environ.get('PROD_DB_HOST')
    db_port = os.environ.get('PROD_DB_PORT', '5432')
    db_name = os.environ.get('PROD_DB_NAME')
    
    # URL encode the password for special characters
    encoded_password = urllib.parse.quote_plus(db_password) if db_password else ''
    
    # Database connection string
    SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
    
    # Require security keys to be set
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    
    # Set token expiration for production (default 24 hours)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

# Select configuration based on environment
env = os.environ.get('FLASK_ENV', 'development')
if env == 'production':
    active_config = ProductionConfig
else:
    active_config = DevelopmentConfig