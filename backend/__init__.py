# backend/__init__.py
import os
from flask import Flask
from flask_migrate import Migrate  # type: ignore
from flask_limiter import Limiter  # type: ignore
from flask_limiter.util import get_remote_address  # type: ignore
from .config import get_config  # Updated import
from .extensions import db, jwt, cors  # Note the dot before extensions
from .utils.error_handlers import register_error_handlers

migrate = Migrate()

def create_app(config_name=None):
    """Application factory pattern with configuration selection"""
    app = Flask(__name__)
    
    # Get configuration based on environment or parameter
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # Print configuration info for debugging (non-sensitive info only)
    print(f"Starting Flask app with config: {config_class.__name__}")
    print(f"Database URI set: {'Yes' if app.config.get('SQLALCHEMY_DATABASE_URI') else 'No'}")
    print(f"Testing mode: {app.config.get('TESTING', False)}")
    print(f"Debug mode: {app.config.get('DEBUG', False)}")
    
    # Initialize rate limiter with conditional settings
    limiter = Limiter(
        key_func=get_remote_address,
        default_limits=["1000 per day", "100 per hour"] if app.config.get('TESTING') else ["200 per day", "50 per hour"],
        storage_uri="memory://",
    )
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    
    # CORS configuration - more permissive in testing
    cors_origins = ["http://localhost:3000"]
    if app.config.get('TESTING'):
        cors_origins.extend(["http://localhost:3001", "http://127.0.0.1:3000"])
    
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    migrate.init_app(app, db)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register blueprints
    try:
        from .routes import auth, form, item, receiving, admin
        app.register_blueprint(auth.bp)
        app.register_blueprint(form.bp)
        app.register_blueprint(item.bp)
        app.register_blueprint(receiving.bp)
        app.register_blueprint(admin.bp)
        print("✅ All blueprints registered successfully")
    except ImportError as e:
        print(f"⚠️ Warning: Could not import some blueprints: {e}")
        # In testing, we might want to continue without all blueprints
        if not app.config.get('TESTING'):
            raise
    
    # Initialize JWT blacklist
    @app.before_first_request
    def initialize_jwt_blacklist():
        if 'JWT_BLACKLIST' not in app.config:
            app.config['JWT_BLACKLIST'] = set()
    
    # Add a simple health check route
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'config': config_class.__name__}
    
    # Add a root route for basic testing
    @app.route('/')
    def root():
        return {'message': 'AdiraMedica Inventory API', 'status': 'running'}
    
    return app

# For backward compatibility and direct imports
def create_app_legacy():
    """Legacy app creation for existing code"""
    return create_app()