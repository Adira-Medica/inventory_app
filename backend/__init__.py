# backend/__init__.py
import os
import sys
from flask import Flask
from flask_migrate import Migrate # type: ignore

def create_app():
    """Application factory function with robust error handling"""
    
    # Get current directory for imports
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Loading configuration: {os.getenv('FLASK_ENV', 'development')}")
    
    try:
        # Import configuration
        from backend.config import Config
        print("✅ Configuration loaded successfully")
    except ImportError as e:
        print(f"⚠️ Config import failed: {e}")
        # Fallback configuration
        class Config:
            SQLALCHEMY_DATABASE_URI = "postgresql://postgres:Gom%40thinger123@localhost:5432/inventory_db"
            SQLALCHEMY_TRACK_MODIFICATIONS = False
            SECRET_KEY = 'dev-key-123'
            JWT_SECRET_KEY = 'jwt-key-123'
            JWT_ACCESS_TOKEN_EXPIRES = False
        print("✅ Fallback development configuration loaded")
    
    # Create Flask app
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Debug configuration
    print(f"Starting Flask app with config: {os.getenv('FLASK_ENV', 'development')}")
    print(f"Database URI set: {'Yes' if app.config.get('SQLALCHEMY_DATABASE_URI') else 'No'}")
    print(f"Testing mode: {app.config.get('TESTING', False)}")
    print(f"Debug mode: {app.config.get('DEBUG', False)}")
    
    # Initialize migrate here to avoid circular imports
    migrate = Migrate()
    
    try:
        # Import and initialize extensions
        from backend.extensions import db, jwt, cors
        
        db.init_app(app)
        jwt.init_app(app)
        cors.init_app(app, resources={
            r"/api/*": {
                "origins": ["http://localhost:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        })
        migrate.init_app(app, db)
        print("✅ Extensions initialized successfully")
        
    except ImportError as e:
        print(f"⚠️ Extension initialization failed: {e}")
        # Continue without extensions for basic functionality
    
    try:
        # Import and register error handlers
        from backend.utils.error_handlers import register_error_handlers
        register_error_handlers(app)
        print("✅ Error handlers registered successfully")
        
    except ImportError as e:
        print(f"⚠️ Error handlers registration failed: {e}")
        # Add basic error handler
        @app.errorhandler(404)
        def not_found(error):
            return {"error": "Not found"}, 404
            
        @app.errorhandler(500)
        def internal_error(error):
            return {"error": "Internal server error"}, 500
    
    try:
        # Import and register blueprints
        from backend.routes import auth, form, item, receiving, admin
        
        app.register_blueprint(auth.bp)
        app.register_blueprint(form.bp)
        app.register_blueprint(item.bp)
        app.register_blueprint(receiving.bp)
        app.register_blueprint(admin.bp)
        print("✅ Blueprints registered successfully")
        
    except ImportError as e:
        print(f"⚠️ Blueprint registration failed: {e}")
        # Add a basic health check route
        @app.route('/health')
        def health():
            return {"status": "ok", "message": "Flask app is running"}
    
    print("🚀 Flask application created successfully!")
    return app