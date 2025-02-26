# backend/routes/admin.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..utils.role_checker import role_required
from ..models import User, Role, ItemNumber, ReceivingData
from ..extensions import db
from ..utils.audit_logger import log_activity
from datetime import datetime, timedelta
import os
import json

bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# User Management Endpoints
@bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_users():
    try:
        print("Fetching all users for admin dashboard")
        # Get all users with their roles
        users = User.query.all()
        users_data = []
        
        for user in users:
            print(f"Processing user: {user.username}")
            role_name = user.role.name if user.role else "unknown"
            
            user_data = {
                'id': user.id,
                'username': user.username,
                'role': {
                    'id': user.role.id if user.role else 0,
                    'name': role_name
                },
                'active': user.active
            }
            
            # Add status if it exists
            if hasattr(user, 'status'):
                user_data['status'] = user.status
                
            users_data.append(user_data)
        
        print(f"Returning {len(users_data)} users")
        return jsonify(users_data), 200
    except Exception as e:
        print(f"Error fetching users: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_user(id):
    try:
        user = User.query.get_or_404(id)
        data = request.get_json()
        
        # Update user fields
        if 'username' in data:
            user.username = data['username']
        
        if 'role' in data:
            role = Role.query.filter_by(name=data['role']).first()
            if not role:
                return jsonify({'error': 'Invalid role'}), 400
            user.role_id = role.id
        
        if 'active' in data:
            user.active = data['active']
        
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        
        db.session.commit()
        
        # Log this action
        log_activity(
            action="Update", 
            details=f"Updated user: {user.username}"
        )
        
        return jsonify({'message': 'User updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<int:id>/toggle-status', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def toggle_user_status(id):
    try:
        user = User.query.get_or_404(id)
        user.active = not user.active
        db.session.commit()
        
        # Log this action
        action_type = 'Activate' if user.active else 'Deactivate'
        log_activity(
            action=action_type, 
            details=f"{action_type}d user: {user.username}"
        )
        
        return jsonify({
            'message': f'User {"activated" if user.active else "deactivated"} successfully',
            'active': user.active
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/users/pending', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_pending_users():
    try:
        pending_users = User.query.filter_by(status='pending').all()
        users_data = [{
            'id': user.id,
            'username': user.username,
            'role': {
                'id': user.role.id,
                'name': user.role.name
            },
            'registration_date': user.registration_date.isoformat() if hasattr(user, 'registration_date') and user.registration_date else None
        } for user in pending_users]
        
        return jsonify(users_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<int:id>/approve', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def approve_user(id):
    try:
        user = User.query.get_or_404(id)
        user.status = 'approved'
        db.session.commit()
        
        # Log this action
        log_activity(
            action="Approve", 
            details=f"Approved user registration: {user.username}"
        )
        
        return jsonify({
            'message': 'User approved successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'status': user.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<int:id>/reject', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def reject_user(id):
    try:
        user = User.query.get_or_404(id)
        user.status = 'rejected'
        db.session.commit()
        
        # Log this action
        log_activity(
            action="Reject", 
            details=f"Rejected user registration: {user.username}"
        )
        
        return jsonify({
            'message': 'User registration rejected',
            'user': {
                'id': user.id,
                'username': user.username,
                'status': user.status
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# System Settings Endpoints
@bp.route('/settings', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_settings():
    try:
        # Path to settings file
        settings_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'settings.json')
        
        # Check if settings file exists, if not create with defaults
        if not os.path.exists(settings_path):
            default_settings = {
                'pdfStorage': os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated'),
                'backupEnabled': True,
                'backupFrequency': 'daily',
                'applicationName': 'AdiraMedica Inventory',
                'sessionTimeout': 30
            }
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(settings_path), exist_ok=True)
            
            # Write default settings
            with open(settings_path, 'w') as f:
                json.dump(default_settings, f, indent=4)
            
            return jsonify(default_settings), 200
        
        # Read settings file
        with open(settings_path, 'r') as f:
            settings = json.load(f)
        
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/settings', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_settings():
    try:
        data = request.get_json()
        
        # Path to settings file
        settings_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config', 'settings.json')
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(settings_path), exist_ok=True)
        
        # Validate settings
        if 'sessionTimeout' in data and (data['sessionTimeout'] < 5 or data['sessionTimeout'] > 120):
            return jsonify({'error': 'Session timeout must be between 5 and 120 minutes'}), 400
        
        # Write settings to file
        with open(settings_path, 'w') as f:
            json.dump(data, f, indent=4)
        
        # Log this action
        log_activity(
            action="Update", 
            details="Updated system settings"
        )
        
        return jsonify({'message': 'Settings updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Audit Logs Endpoints
@bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_audit_logs():
    try:
        # Get query parameters for filtering
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        username = request.args.get('username')
        action_type = request.args.get('action')
        
        # Path to audit log file
        logs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'audit.json')
        
        # Check if logs file exists
        if not os.path.exists(logs_path):
            print("Audit logs file does not exist")
            return jsonify([]), 200
        
        # Read logs file
        with open(logs_path, 'r') as f:
            try:
                logs = json.load(f)
                if not isinstance(logs, list):
                    print("Audit logs file does not contain a list")
                    logs = []
            except json.JSONDecodeError:
                print("Error decoding audit logs JSON file")
                logs = []
        
        print(f"Retrieved {len(logs)} audit logs from file")
        
        # Apply filters if provided
        filtered_logs = logs
        
        if start_date:
            filtered_logs = [log for log in filtered_logs 
                            if log['timestamp'] >= start_date]
        
        if end_date:
            # Add one day to include the end date fully
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d')
            end_date_obj = end_date_obj + timedelta(days=1)
            end_date = end_date_obj.strftime('%Y-%m-%d')
            filtered_logs = [log for log in filtered_logs 
                            if log['timestamp'] < end_date]
        
        if username:
            filtered_logs = [log for log in filtered_logs 
                            if username.lower() in log['username'].lower()]
        
        if action_type:
            filtered_logs = [log for log in filtered_logs 
                            if log['action'] == action_type]
        
        # Sort logs by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        print(f"Returning {len(filtered_logs)} filtered audit logs")
        return jsonify(filtered_logs), 200
    except Exception as e:
        print(f"Error fetching audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add a route to create default roles if they don't exist
@bp.route('/initialize-roles', methods=['POST'])
def initialize_roles():
    try:
        # Check if roles already exist
        if Role.query.count() > 0:
            return jsonify({'message': 'Roles already initialized'}), 200
        
        # Create default roles
        roles = [
            Role(name='admin', permissions=json.dumps({'all': True})),
            Role(name='manager', permissions=json.dumps({
                'manage_items': True, 
                'manage_receiving': True, 
                'generate_forms': True
            })),
            Role(name='user', permissions=json.dumps({
                'view_items': True, 
                'view_receiving': True, 
                'generate_forms': True
            }))
        ]
        
        # Add roles to database
        db.session.bulk_save_objects(roles)
        db.session.commit()
        
        log_activity(
            action="Initialize", 
            details="Initialized default system roles",
            username="System",
            user_id=None
        )
        
        return jsonify({'message': 'Roles initialized successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Add a backup endpoint
@bp.route('/create-backup', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_backup():
    try:
        # In a real implementation, this would create a database backup
        # For this example, we'll just log the action
        log_activity(
            action="Backup", 
            details="Created manual database backup"
        )
        
        return jsonify({'message': 'Backup created successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add endpoint to get system statistics
@bp.route('/statistics', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_statistics():
    try:
        # Count users by role
        user_stats = {}
        roles = Role.query.all()
        for role in roles:
            count = User.query.filter_by(role_id=role.id).count()
            user_stats[role.name] = count
        
        # Count items and receiving data
        item_count = ItemNumber.query.count()
        receiving_count = ReceivingData.query.count()
        
        # Get active vs inactive users
        active_users = User.query.filter_by(active=True).count()
        inactive_users = User.query.filter_by(active=False).count()
        
        # Count forms generated (would require a specific table in a real implementation)
        # For now, we'll use a placeholder
        
        # Compile statistics
        statistics = {
            'users': {
                'total': User.query.count(),
                'active': active_users,
                'inactive': inactive_users,
                'byRole': user_stats
            },
            'data': {
                'items': item_count,
                'receiving': receiving_count
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(statistics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add endpoint to clear audit logs (for maintenance purposes)
@bp.route('/audit-logs/clear', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def clear_audit_logs():
    try:
        # Only super admins should have this power
        current_user = get_jwt_identity()
        user = User.query.get(current_user.get('id'))
        
        if not user or user.username != 'admin':
            return jsonify({'error': 'Only the main admin can clear audit logs'}), 403
        
        # Path to audit log file
        logs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'audit.json')
        
        # Check if logs file exists
        if os.path.exists(logs_path):
            # Create a backup before clearing
            backup_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 
                                      f'audit_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
            
            # Copy current logs to backup
            with open(logs_path, 'r') as src, open(backup_path, 'w') as dst:
                dst.write(src.read())
            
            # Clear the logs by writing an empty array
            with open(logs_path, 'w') as f:
                json.dump([], f)
            
            # Log this critical action
            log_activity(
                action="Clear Logs",
                details=f"Cleared audit logs (backup created at {backup_path})"
            )
            
            return jsonify({'message': 'Audit logs cleared successfully'}), 200
        else:
            return jsonify({'message': 'No audit logs found to clear'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500