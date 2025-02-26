# backend/utils/role_checker.py
from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from ..models import User

def role_required(roles):
    """
    Decorator that checks if the user has any of the required roles
    :param roles: Single role string or list of role strings
    """
    if isinstance(roles, str):
        roles = [roles]
    
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Get user identity from JWT token
            user_identity = get_jwt_identity()
            
            if user_identity is None:
                return jsonify({"error": "Unauthorized: No user identity found"}), 403
            
            # For user identity we stored a dict with user information
            user_id = user_identity.get('id')
            
            if not user_id:
                return jsonify({"error": "Unauthorized: Invalid user identity"}), 403
            
            # Fetch user from database to get current role
            user = User.query.get(user_id)
            
            if not user or not user.active:
                return jsonify({"error": "Unauthorized: User not found or inactive"}), 403
            
            if user.role and user.role.name in roles:
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Unauthorized: Insufficient permissions"}), 403
                
        return wrapper
    return decorator