import pytest
import os
from backend import create_app
from extensions import db
from models import User, Role

@pytest.fixture
def app():
    """Create application for testing"""
    os.environ['FLASK_ENV'] = 'testing'
    app = create_app('testing')
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Test client"""
    return app.test_client()

@pytest.fixture
def auth_headers(client):
    """Get authentication headers for testing"""
    # Create test roles and user
    with client.application.app_context():
        admin_role = Role(name='admin', permissions='{"all": true}')
        db.session.add(admin_role)
        db.session.commit()
        
        user = User(username='testuser', role_id=admin_role.id, active=True, status='approved')
        user.set_password('testpass')
        db.session.add(user)
        db.session.commit()
    
    # Login and get token
    response = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'testpass'
    })
    token = response.json['token']
    
    return {'Authorization': f'Bearer {token}'}