# backend/models.py
from .extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

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
    other_storage_conditions = db.Column(db.String(50))
    max_exposure_time = db.Column(db.Integer)
    temper_time = db.Column(db.Integer)
    working_exposure_time = db.Column(db.Integer)
    vendor_code_rev = db.Column(db.String(50), nullable=False)
    randomized = db.Column(db.String(10), nullable=False)
    sequential_numbers = db.Column(db.String(10), nullable=False)
    study_type = db.Column(db.String(50), nullable=False)

class ReceivingData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item_number.id'), nullable=False)
    receiving_no = db.Column(db.String(20), unique=True, nullable=False)
    tracking_number = db.Column(db.String(50))
    lot_no = db.Column(db.String(50))
    po_no = db.Column(db.String(50))
    total_units_vendor = db.Column(db.Integer)
    total_storage_containers = db.Column(db.Integer)
    exp_date = db.Column(db.String(20))
    ncmr = db.Column(db.String(5))
    total_units_received = db.Column(db.Integer)
    temp_device_in_alarm = db.Column(db.String(20))
    temp_device_deactivated = db.Column(db.String(5))
    temp_device_returned_to_courier = db.Column(db.String(5))
    comments_for_520b = db.Column(db.String(200))