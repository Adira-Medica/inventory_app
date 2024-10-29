from . import db
from flask_bcrypt import Bcrypt # type: ignore
from flask import current_app
from sqlalchemy.orm import relationship, joinedload
from sqlalchemy.exc import SQLAlchemyError
from contextlib import contextmanager
from sqlalchemy.ext.hybrid import hybrid_property

bcrypt = Bcrypt()

class ItemNumber(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_number = db.Column(db.String(50), unique=True, nullable=False)
    _description = db.Column('description', db.String(200), nullable=False)

    @hybrid_property
    def description(self):
        return self._description

    @description.setter
    def description(self, value):
        self._description = value[:200]  # Ensure max length of 200

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
    locations = relationship("ItemLocation", back_populates="item")

    @classmethod
    def get_with_locations(cls, item_id):
        return cls.query.options(joinedload(cls.locations)).filter_by(id=item_id).first()
    
class ReceivingData(db.Model):
    __tablename__ = 'receiving_data'
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item_number.id'), nullable=False)  # Foreign key to ItemNumber
    receiving_no = db.Column(db.String(20), nullable=False, unique=True)
    tracking_number = db.Column(db.String(50), nullable=True)
    lot_no = db.Column(db.String(50), nullable=True)
    po_no = db.Column(db.String(10), nullable=True, default="N/A")
    total_units_vendor = db.Column(db.Integer, nullable=True)
    total_storage_containers = db.Column(db.Integer, nullable=True)
    exp_date = db.Column(db.String(20), nullable=True)  # Could be 'N/A', 'TBD', or a date
    ncmr = db.Column(db.String(5), nullable=True, default="N/A")  # Dropdown: 'Yes', 'No', 'N/A'
    total_units_received = db.Column(db.Integer, nullable=True)
    temp_device_in_alarm = db.Column(db.String(20), nullable=True, default="N/A")  # Dropdown: 'Yes - NCMR', 'No', 'N/A'
    ncmr2 = db.Column(db.String(5), nullable=True, default="N/A")  # Dropdown: 'Yes', 'No', 'N/A'
    temp_device_deactivated = db.Column(db.String(5), nullable=True, default="N/A")  # Dropdown: 'Yes', 'No', 'N/A'
    temp_device_returned_to_courier = db.Column(db.String(5), nullable=True, default="N/A")  # Dropdown: 'Yes', 'No', 'N/A'
    comments_for_520b = db.Column(db.String(20), nullable=True, default="N/A")  # Dropdown: 'N/A', 'Test 1', 'Test 2'

    item = db.relationship("ItemNumber", backref="receiving_data")

class ItemLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item_number.id'))
    location = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    item = relationship("ItemNumber", back_populates="locations")

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Admin, Manager, User

    def set_password(self, password):
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password, password)

@contextmanager
def db_session_manager(timeout=10):
    session = db.session
    session.execute('SET statement_timeout TO %d;' % (timeout * 1000))
    try:
        yield session
        session.commit()
    except SQLAlchemyError:
        session.rollback()
        raise
    finally:
        session.close()
