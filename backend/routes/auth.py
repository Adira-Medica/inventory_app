# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from ..models import Role, User
from ..extensions import db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# backend/routes/auth.py
@bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'error': 'Missing username or password'}), 400

        user = User.query.filter_by(username=data['username']).first()
        
        if user and user.check_password(data['password']):
            if not user.active:
                return jsonify({'error': 'Account is deactivated'}), 401

            access_token = create_access_token(identity={
                'id': user.id,
                'username': user.username,
                'role': user.role.name  # Assuming role is now a relationship
            })
            return jsonify({
                'token': access_token,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role.name
                }
            }), 200
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# routes/auth.py
@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    # Get the role object instead of using the string
    role = Role.query.filter_by(name=data['role']).first()
    if not role:
        return jsonify({'error': 'Invalid role'}), 400
        
    user = User(
        username=data['username'],
        role_id=role.id  # Set role_id instead of role
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201