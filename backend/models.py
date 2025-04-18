# models.py
from .extensions import db
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    permissions = db.Column(db.JSON)
    
    # Relationship with users
    users = db.relationship('User', backref='role', lazy=True)

class User(db.Model):
    __tablename__ = 'users'
   
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=True)  # New first name field
    last_name = db.Column(db.String(50), nullable=True)  # New last name field
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))
    active = db.Column(db.Boolean, default=True)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'approved', 'rejected'
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    failed_login_attempts = db.Column(db.Integer, default=0)  # Track failed login attempts
    lockout_until = db.Column(db.DateTime, nullable=True)  # Account lockout timestamp
    
    # Existing methods
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
        
    # New methods for handling login attempts
    def increment_failed_attempts(self):
        self.failed_login_attempts += 1
        
        # Progressive lockout strategy
        if self.failed_login_attempts >= 10:
            self.lockout_until = datetime.utcnow() + timedelta(hours=1)
        elif self.failed_login_attempts >= 5:
            self.lockout_until = datetime.utcnow() + timedelta(minutes=15)
        
    def reset_failed_attempts(self):
        self.failed_login_attempts = 0
        self.lockout_until = None
        
    def is_locked_out(self):
        if not self.lockout_until:
            return False
        return datetime.utcnow() < self.lockout_until
    
    # Helper method to get full name
    def get_full_name(self):
        """Returns the user's full name, or username if name fields are not set"""
        if self.first_name or self.last_name:
            return f"{self.first_name or ''} {self.last_name or ''}".strip()
        return self.username

class ItemNumber(db.Model):
    __tablename__ = 'item_number'
    
    id = db.Column(db.Integer, primary_key=True)
    item_number = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
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
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_obsolete = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_items', passive_deletes=True)
    updater = db.relationship('User', foreign_keys=[updated_by], backref='updated_items', passive_deletes=True)
    receiving_data = db.relationship('ReceivingData', backref='item', lazy=True)

class ReceivingData(db.Model):
    __tablename__ = 'receiving_data'
    
    id = db.Column(db.Integer, primary_key=True)
    item_number = db.Column(db.String(50), db.ForeignKey('item_number.item_number'), nullable=False)
    receiving_no = db.Column(db.String(20), unique=True, nullable=False)
    tracking_number = db.Column(db.String(50))
    lot_no = db.Column(db.String(50))
    po_no = db.Column(db.String(50))
    total_units_vendor = db.Column(db.Integer)
    total_storage_containers = db.Column(db.Integer)
    exp_date = db.Column(db.Date)
    ncmr = db.Column(db.String(5))
    total_units_received = db.Column(db.Integer)
    temp_device_in_alarm = db.Column(db.String(20))
    ncmr2 = db.Column(db.String(5))
    temp_device_deactivated = db.Column(db.String(5))
    temp_device_returned_to_courier = db.Column(db.String(5))
    comments_for_520b = db.Column(db.Text)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_obsolete = db.Column(db.Boolean, default=False)
    display_order = db.Column(db.Integer)
    
    # Relationships
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_receivings', passive_deletes=True)
    updater = db.relationship('User', foreign_keys=[updated_by], backref='updated_receivings', passive_deletes=True)
