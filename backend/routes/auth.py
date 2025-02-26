# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from ..models import Role, User
from ..extensions import db
from ..utils.role_checker import role_required

bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        print(f"Login attempt for username: {data.get('username')}")
        
        if not data or 'username' not in data or 'password' not in data:
            print("Missing username or password")
            return jsonify({'error': 'Missing username or password'}), 400
        
        user = User.query.filter_by(username=data['username']).first()
        
        if not user:
            print(f"User not found: {data.get('username')}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        password_check = user.check_password(data['password'])
        print(f"Password check: {password_check}")
        
        if not password_check:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.active:
            print(f"User {user.username} is inactive")
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Consider NULL or None status as 'approved' for existing users
        if hasattr(user, 'status') and user.status is not None and user.status == 'pending':
            print(f"User {user.username} is pending approval")
            return jsonify({'error': 'Your account is pending admin approval'}), 401
        
        # Success path
        print(f"Login successful for {user.username}, role: {user.role.name}")
        access_token = create_access_token(identity={
            'id': user.id,
            'username': user.username,
            'role': user.role.name
        })

        # If login successful, log the activity
        from ..utils.audit_logger import log_activity
        log_activity(
            action="Login",
            details=f"User logged in successfully",
            username=user.username,
            user_id=user.id
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
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400
       
        # Get the role object - default to 'user' role
        role_name = data.get('role', 'user')
        role = Role.query.filter_by(name=role_name).first()
        if not role:
            return jsonify({'error': 'Invalid role'}), 400
           
        # Create user with pending status
        user = User(
            username=data['username'],
            role_id=role.id,
            status='pending'  # Set initial status to pending
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
       
        return jsonify({
            'message': 'Registration successful! Your account is pending admin approval.',
            'status': 'pending'
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# backend/routes/auth.py - Ensure this endpoint exists and works correctly
@bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_users():
    try:
        # Get all users with their roles
        users = User.query.all()
        users_data = []
        
        for user in users:
            user_data = {
                'id': user.id,
                'username': user.username,
                'role': {
                    'id': user.role.id,
                    'name': user.role.name
                },
                'active': user.active
            }
            
            # Add status if it exists
            if hasattr(user, 'status'):
                user_data['status'] = user.status
                
            users_data.append(user_data)
        
        return jsonify(users_data), 200
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': str(e)}), 500

# backend/routes/auth.py - Enhance the logout endpoint
@bp.route('/logout', methods=['POST'])
@jwt_required(optional=True)  # Make JWT optional so it doesn't error if token is missing
def logout():
    try:
        # Try to get current user identity
        current_user = get_jwt_identity()
        
        # Log the logout action
        if current_user:
            # If we have user info, use it
            username = current_user.get('username', 'Unknown')
            user_id = current_user.get('id')
            from ..utils.audit_logger import log_activity
            log_activity(
                action="Logout",
                details="User logged out",
                username=username,
                user_id=user_id
            )
        else:
            # Anonymous logout (token might be expired or missing)
            from ..utils.audit_logger import log_activity
            log_activity(
                action="Logout",
                details="Anonymous logout (no valid token)",
                username="Unknown",
                user_id=None
            )
        
        # In a real implementation, you might blacklist the token
        # For now, just return success
        return jsonify({'message': 'Logged out successfully'}), 200
    except Exception as e:
        print(f"Error in logout: {str(e)}")
        return jsonify({'error': str(e)}), 500