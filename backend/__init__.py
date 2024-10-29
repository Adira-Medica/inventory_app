from flask import Flask
from flask_sqlalchemy import SQLAlchemy # type: ignore
from flask_migrate import Migrate # type: ignore
from flask_jwt_extended import JWTManager # type: ignore
from .config import Config
  # Register receiving blueprint


db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from .routes import item, auth, form, receiving
    app.register_blueprint(item.bp)
    app.register_blueprint(auth.bp)
    app.register_blueprint(form.bp)
    app.register_blueprint(receiving.bp)

    return app
