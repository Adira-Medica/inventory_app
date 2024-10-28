# backend/inventory_app/utils/role_checker.py

from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from ..models import User

def role_required(role):
    # Decorator to restrict route access to specific roles
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            if current_user_id is None:
                return jsonify({"error": "Unauthorized: No user identity found"}), 403
            
            user = User.query.get(current_user_id)
            if user and user.role == role:
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Unauthorized: Insufficient role"}), 403
        return wrapper
    return decorator
