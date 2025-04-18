# backend/__init__.py
from flask import Flask
from flask_migrate import Migrate  # type: ignore
from flask_limiter import Limiter # type: ignore
from flask_limiter.util import get_remote_address # type: ignore
from .config import active_config  # Note the dot before config
from .extensions import db, jwt, cors  # Note the dot before extensions
from .utils.error_handlers import register_error_handlers

migrate = Migrate()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# backend/__init__.py
def create_app():
    app = Flask(__name__)
    app.config.from_object(active_config)
   
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)
    
    cors.init_app(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    migrate.init_app(app, db)
   
    # Register error handlers
    register_error_handlers(app)
   
    # Register blueprints
    from .routes import auth, form, item, receiving, admin  # Add admin import
    app.register_blueprint(auth.bp)
    app.register_blueprint(form.bp)
    app.register_blueprint(item.bp)
    app.register_blueprint(receiving.bp)
    app.register_blueprint(admin.bp)  # Register admin blueprint
   
    # Initialize blacklisted tokens set on app context
    with app.app_context():
        app.config['JWT_BLACKLIST'] = set()
   
    return app