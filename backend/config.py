import os
from dotenv import load_dotenv # type: ignore
import secrets
import urllib.parse  # Add this import for URL encoding

# Load environment variables from .env file
load_dotenv()

class Config:
    # Database credentials from environment or defaults
    db_user = os.environ.get('DB_USER', 'postgres')
    db_password = os.environ.get('DB_PASSWORD', 'Gom@thinger123')  # Default password with @ symbol
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'inventory_db')
    
    # URL encode the password to handle special characters like @
    encoded_password = urllib.parse.quote_plus(db_password)
    
    # Log safe version (without password) if FLASK_DEBUG is enabled
    if os.environ.get('FLASK_DEBUG') == '1':
        print("Database URL:", f'postgresql://{db_user}:******@{db_host}:{db_port}/{db_name}')
    
    # Database connection with encoded password
    SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Security keys - use environment variables with secure fallbacks
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_hex(32)
    
    # JWT configuration
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 0)) or False
    
    # CORS settings
    CORS_HEADERS = 'Content-Type'
    
    # PDF settings
    PDF_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    PDF_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated')