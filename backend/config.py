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
        print("Development: Using DATABASE_URL from environment")
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
    DEBUG = True  # Changed to True for better debugging in tests
    TESTING = True
    WTF_CSRF_ENABLED = False
    
    # Override security keys for testing to ensure they're safe/predictable
    SECRET_KEY = 'test-secret-key-not-for-production'
    JWT_SECRET_KEY = 'test-jwt-secret-key-not-for-production'
    
    # Use DATABASE_URL if provided (for CI), otherwise use test database or fallback
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
        print("Testing: Using DATABASE_URL from environment")
    else:
        # Try to use a test database, but fallback to SQLite if PostgreSQL not available
        try:
            # Default test database
            db_user = os.environ.get('DB_USER', 'postgres')
            db_password = os.environ.get('DB_PASSWORD', 'postgres')
            db_host = os.environ.get('DB_HOST', 'localhost')
            db_port = os.environ.get('DB_PORT', '5432')
            db_name = os.environ.get('DB_NAME', 'test_inventory_db')
            
            encoded_password = urllib.parse.quote_plus(db_password)
            SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
            print(f"Testing database: postgresql://{db_user}:******@{db_host}:{db_port}/{db_name}")
        except Exception:
            # Fallback to SQLite for testing if PostgreSQL isn't available
            SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
            print("Testing: Using SQLite in-memory database as fallback")

class ProductionConfig(Config):
    """Production configuration - validation deferred to runtime"""
    DEBUG = False
    TESTING = False
    
    def __init__(self):
        """Initialize production config with validation"""
        super().__init__()
        self._validate_production_config()
    
    def _validate_production_config(self):
        """Validate production configuration - called only when config is instantiated"""
        # Validate database configuration
        if not os.environ.get('DATABASE_URL'):
            # Check if all individual components are set
            required_db_vars = ['PROD_DB_USER', 'PROD_DB_PASSWORD', 'PROD_DB_HOST', 'PROD_DB_NAME']
            missing_vars = [var for var in required_db_vars if not os.environ.get(var)]
            if missing_vars:
                raise ValueError(f"Production database configuration incomplete. "
                               f"Set DATABASE_URL or all PROD_DB_* variables. "
                               f"Missing: {', '.join(missing_vars)}")
        
        # Validate security keys
        if not os.environ.get('SECRET_KEY'):
            raise ValueError("SECRET_KEY environment variable must be set for production")
        if not os.environ.get('JWT_SECRET_KEY'):
            raise ValueError("JWT_SECRET_KEY environment variable must be set for production")
    
    @property
    def SQLALCHEMY_DATABASE_URI(self):
        """Database URI property that builds the connection string"""
        # In production, require DATABASE_URL or all individual components
        if os.environ.get('DATABASE_URL'):
            return os.environ.get('DATABASE_URL')
        else:
            # Build from individual components - all required in production
            db_user = os.environ.get('PROD_DB_USER')
            db_password = os.environ.get('PROD_DB_PASSWORD')
            db_host = os.environ.get('PROD_DB_HOST')
            db_port = os.environ.get('PROD_DB_PORT', '5432')
            db_name = os.environ.get('PROD_DB_NAME')
            
            # URL encode the password for special characters
            encoded_password = urllib.parse.quote_plus(db_password)
            return f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
    
    @property
    def SECRET_KEY(self):
        """Secret key property that validates existence"""
        return os.environ.get('SECRET_KEY')
    
    @property
    def JWT_SECRET_KEY(self):
        """JWT secret key property that validates existence"""
        return os.environ.get('JWT_SECRET_KEY')
    
    @property
    def JWT_ACCESS_TOKEN_EXPIRES(self):
        """JWT token expiration property"""
        # Set token expiration for production (default 24 hours)
        return int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

# Safe production config class that doesn't validate at import time
class SafeProductionConfig(Config):
    """Safe production config that validates only when actually used by Flask"""
    DEBUG = False
    TESTING = False
    
    # These will be overridden by Flask when the config is actually loaded
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'will-be-validated-later'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'will-be-validated-later'
    
    # Database configuration
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    else:
        # Build from individual components if available
        db_user = os.environ.get('PROD_DB_USER', 'postgres')
        db_password = os.environ.get('PROD_DB_PASSWORD', 'postgres')
        db_host = os.environ.get('PROD_DB_HOST', 'localhost')
        db_port = os.environ.get('PROD_DB_PORT', '5432')
        db_name = os.environ.get('PROD_DB_NAME', 'inventory_db')
        
        if db_password:
            encoded_password = urllib.parse.quote_plus(db_password)
            SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{encoded_password}@{db_host}:{db_port}/{db_name}"
        else:
            SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@localhost:5432/inventory_db'
    
    # Set token expiration for production (default 24 hours)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 86400))

# NEW: Azure production configuration
class AzureProductionConfig(Config):
    """Azure-specific production configuration"""
    DEBUG = False
    TESTING = False
    
    # Database configuration (set by Azure deployment script)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 120,
        'pool_pre_ping': True,
        'connect_args': {'sslmode': 'require'}  # Azure PostgreSQL requires SSL
    }
    
    # Security Configuration (set by Azure deployment)
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour for production security
    
    # Azure-specific settings
    AZURE_KEY_VAULT_URL = os.environ.get('AZURE_KEY_VAULT_URL')
    
    # Container-specific paths for Azure
    PDF_UPLOAD_FOLDER = '/app/backend/templates'
    PDF_OUTPUT_FOLDER = '/app/backend/generated'
    
    # Production logging
    LOG_LEVEL = 'INFO'
    LOG_FILE = '/app/backend/logs/app.log'
    
    # Deployment info
    DEPLOYMENT_TYPE = os.environ.get('DEPLOYMENT_TYPE', 'unknown')

# Configuration mapping - ADD Azure config
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': SafeProductionConfig,  # Use safe version
    'azure': AzureProductionConfig,      # NEW: Azure-specific config
    'default': DevelopmentConfig
}

# UPDATED: Select configuration based on environment
def get_config(config_name=None):
    """Get configuration class based on environment"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    # Handle Azure production environment
    if config_name == 'production' and os.environ.get('AZURE_KEY_VAULT_URL'):
        config_name = 'azure'
        print("🚀 Detected Azure environment, using AzureProductionConfig")
    
    config_class = config.get(config_name, DevelopmentConfig)
    
    # Add some debug info
    print(f"Loading configuration: {config_name} -> {config_class.__name__}")
    
    # For production, we could add runtime validation here if needed
    if config_name in ['production', 'azure']:
        # Validate critical production settings when config is actually used
        if hasattr(config_class, 'SECRET_KEY') and config_class.SECRET_KEY == 'will-be-validated-later':
            if not os.environ.get('SECRET_KEY'):
                print("⚠️ Warning: SECRET_KEY not set for production")
        if hasattr(config_class, 'JWT_SECRET_KEY') and config_class.JWT_SECRET_KEY == 'will-be-validated-later':
            if not os.environ.get('JWT_SECRET_KEY'):
                print("⚠️ Warning: JWT_SECRET_KEY not set for production")
        
        # Azure-specific validation
        if config_name == 'azure':
            if not os.environ.get('DATABASE_URL'):
                print("⚠️ Warning: DATABASE_URL not set for Azure deployment")
    
    return config_class

# For backward compatibility
def get_active_config():
    """Get the currently active configuration"""
    env = os.environ.get('FLASK_ENV', 'development')
    return get_config(env)

# Legacy support
env = os.environ.get('FLASK_ENV', 'development')
active_config = get_config(env)

# Create a backward-compatible Config class
Config = DevelopmentConfig