from . import db
from flask_bcrypt import Bcrypt # type: ignore

bcrypt = Bcrypt()

class ItemNumber(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_number = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(200), nullable=False)
    client = db.Column(db.String(100), nullable=False)
    protocol_number = db.Column(db.String(50), nullable=False)
    vendor = db.Column(db.String(100), nullable=False)
    uom = db.Column(db.String(50), nullable=False)
    controlled = db.Column(db.String(50), nullable=False)
    temp_storage_conditions = db.Column(db.String(50), nullable=False)
    other_storage_conditions = db.Column(db.String(50), nullable=True)
    max_exposure_time = db.Column(db.Integer, nullable=True)
    temper_time = db.Column(db.Integer, nullable=True)
    working_exposure_time = db.Column(db.Integer, nullable=True)
    vendor_code_rev = db.Column(db.String(50), nullable=False)
    randomized = db.Column(db.String(10), nullable=False)
    sequential_numbers = db.Column(db.String(10), nullable=False)
    study_type = db.Column(db.String(50), nullable=False)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Admin, Manager, User

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)
