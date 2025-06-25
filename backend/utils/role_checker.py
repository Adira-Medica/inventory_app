# backend/utils/role_checker.py
from functools import wraps
from flask_jwt_extended import get_jwt_identity # type: ignore
from flask import jsonify, request
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
            current_user = get_jwt_identity()
            if current_user is None:
                return jsonify({"error": "Unauthorized: No user identity found"}), 403
           
            # Extract user information
            user_id = current_user.get('id') if isinstance(current_user, dict) else current_user
            user = User.query.get(user_id)
            
            if not user:
                return jsonify({"error": "Unauthorized: User not found"}), 403
                
            if user.role and user.role.name in roles:
                # Special case for item routes - managers should not be able to create/update items
                if user.role.name == 'manager' and 'item' in request.path and request.method in ['POST', 'PUT', 'DELETE']:
                    # Allow only GET requests for managers on item routes
                    return jsonify({"error": "Unauthorized: Managers can only view item data"}), 403
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Unauthorized: Insufficient role"}), 403
        return wrapper
    return decorator