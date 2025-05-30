#!/usr/bin/env python3
"""
Database setup script for CI/CD environments
"""
import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set environment variables
os.environ['FLASK_ENV'] = 'testing'
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'postgresql://localhost:5432/test_inventory_db')

def setup_database():
    """Set up database with proper Flask application context"""
    try:
        # Import after setting up paths and environment
        from backend import create_app
        from extensions import db
        from models import User, Role, ItemNumber, ReceivingData
        
        # Create Flask app with testing config
        app = create_app()
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['DATABASE_URL']
        
        # Create database tables within application context
        with app.app_context():
            db.create_all()
            print('✅ Database tables created successfully')
            
            # Optionally create initial data
            create_initial_data()
            
    except Exception as e:
        print(f'❌ Error creating database: {e}')
        raise

def create_initial_data():
    """Create initial roles and admin user for testing"""
    from extensions import db
    from models import User, Role
    import json
    
    try:
        # Check if roles already exist
        if Role.query.count() == 0:
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
            
            for role in roles:
                db.session.add(role)
            
            db.session.commit()
            print('✅ Initial roles created')
            
            # Create test admin user
            admin_role = Role.query.filter_by(name='admin').first()
            if admin_role and not User.query.filter_by(username='admin').first():
                admin_user = User(
                    username='admin',
                    role_id=admin_role.id,
                    active=True,
                    status='approved'
                )
                admin_user.set_password('admin123')
                db.session.add(admin_user)
                db.session.commit()
                print('✅ Test admin user created')
                
    except Exception as e:
        print(f'⚠️ Warning: Could not create initial data: {e}')
        db.session.rollback()

if __name__ == '__main__':
    setup_database()