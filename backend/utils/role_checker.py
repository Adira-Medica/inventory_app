from functools import wraps
from flask_jwt_extended import get_jwt_identity
from flask import jsonify
from ..models import User

def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if user and user.role == role:
                return fn(*args, **kwargs)
            else:
                return jsonify({"error": "Unauthorized"}), 403
        return wrapper
    return decorator
