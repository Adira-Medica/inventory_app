# backend/routes/auth.py - Your original working version
from datetime import datetime, timedelta
import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, get_jwt # type: ignore
from ..models import Role, User
from ..extensions import db, jwt
from ..utils.role_checker import role_required
from ..utils.auth_logger import log_authentication_event

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Track blacklisted tokens 
blacklisted_tokens = set()

@jwt.token_in_blocklist_loader
def check_if_token_is_revoked(jwt_header, jwt_payload):
    jti = jwt_payload["jti"]
    return jti in blacklisted_tokens

@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"Login attempt for username: {data.get('username')}")
        
        if not data or 'username' not in data or 'password' not in data:
            print("Missing username or password")
            log_authentication_event(
                action="Login",
                username=data.get('username', 'Unknown'),
                success=False,
                details="Missing username or password"
            )
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user:
            print(f"User not found: {data.get('username')}")
            log_authentication_event(
                action="Login",
                username=data.get('username'),
                success=False,
                details="User not found"
            )
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is locked out
        if user.is_locked_out():
            remaining = int((user.lockout_until - datetime.utcnow()).total_seconds() / 60)
            log_authentication_event(
                action="Login",
                username=user.username,
                user_id=user.id,
                success=False,
                details=f"Account locked due to too many failed attempts. Try again in {remaining} minutes."
            )
            return jsonify({
                'error': f'Account temporarily locked. Try again in {remaining} minutes.',
                'lockout': True
            }), 429
        
        password_check = user.check_password(data['password'])
        print(f"Password check: {password_check}")
        
        if not password_check:
            # Increment failed login attempts
            user.increment_failed_attempts()
            db.session.commit()
            
            log_authentication_event(
                action="Login",
                username=user.username,
                user_id=user.id,
                success=False,
                details=f"Invalid password. Failed attempts: {user.failed_login_attempts}"
            )
            
            if user.is_locked_out():
                lockout_minutes = int((user.lockout_until - datetime.utcnow()).total_seconds() / 60)
                return jsonify({
                    'error': f'Too many failed attempts. Account locked for {lockout_minutes} minutes.',
                    'lockout': True
                }), 429
            
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.active:
            print(f"User {user.username} is inactive")
            log_authentication_event(
                action="Login",
                username=user.username,
                user_id=user.id,
                success=False,
                details="Account is deactivated"
            )
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Consider NULL or None status as 'approved' for existing users
        if hasattr(user, 'status') and user.status is not None and user.status == 'pending':
            print(f"User {user.username} is pending approval")
            log_authentication_event(
                action="Login",
                username=user.username,
                user_id=user.id,
                success=False,
                details="Account is pending admin approval"
            )
            return jsonify({'error': 'Your account is pending admin approval'}), 401
        
        # Success path - reset failed attempts
        user.reset_failed_attempts()
        db.session.commit()
        
        # Create JWT token
        print(f"Login successful for {user.username}, role: {user.role.name}")
        access_token = create_access_token(identity={
            'id': user.id,
            'username': user.username,
            'role': user.role.name
        })
        
        # Log successful login
        log_authentication_event(
            action="Login",
            details=f"User logged in successfully",
            username=user.username,
            user_id=user.id,
            success=True
        )
        
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': user.role.name
            }
        }), 200
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        print(f"Registration request for: {data.get('username')}")
        
        # Validate email format
        if 'email' not in data or not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['email']):
            return jsonify({'error': 'Valid email address is required'}), 400
        
        # Check allowed email domains
        domain = data['email'].split('@')[-1].lower()
        allowed_domains = ['adiramedica.com', 'adirahealth.com']
        if domain not in allowed_domains:
            return jsonify({'error': 'Only company email addresses are allowed'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Validate password complexity
        password = data['password']
        if (len(password) < 8 or
            not re.search(r'[A-Z]', password) or
            not re.search(r'[a-z]', password) or
            not re.search(r'[0-9]', password) or
            not re.search(r'[^A-Za-z0-9]', password)):
            return jsonify({'error': 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'}), 400
            
        # Check for existing username
        if User.query.filter_by(username=data['username']).first():
            print(f"Username already exists: {data.get('username')}")
            return jsonify({'error': 'Username already exists'}), 400
        
        # Get the role object - default to 'user' role
        role_name = data.get('role', 'user')
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            print(f"Invalid role requested: {role_name}")
            return jsonify({'error': 'Invalid role'}), 400
            
        # Set initial status - default to 'pending' unless specified
        status = data.get('status', 'pending')
        print(f"Setting user status to: {status}")
        
        # Active by default only if admin-created and approved
        active = True if status == 'approved' else False
        print(f"Setting user active status to: {active}")
        
        # Create user
        user = User(
            username=data['username'],
            email=data['email'],  # Store email
            role_id=role.id,
            status=status,
            active=active,
            registration_date=datetime.utcnow()
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        # Log registration
        log_authentication_event(
            action="Register",
            username=user.username,
            user_id=user.id,
            success=True,
            details=f"New user registration with role {role_name}, status {status}"
        )
        
        print(f"User {user.username} registered with status: {status}, ID: {user.id}")
        return jsonify({
            'message': 'Registration successful! ' +
                      ('Account is ready to use.' if status == 'approved' else 'Your account is pending admin approval.'),
            'status': status,
            'id': user.id
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error in registration: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)  # Make JWT optional so it doesn't error if token is missing
def logout():
    try:
        # Get current JWT token
        jwt_data = get_jwt()
        if jwt_data:
            # Add token to blacklist
            jti = jwt_data.get("jti")
            if jti:
                blacklisted_tokens.add(jti)
                print(f"Token {jti} blacklisted")
                
        # Try to get current user identity
        current_user = get_jwt_identity()
        
        # Log the logout action
        if current_user:
            # If we have user info, use it
            username = current_user.get('username', 'Unknown')
            user_id = current_user.get('id')
            log_authentication_event(
                action="Logout",
                details="User logged out",
                username=username,
                user_id=user_id,
                success=True
            )
        else:
            # Anonymous logout (token might be expired or missing)
            log_authentication_event(
                action="Logout",
                details="Anonymous logout (no valid token)",
                username="Unknown",
                user_id=None,
                success=True
            )
        
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        print(f"Error in logout: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/extend-session', methods=['POST'])
@jwt_required()
def extend_session():
    try:
        # Get current user
        current_user = get_jwt_identity()
        
        # Create new token with fresh expiry
        new_token = create_access_token(identity={
            'id': current_user.get('id'),
            'username': current_user.get('username'),
            'role': current_user.get('role')
        })
        
        # Log the session extension
        log_authentication_event(
            action="Session Extension",
            username=current_user.get('username'),
            user_id=current_user.get('id'),
            success=True,
            details="User extended their session"
        )
        
        return jsonify({'token': new_token}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint to get user profile information
@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        user_id = current_user.get('id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.name,
            'active': user.active,
            'status': user.status,
            'registration_date': user.registration_date.isoformat() if user.registration_date else None
        }), 200
    except Exception as e:
        print(f"Error getting user profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Endpoint to change password
@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        data = request.get_json()
        current_user = get_jwt_identity()
        user_id = current_user.get('id')
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Verify current password
        if not user.check_password(data.get('current_password')):
            log_authentication_event(
                action="Password Change",
                username=user.username,
                user_id=user.id,
                success=False,
                details="Failed password change attempt - incorrect current password"
            )
            return jsonify({'error': 'Current password is incorrect'}), 401
            
        # Validate new password complexity
        new_password = data.get('new_password')
        if (len(new_password) < 8 or
            not re.search(r'[A-Z]', new_password) or
            not re.search(r'[a-z]', new_password) or
            not re.search(r'[0-9]', new_password) or
            not re.search(r'[^A-Za-z0-9]', new_password)):
            return jsonify({'error': 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'}), 400
            
        # Check that new password is different from current
        if user.check_password(new_password):
            return jsonify({'error': 'New password must be different from current password'}), 400
            
        # Update password
        user.set_password(new_password)
        db.session.commit()
        
        # Log the password change
        log_authentication_event(
            action="Password Change",
            username=user.username,
            user_id=user.id,
            success=True,
            details="Password changed successfully"
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        print(f"Error changing password: {str(e)}")
        return jsonify({'error': str(e)}), 500