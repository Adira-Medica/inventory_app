# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from ..models import User
from ..extensions import db

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity={
            'id': user.id,
            'username': user.username,
            'role': user.role
        })
        return jsonify({
            'token': access_token,
            'user': {
                'username': user.username,
                'role': user.role
            }
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    user = User(username=data['username'], role=data['role'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully'}), 201