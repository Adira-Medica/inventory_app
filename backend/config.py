import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = 'dev-key-123'
    JWT_SECRET_KEY = 'jwt-key-123'
    JWT_ACCESS_TOKEN_EXPIRES = False  # For development
    CORS_HEADERS = 'Content-Type'
    
    # PDF settings
    PDF_UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    PDF_OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated')