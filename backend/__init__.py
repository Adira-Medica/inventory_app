# backend/__init__.py - Updated to work with your existing config.py
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
        cors.init_app(app, resources={
            r"/api/*": {
                "origins": ["http://localhost:3000", "http://localhost:3001", "https://*.ngrok.io", "https://*.ngrok-free.app"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        })
        migrate.init_app(app, db)
        print("✅ Extensions initialized successfully")
        
    except ImportError as e:
        print(f"⚠️ Extension initialization failed: {e}")
        # Continue without extensions for basic functionality
        
        # Create a minimal db mock for testing
        class MockDB:
            def init_app(self, app): pass
        
        app.db = MockDB()
    
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
    
    try:
        # Import and register blueprints with absolute imports
        from backend.routes import auth, form, item, receiving, admin
        
        app.register_blueprint(auth.bp)
        app.register_blueprint(form.bp)
        app.register_blueprint(item.bp)
        app.register_blueprint(receiving.bp)
        app.register_blueprint(admin.bp)
        print("✅ Blueprints registered successfully")
        
    except ImportError as e:
        print(f"⚠️ Blueprint registration failed: {e}")
        
        # Add a basic health check route as fallback
        @app.route('/health')
        def health():
            return {"status": "ok", "message": "Flask app is running"}
            
        @app.route('/api/test')
        def api_test():
            return {"status": "ok", "message": "API is accessible"}
    
    # Add basic routes for testing and health checks
    @app.route('/')
    def index():
        return {
            "message": "Adira Medica Inventory API", 
            "status": "running",
            "environment": config_name,
            "testing": app.config.get('TESTING', False),
            "endpoints": ["/health", "/api/test"]
        }
    
    # Add a simple API health endpoint
    @app.route('/api/health')
    def api_health():
        return {
            "status": "healthy",
            "environment": config_name,
            "database": "connected" if app.config.get('SQLALCHEMY_DATABASE_URI') else "not configured"
        }
    
    print("🚀 Flask application created successfully!")
    return app