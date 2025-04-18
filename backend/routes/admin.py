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
import pandas as pd
import io
import csv
from reportlab.lib import colors # type: ignore
from reportlab.lib.pagesizes import letter, landscape # type: ignore
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer # type: ignore
from reportlab.lib.styles import getSampleStyleSheet # type: ignore


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
        print(f"Approving user ID: {id}")
        user = User.query.get_or_404(id)
        
        # Set status to approved and activate the user
        user.status = 'approved'
        user.active = True
        db.session.commit()
        
        # Log this action
        log_activity(
            action="Approve", 
            details=f"Approved user registration: {user.username}"
        )
        
        print(f"User {user.username} approved successfully")
        return jsonify({
            'message': 'User approved successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'status': user.status,
                'active': user.active
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error approving user: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/users/<int:id>/reject', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def reject_user(id):
    try:
        print(f"Rejecting user ID: {id}")
        user = User.query.get_or_404(id)
        
        # Set status to rejected and deactivate the user
        user.status = 'rejected'
        user.active = False
        db.session.commit()
        
        # Log this action
        log_activity(
            action="Reject", 
            details=f"Rejected user registration: {user.username}"
        )
        
        print(f"User {user.username} rejected successfully")
        return jsonify({
            'message': 'User registration rejected',
            'user': {
                'id': user.id,
                'username': user.username,
                'status': user.status,
                'active': user.active
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error rejecting user: {str(e)}")
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
    
@bp.route('/users/<int:id>/status', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_user_status(id):
    try:
        print(f"Updating status for user ID: {id}")
        user = User.query.get_or_404(id)
        data = request.get_json()
        
        print(f"Received data: {data}")
        if 'is_active' not in data:
            print("Missing is_active field")
            return jsonify({'error': 'is_active field is required'}), 400
        
        # Update user's active status
        user.active = data['is_active']
        db.session.commit()
        
        # Log this action
        action_type = 'Activate' if user.active else 'Deactivate'
        log_activity(
            action=action_type, 
            details=f"{action_type}d user: {user.username}"
        )
        
        print(f"User status updated to: {user.active}")
        return jsonify({
            'message': f'User {"activated" if user.active else "deactivated"} successfully',
            'active': user.active
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating user status: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
# Add this new endpoint for log export
@bp.route('/audit-logs/export', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def export_audit_logs():
    try:
        # Get query parameters for filtering
        format_type = request.args.get('format', 'excel')
        log_type = request.args.get('type', 'all')  # 'all', 'audit', 'auth'
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        username = request.args.get('username')
        action_type = request.args.get('action')
        
        # Determine which log files to read
        log_files = []
        if log_type == 'all' or log_type == 'audit':
            log_files.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'audit.json'))
        
        if log_type == 'all' or log_type == 'auth':
            log_files.append(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs', 'auth_audit.json'))
        
        # Collect all logs
        all_logs = []
        for log_file in log_files:
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    try:
                        logs = json.load(f)
                        if isinstance(logs, list):
                            all_logs.extend(logs)
                    except json.JSONDecodeError:
                        pass
        
        # Apply filters
        filtered_logs = all_logs
        
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
                           if username.lower() in log.get('username', '').lower()]
        
        if action_type:
            filtered_logs = [log for log in filtered_logs
                           if log.get('action') == action_type]
        
        # Sort logs by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Log the export activity
        log_activity(
            action="Export",
            details=f"Exported audit logs in {format_type} format with {len(filtered_logs)} entries"
        )
        
        # Create export based on requested format
        if format_type == 'excel':
            # Create Excel file
            output = io.BytesIO()
            
            if not filtered_logs:
                # Create an empty dataframe with headers if no logs
                df = pd.DataFrame(columns=['timestamp', 'username', 'action', 'details', 'ip_address'])
            else:
                df = pd.DataFrame(filtered_logs)
            
            # Convert timestamp to readable format
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Logs')
                
                # Auto-adjust columns' width
                worksheet = writer.sheets['Logs']
                for i, col in enumerate(df.columns):
                    max_length = max(df[col].astype(str).str.len().max() if len(df) > 0 else 0, len(col)) + 2
                    worksheet.column_dimensions[chr(65 + i)].width = max_length
            
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            )
            
        elif format_type == 'csv':
            # Create CSV file
            output = io.StringIO()
            
            if filtered_logs:
                # Get all possible columns from all logs
                all_columns = set()
                for log in filtered_logs:
                    all_columns.update(log.keys())
                
                writer = csv.DictWriter(output, fieldnames=sorted(list(all_columns)))
                writer.writeheader()
                writer.writerows(filtered_logs)
            else:
                # Write an empty CSV with headers
                writer = csv.writer(output)
                writer.writerow(['timestamp', 'username', 'action', 'details', 'ip_address'])
            
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename=audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                }
            )
            
        elif format_type == 'pdf':
            # Create a PDF report
            output = io.BytesIO()
            doc = SimpleDocTemplate(output, pagesize=landscape(letter))
            
            elements = []
            styles = getSampleStyleSheet()
            
            # Add title
            elements.append(Paragraph("Audit Logs Report", styles['Heading1']))
            elements.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            
            # Add filters information if any
            filter_info = []
            if start_date:
                filter_info.append(f"Start date: {start_date}")
            if end_date:
                filter_info.append(f"End date: {end_date}")
            if username:
                filter_info.append(f"Username: {username}")
            if action_type:
                filter_info.append(f"Action: {action_type}")
                
            if filter_info:
                elements.append(Paragraph("Filters: " + ", ".join(filter_info), styles['Normal']))
            
            elements.append(Spacer(1, 12))
            
            # Define columns to include in PDF
            columns = ['timestamp', 'username', 'action', 'details', 'ip_address']
            header = ['Timestamp', 'Username', 'Action', 'Details', 'IP Address']
            
            # Create data for table
            data = [header]  # Header row
            
            for log in filtered_logs:
                row = [
                    log.get('timestamp', ''),
                    log.get('username', ''),
                    log.get('action', ''),
                    log.get('details', ''),
                    log.get('ip_address', '')
                ]
                data.append(row)
            
            # If no logs, add an empty row
            if len(data) == 1:
                data.append(['No logs found'] + [''] * 4)
            
            # Create table
            table = Table(data)
            
            # Add style
            style = TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ])
            table.setStyle(style)
            
            elements.append(table)
            
            # Build PDF
            doc.build(elements)
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            )
        
        else:
            return jsonify({'error': 'Unsupported export format'}), 400
            
    except Exception as e:
        print(f"Error exporting audit logs: {str(e)}")
        return jsonify({'error': str(e)}), 500