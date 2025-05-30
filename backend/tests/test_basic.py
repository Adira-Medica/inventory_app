def test_app_creation(app):
    """Test that the app is created successfully"""
    assert app is not None
    assert app.config['TESTING'] is True

def test_database_connection(app):
    """Test database connection"""
    with app.app_context():
        from extensions import db
        from models import Role
        
        # Test that we can query the database
        roles = Role.query.all()
        assert isinstance(roles, list)

def test_auth_endpoints(client):
    """Test basic auth endpoints"""
    # Test that endpoints exist
    response = client.post('/api/auth/login')
    assert response.status_code in [400, 401, 422]  # Bad request, not 404
    
    response = client.post('/api/auth/register')
    assert response.status_code in [400, 401, 422]  # Bad request, not 404