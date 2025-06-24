# backend/run.py - Fixed for Render deployment
import os
import sys

# Add current directory to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Import create_app from current directory (not 'backend' module)
try:
    # When running from backend directory on Render
    from __init__ import create_app
except ImportError:
    try:
        # Alternative import method
        from . import create_app
    except ImportError:
        # Fallback for local development
        from backend import create_app

# Determine environment and configuration
flask_env = os.environ.get('FLASK_ENV', 'development')

if flask_env == 'production':
    # Import Azure config for production
    try:
        from config_azure import AzureConfig  # Remove 'backend.' prefix
        app = create_app('production')  # Pass config name to your existing system
        print("🚀 Using Azure production configuration")
    except ImportError:
        print("⚠️ Azure config not found, falling back to default")
        app = create_app()
else:
    # Use your existing development configuration
    app = create_app()

if __name__ == "__main__":
    # Get port from environment variable or default to 10000 (Render uses 10000)
    port = int(os.environ.get('PORT', 10000))
    debug = flask_env == 'development'
    
    print(f"Starting server on port {port}")
    print(f"Environment: {flask_env}")
    app.run(debug=debug, port=port, host='0.0.0.0')