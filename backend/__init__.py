# backend/__init__.py
from flask import Flask
from flask_migrate import Migrate # type: ignore
from .config import Config  # Note the dot before config
from .extensions import db, jwt, cors  # Note the dot before extensions
from .utils.error_handlers import register_error_handlers

migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
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

    # Register error handlers
    register_error_handlers(app)  # Add this line
    
    # Register blueprints
    from .routes import auth, form, item, receiving
    app.register_blueprint(auth.bp)
    app.register_blueprint(form.bp)
    app.register_blueprint(item.bp)
    app.register_blueprint(receiving.bp)
    
    return app