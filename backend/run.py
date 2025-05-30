# backend/run.py
import os
from backend import create_app

# Create app with environment-based config
app = create_app()

if __name__ == "__main__":
    # Get port from environment variable or default to 5000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting server on port {port}")
    app.run(debug=debug, port=port, host='0.0.0.0')