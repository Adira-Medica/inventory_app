from flask import request
from datetime import datetime
import os
import json

def log_authentication_event(action, username, user_id=None, success=True, details=None, ip_address=None):
    """
    Special logger for authentication events with additional security details
    
    Args:
        action (str): Action being performed (login, logout, etc.)
        username (str): Username of the user
        user_id (int, optional): ID of the user if available
        success (bool): Whether the authentication action succeeded
        details (str, optional): Additional details about the event
        ip_address (str, optional): IP address of the request
    """
    try:
        # Get IP address if not provided
        if not ip_address:
            ip_address = request.remote_addr or '127.0.0.1'
            
        # Create log entry
        log_entry = {
            'id': datetime.now().timestamp(),
            'timestamp': datetime.now().isoformat(),
            'event_type': 'authentication',
            'action': action,  # login, logout, password_change, etc.
            'username': username,
            'user_id': user_id,
            'success': success,
            'details': details,
            'ip_address': ip_address,
            'user_agent': request.user_agent.string if hasattr(request, 'user_agent') else 'Unknown'
        }
        
        # Path to auth log file
        logs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
        logs_path = os.path.join(logs_dir, 'auth_audit.json')
        
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
                    logs = []
        else:
            logs = []
        
        # Add new log entry
        logs.append(log_entry)
        
        # Write logs back to file
        with open(logs_path, 'w') as f:
            json.dump(logs, f, indent=4)
            
        return True
    except Exception as e:
        print(f"Error logging authentication event: {str(e)}")
        return False