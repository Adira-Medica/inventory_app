#!/bin/bash
# render_build.sh - Build script for Render.com

set -e  # Exit on any error

echo "🚀 Starting Render build process..."

# Update package lists
apt-get update

# Install wkhtmltopdf and dependencies
echo "📦 Installing wkhtmltopdf..."
apt-get install -y \
    wkhtmltopdf \
    xvfb \
    libfontconfig1 \
    libxrender1 \
    libxtst6 \
    libjpeg62-turbo \
    libpng16-16 \
    fonts-dejavu-core \
    fontconfig

# Verify wkhtmltopdf installation
echo "🔍 Verifying wkhtmltopdf..."
wkhtmltopdf --version

# Test basic PDF generation
echo "🧪 Testing PDF generation..."
echo '<html><body><h1>Render Test PDF</h1><p>Generated at build time</p></body></html>' > test_build.html
wkhtmltopdf test_build.html test_build.pdf
ls -la test_build.pdf
rm test_build.html test_build.pdf
echo "✅ PDF generation test passed"

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
pip install --no-cache-dir -r requirements.txt

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p backend/generated
mkdir -p backend/templates
chmod 755 backend/generated
chmod 755 backend/templates

# Set environment variables for build
export RENDER=true
export FLASK_ENV=production

echo "✅ Build completed successfully!"

# For Render.com, use this as your build command:
# bash render_build.sh