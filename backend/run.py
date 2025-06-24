# backend/run.py - Updated for production deployment
import sys
import os

# Add the parent directory to the Python path to resolve imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Now import the app factory
from backend import create_app

def create_application():
    """Application factory with proper error handling"""
    try:
        # Get environment from environment variable or default to development
        config_name = os.getenv('FLASK_ENV', 'development')
        app = create_app(config_name)
        print("✅ Flask application created successfully!")
        return app
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Checking Python path and module structure...")
        print(f"Current directory: {current_dir}")
        print(f"Python path: {sys.path[:3]}...")  # Show first 3 entries
        raise
    except Exception as e:
        print(f"❌ Unexpected error creating app: {e}")
        raise

app = create_application()

if __name__ == "__main__":
    # Check if we're running in production or development
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    print(f"Starting Flask app on {host}:{port} (debug={debug})")
    app.run(host=host, port=port, debug=debug)