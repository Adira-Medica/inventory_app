# backend/utils/audit_logger.py
from flask import request
from flask_jwt_extended import get_jwt_identity
from datetime import datetime
import os
import json

def log_activity(action, details, username=None, user_id=None):
    try:
        # Get current user from JWT if username not provided
        if not username or not user_id:
            current_user = get_jwt_identity()
            username = current_user.get('username', 'Unknown') if current_user else 'Anonymous'
            user_id = current_user.get('id') if current_user else None
        
        # Create log entry
        log_entry = {
            'id': datetime.now().timestamp(),  # Use timestamp as unique ID
            'timestamp': datetime.now().isoformat(),
            'username': username,
            'user_id': user_id,
            'action': action,
            'details': details,
            'ipAddress': request.remote_addr or '127.0.0.1'
        }
        
        # Path to audit log file
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        logs_path = os.path.join(logs_dir, 'audit.json')
        
        # Ensure directory exists
        os.makedirs(logs_dir, exist_ok=True)
        
        # Read existing logs or create empty list
        if os.path.exists(logs_path):
            with open(logs_path, 'r') as f:
                try:
                    logs = json.load(f)
                    if not isinstance(logs, list):
                        logs = []
                except json.JSONDecodeError:
                    # If file is corrupted, start fresh
                    logs = []
        else:
            logs = []
        
        # Add new log entry
        logs.append(log_entry)
        
        # Write logs back to file
        with open(logs_path, 'w') as f:
            json.dump(logs, f, indent=4)
            
        print(f"Activity logged: {action} by {username}")
        return True
    except Exception as e:
        print(f"Error logging activity: {str(e)}")
        return False