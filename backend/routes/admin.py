# backend/routes/admin.py
from flask import Blueprint, request, jsonify, send_file, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..utils.role_checker import role_required
from ..models import User, Role, ItemNumber, ReceivingData
from ..extensions import db
from ..utils.audit_logger import log_activity
from datetime import datetime, timedelta
import os
import json
import io
import csv

# Try to import pandas with fallback
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
    print("✅ Pandas imported successfully")
except ImportError as e:
    print(f"⚠️ Pandas not available: {e}")
    PANDAS_AVAILABLE = False
    # Create a dummy pandas for compatibility
    class DummyPandas:
        def DataFrame(self, data):
            return {'columns': [], 'to_excel': lambda *args, **kwargs: None}
        def ExcelWriter(self, *args, **kwargs):
            return self
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
    pd = DummyPandas()

# Try to import reportlab with fallback
try:
    from reportlab.lib import colors # type: ignore
    from reportlab.lib.pagesizes import letter, landscape # type: ignore
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer # type: ignore
    from reportlab.lib.styles import getSampleStyleSheet # type: ignore
    REPORTLAB_AVAILABLE = True
    print("✅ ReportLab imported successfully")
except ImportError as e:
    print(f"⚠️ ReportLab not available: {e}")
    REPORTLAB_AVAILABLE = False
    # Create dummy objects
    colors = None
    letter = None
    landscape = lambda x: x
    SimpleDocTemplate = None
    Table = None
    TableStyle = None
    Paragraph = None
    Spacer = None
    getSampleStyleSheet = lambda: {}

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
        print(f"Found {len(users)} users in database")
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
        print(f"Toggle status request received for user ID: {id}")
        user = User.query.get_or_404(id)
        
        # Toggle the active status
        user.active = not user.active
        db.session.commit()
        
        # Log this action
        action_type = 'Activate' if user.active else 'Deactivate'
        log_activity(
            action=action_type, 
            details=f"{action_type}d user: {user.username}"
        )
        
        print(f"User {user.username} status toggled to: {user.active}")
        return jsonify({
            'message': f'User {"activated" if user.active else "deactivated"} successfully',
            'active': user.active
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error toggling user status: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add more routes as needed...
@bp.route('/test', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def admin_test():
    return jsonify({
        'status': 'success',
        'message': 'Admin routes are working!',
        'pandas_available': PANDAS_AVAILABLE,
        'reportlab_available': REPORTLAB_AVAILABLE
    }), 200

@bp.route('/audit-logs/export', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def export_audit_logs():
    try:
        format_type = request.args.get('format', 'csv')  # Default to CSV since it doesn't need pandas
        
        if format_type == 'excel' and not PANDAS_AVAILABLE:
            return jsonify({'error': 'Excel export not available - pandas not installed'}), 400
            
        if format_type == 'pdf' and not REPORTLAB_AVAILABLE:
            return jsonify({'error': 'PDF export not available - reportlab not installed'}), 400
        
        # Get audit logs (simplified version)
        logs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'audit.json')
        
        filtered_logs = []
        if os.path.exists(logs_path):
            with open(logs_path, 'r') as f:
                try:
                    logs = json.load(f)
                    if isinstance(logs, list):
                        filtered_logs = logs
                except json.JSONDecodeError:
                    filtered_logs = []
        
        # Always return CSV if pandas/reportlab not available
        if format_type == 'csv' or not PANDAS_AVAILABLE:
            output = io.StringIO()
            
            if filtered_logs:
                all_columns = set()
                for log in filtered_logs:
                    all_columns.update(log.keys())
                
                writer = csv.DictWriter(output, fieldnames=sorted(list(all_columns)))
                writer.writeheader()
                writer.writerows(filtered_logs)
            else:
                writer = csv.writer(output)
                writer.writerow(['timestamp', 'username', 'action', 'details', 'ip_address'])
            
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }
            )
        
        # If pandas available and excel requested
        if format_type == 'excel' and PANDAS_AVAILABLE:
            output = io.BytesIO()
            
            if not filtered_logs:
                df = pd.DataFrame(columns=['timestamp', 'username', 'action', 'details', 'ip_address'])
            else:
                df = pd.DataFrame(filtered_logs)
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Logs')
            
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            )
        
        return jsonify({'error': 'Unsupported format or libraries not available'}), 400
        
    except Exception as e:
        print(f"Error exporting audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Include other essential routes but remove pandas/reportlab dependencies
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
            'system': {
                'pandas_available': PANDAS_AVAILABLE,
                'reportlab_available': REPORTLAB_AVAILABLE
            },
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(statistics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add other critical routes without pandas dependencies...
@bp.route('/audit-logs', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_audit_logs():
    try:
        logs_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'audit.json')
        
        if not os.path.exists(logs_path):
            return jsonify([]), 200
        
        with open(logs_path, 'r') as f:
            try:
                logs = json.load(f)
                if not isinstance(logs, list):
                    logs = []
            except json.JSONDecodeError:
                logs = []
        
        # Sort logs by timestamp (newest first)
        logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return jsonify(logs), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500