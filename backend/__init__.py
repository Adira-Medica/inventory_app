# backend/__init__.py - Quick fix to restore admin access
import os
import sys
from flask import Flask
from flask_migrate import Migrate # type: ignore

def create_app(config_name=None):
    """Application factory function with environment support"""
    
    # Determine configuration based on parameter or environment
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    # Set the environment variable so your config can pick it up
    os.environ['FLASK_ENV'] = config_name
    
    print(f"Loading configuration: {config_name}")
    
    try:
        # Import your existing config system
        from backend.config import get_config
        
        # Get the appropriate config class using your existing function
        config_class = get_config(config_name)
        print(f"✅ Configuration {config_class.__name__} loaded successfully")
        
    except ImportError as e:
        print(f"⚠️ Config import failed: {e}")
        # Fallback configuration for CI/CD
        class FallbackConfig:
            SQLALCHEMY_DATABASE_URI = os.getenv(
                'DATABASE_URL',
                'postgresql://test_user:test_password@localhost:5432/test_inventory_db' if config_name == 'testing'
                else "postgresql://postgres:Gom%40thinger123@localhost:5432/inventory_db"
            )
            SQLALCHEMY_TRACK_MODIFICATIONS = False
            SECRET_KEY = 'fallback-secret-key'
            JWT_SECRET_KEY = 'fallback-jwt-secret'
            JWT_ACCESS_TOKEN_EXPIRES = False
            TESTING = config_name == 'testing'
            DEBUG = config_name in ['development', 'testing']
            CORS_HEADERS = 'Content-Type'
            
            # PDF settings
            PDF_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
            PDF_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated')
        
        config_class = FallbackConfig
        print("✅ Fallback configuration loaded")
    
    # Create Flask app
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Debug configuration (but don't print sensitive info)
    print(f"Starting Flask app with config: {config_name}")
    print(f"Database URI set: {'Yes' if app.config.get('SQLALCHEMY_DATABASE_URI') else 'No'}")
    print(f"Testing mode: {app.config.get('TESTING', False)}")
    print(f"Debug mode: {app.config.get('DEBUG', False)}")
    
    # Initialize migrate here to avoid circular imports
    migrate = Migrate()
    
    try:
        # Import and initialize extensions
        from backend.extensions import db, jwt, cors
        
        # Initialize extensions with app
        db.init_app(app)
        jwt.init_app(app)
        
        # MINIMAL JWT FIX - Just handle the subject issue
        @jwt.user_identity_loader
        def user_identity_lookup(user):
            # If it's already a dict (your current format), extract the ID for 'sub'
            if isinstance(user, dict):
                return str(user.get('id', ''))
            return str(user)
        
        # COMPREHENSIVE CORS SETUP
        cors.init_app(app, 
            origins=[
                "http://localhost:3000",
                "http://localhost:3001", 
                "https://adira-medica-frontend.onrender.com",
                "https://*.onrender.com"
            ],
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
            supports_credentials=True,
            send_wildcard=False
        )
        
        migrate.init_app(app, db)
        print("✅ Extensions initialized successfully")
        
    except ImportError as e:
        print(f"⚠️ Extension initialization failed: {e}")
        # Continue without extensions for basic functionality
        
        # Create a minimal db mock for testing
        class MockDB:
            def init_app(self, app): pass
        
        app.db = MockDB()
    
    # CRITICAL: Add global OPTIONS handler for preflight requests
    @app.before_request
    def handle_preflight():
        from flask import request
        if request.method == "OPTIONS":
            from flask import make_response
            response = make_response()
            response.headers.add("Access-Control-Allow-Origin", "https://adira-medica-frontend.onrender.com")
            response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization")
            response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
            response.headers.add('Access-Control-Allow-Credentials', "true")
            return response
    
    try:
        # Import and register error handlers
        from backend.utils.error_handlers import register_error_handlers
        register_error_handlers(app)
        print("✅ Error handlers registered successfully")
        
    except ImportError as e:
        print(f"⚠️ Error handlers registration failed: {e}")
        # Add basic error handlers
        @app.errorhandler(404)
        def not_found(error):
            return {"error": "Not found"}, 404
            
        @app.errorhandler(500)
        def internal_error(error):
            return {"error": "Internal server error"}, 500
    
    # IMPROVED: Try to register blueprints individually with better error handling
    blueprint_errors = []
    
    try:
        from backend.routes.auth import bp as auth_bp
        app.register_blueprint(auth_bp)
        print("✅ Auth blueprint registered successfully")
    except Exception as e:
        blueprint_errors.append(f"Auth blueprint failed: {e}")
        print(f"⚠️ Auth blueprint failed: {e}")
    
    try:
        from backend.routes.item import bp as item_bp
        app.register_blueprint(item_bp)
        print("✅ Item blueprint registered successfully")
    except Exception as e:
        blueprint_errors.append(f"Item blueprint failed: {e}")
        print(f"⚠️ Item blueprint failed: {e}")
    
    try:
        from backend.routes.receiving import bp as receiving_bp
        app.register_blueprint(receiving_bp)
        print("✅ Receiving blueprint registered successfully")
    except Exception as e:
        blueprint_errors.append(f"Receiving blueprint failed: {e}")
        print(f"⚠️ Receiving blueprint failed: {e}")
    
    try:
        from backend.routes.admin import bp as admin_bp
        app.register_blueprint(admin_bp)
        print("✅ Admin blueprint registered successfully")
    except Exception as e:
        blueprint_errors.append(f"Admin blueprint failed: {e}")
        print(f"⚠️ Admin blueprint failed: {e}")
    
    try:
        from backend.routes.form import bp as form_bp
        app.register_blueprint(form_bp)
        print("✅ Form blueprint registered successfully")
    except Exception as e:
        blueprint_errors.append(f"Form blueprint failed: {e}")
        print(f"⚠️ Form blueprint failed: {e}")
    
    if blueprint_errors:
        print(f"⚠️ Some blueprints failed to load: {blueprint_errors}")
    else:
        print("✅ All blueprints registered successfully")
    
    # Add basic routes for testing and health checks
    @app.route('/')
    def index():
        return {
            "message": "Adira Medica Inventory API", 
            "status": "running",
            "environment": config_name,
            "testing": app.config.get('TESTING', False),
            "endpoints": ["/health", "/api/test", "/api/auth/login"],
            "blueprint_errors": blueprint_errors if blueprint_errors else None
        }
    
    # Add a simple API health endpoint
    @app.route('/api/health')
    def api_health():
        return {
            "status": "healthy",
            "environment": config_name,
            "database": "connected" if app.config.get('SQLALCHEMY_DATABASE_URI') else "not configured",
            "blueprints_loaded": len(blueprint_errors) == 0
        }
    
    print("🚀 Flask application created successfully!")
    return app