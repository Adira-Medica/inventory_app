# backend/config_azure.py
# Azure-specific production configuration for Adira Medica Inventory System

import os
import urllib.parse
import secrets

class AzureProductionConfig:
    """Azure-specific production configuration"""
    
    # Environment identification
    DEBUG = False
    TESTING = False
    
    # Database Configuration (set by Azure deployment script)
    # The deployment script sets DATABASE_URL with the full connection string
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Azure PostgreSQL optimized connection settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 120,
        'pool_pre_ping': True,
        'connect_args': {
            'sslmode': 'require',  # Azure PostgreSQL requires SSL
            'connect_timeout': 30,
            'application_name': 'AdiraMedica-Inventory'
        }
    }
    
    # Security Configuration (set by Azure deployment)
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour for production security
    
    # CORS settings - keep your existing CORS handling in __init__.py
    CORS_HEADERS = 'Content-Type'
    
    # Azure-specific settings
    AZURE_KEY_VAULT_URL = os.environ.get('AZURE_KEY_VAULT_URL')
    AZURE_STORAGE_ACCOUNT = os.environ.get('AZURE_STORAGE_ACCOUNT')
    
    # Container-specific paths for Azure (adjusted for Docker container)
    PDF_UPLOAD_FOLDER = '/app/backend/templates'
    PDF_OUTPUT_FOLDER = '/app/backend/generated'
    
    # Production logging configuration
    LOG_LEVEL = 'INFO'
    LOG_FILE = '/app/backend/logs/app.log'
    
    # Deployment information (helps with troubleshooting)
    DEPLOYMENT_TYPE = os.environ.get('DEPLOYMENT_TYPE', 'azure-production')
    DEPLOYMENT_TIMESTAMP = os.environ.get('DEPLOYMENT_TIMESTAMP', 'unknown')
    
    # Rate limiting settings (your __init__.py handles rate limiting)
    RATELIMIT_STORAGE_URL = "memory://"
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    
    # Security headers and settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Application-specific settings (copy from your existing config if you have these)
    # Add any other settings from your DevelopmentConfig that should apply to production
    
    @classmethod
    def validate_config(cls):
        """Validate Azure configuration - called when app starts"""
        issues = []
        
        # Check database configuration
        if not os.environ.get('DATABASE_URL'):
            issues.append("DATABASE_URL environment variable not set")
        
        # Check security keys
        if not os.environ.get('SECRET_KEY'):
            issues.append("SECRET_KEY environment variable not set")
        
        if not os.environ.get('JWT_SECRET_KEY'):
            issues.append("JWT_SECRET_KEY environment variable not set")
        
        # Check Azure-specific settings
        if not os.environ.get('AZURE_KEY_VAULT_URL'):
            issues.append("AZURE_KEY_VAULT_URL environment variable not set (warning)")
        
        if issues:
            print("⚠️ Azure Configuration Issues:")
            for issue in issues:
                print(f"   - {issue}")
            
            # Only raise error for critical issues
            critical_issues = [i for i in issues if "not set" in i and "warning" not in i]
            if critical_issues:
                raise ValueError(f"Critical Azure configuration issues: {'; '.join(critical_issues)}")
        else:
            print("✅ Azure configuration validation passed")
    
    def __str__(self):
        """String representation for debugging (non-sensitive info only)"""
        return f"AzureProductionConfig(deployment_type={self.DEPLOYMENT_TYPE}, debug={self.DEBUG})"

# Alternative safe configuration that doesn't validate at import time
class SafeAzureConfig:
    """Safe Azure config that validates only when used by Flask"""
    DEBUG = False
    TESTING = False
    
    # Database configuration with fallback
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://inventoryuser:password@localhost:5432/inventory_db?sslmode=require')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 120,
        'pool_pre_ping': True,
        'connect_args': {'sslmode': 'require'}
    }
    
    # Security with fallbacks
    SECRET_KEY = os.environ.get('SECRET_KEY', 'azure-fallback-secret-key')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'azure-fallback-jwt-key')
    JWT_ACCESS_TOKEN_EXPIRES = 3600
    
    # Other settings
    CORS_HEADERS = 'Content-Type'
    PDF_UPLOAD_FOLDER = '/app/backend/templates'
    PDF_OUTPUT_FOLDER = '/app/backend/generated'
    
    # Azure settings
    AZURE_KEY_VAULT_URL = os.environ.get('AZURE_KEY_VAULT_URL')
    DEPLOYMENT_TYPE = os.environ.get('DEPLOYMENT_TYPE', 'azure-safe')

# For compatibility with your config system
AzureConfig = AzureProductionConfig