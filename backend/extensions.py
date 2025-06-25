from flask_sqlalchemy import SQLAlchemy # type: ignore
from flask_migrate import Migrate # type: ignore
from flask_jwt_extended import JWTManager # type: ignore
from flask_cors import CORS # type: ignore

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()