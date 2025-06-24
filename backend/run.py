# backend/run.py
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
        app = create_app()
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
    app.run(debug=True, host='127.0.0.1', port=5000)