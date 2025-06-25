# backend/routes/form.py
from datetime import datetime
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required # type: ignore
from ..models import ItemNumber, ReceivingData
from ..utils.html_to_pdf_handler import HTMLToPDFHandler
import os

bp = Blueprint('form', __name__, url_prefix='/api/form')

@bp.route('/generate-pdf/520B', methods=['POST'])
@jwt_required()
def generate_520b():
    try:
        print("Receiving request for 520B PDF generation")
        data = request.get_json()
        
        pdf_handler = HTMLToPDFHandler()
        output_path = pdf_handler.generate_520b_pdf(data)

        from ..utils.audit_logger import log_activity
        log_activity(
            action="Generate Form",
            details=f"Generated 520B form for item {data.get('Item No', 'unknown')}"
        )
        
        if output_path and output_path.exists():
            return send_file(
                str(output_path),
                as_attachment=True,
                download_name=f"520B_{data.get('RN', 'unknown')}.pdf",
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'error': 'Failed to generate PDF file'
            }), 500
            
    except Exception as e:
        print(f"Error in route: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/generate-pdf/501A', methods=['POST'])
@jwt_required()
def generate_501a():
    try:
        print("Receiving request for 501A PDF generation")
        data = request.get_json()
        
        pdf_handler = HTMLToPDFHandler()
        output_path = pdf_handler.generate_501a_pdf(data)

        # Log this activity
        from ..utils.audit_logger import log_activity
        log_activity(
            action="Generate Form",
            details=f"Generated 501A form for receiving {data.get('receiving_no', 'unknown')}"
        )
        
        if output_path and output_path.exists():
            return send_file(
                str(output_path),
                as_attachment=True,
                download_name=f"501A_{data.get('Receiving No', 'unknown')}.pdf",
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'error': 'Failed to generate PDF file'
            }), 500
            
    except Exception as e:
        print(f"Error in route: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

@bp.route('/generate-pdf/519A', methods=['POST'])
@jwt_required()
def generate_519a():
    try:
        print("Receiving request for 519A PDF generation")
        data = request.get_json()
        print("Received data:", data)  # Debug print
        
        pdf_handler = HTMLToPDFHandler()
        output_path = pdf_handler.generate_519a_pdf(data)

        # Log this activity
        from ..utils.audit_logger import log_activity
        log_activity(
            action="Generate Form",
            details=f"Generated 519A form for receiving {data.get('receiving_no', 'unknown')}"
        )
        
        if output_path and output_path.exists():
            return send_file(
                str(output_path),
                as_attachment=True,
                download_name=f"519A_{data.get('Receiving No', 'unknown')}.pdf",
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'error': 'Failed to generate PDF file'
            }), 500
            
    except Exception as e:
        print(f"Error in route: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500
    
# Add this SIMPLE diagnostic endpoint to your backend/routes/form.py

@bp.route('/diagnose-pdf', methods=['GET'])
def diagnose_pdf_service():
    """Simple diagnostic endpoint that won't crash"""
    import os
    import sys
    from pathlib import Path
    
    try:
        diagnostics = {
            'status': 'running',
            'python_version': sys.version,
            'environment': {},
            'paths': {},
            'basic_checks': {}
        }
        
        # Safe environment checks
        try:
            diagnostics['environment'] = {
                'RENDER': os.environ.get('RENDER', 'Not set'),
                'FLASK_ENV': os.environ.get('FLASK_ENV', 'Not set'),
                'PWD': os.environ.get('PWD', 'Not set')
            }
        except Exception as e:
            diagnostics['environment'] = {'error': str(e)}
        
        # Safe path checks
        try:
            current_file = Path(__file__)
            backend_dir = current_file.parent.parent
            diagnostics['paths'] = {
                'current_file': str(current_file),
                'backend_dir': str(backend_dir),
                'backend_exists': backend_dir.exists(),
                'cwd': os.getcwd()
            }
            
            # Check templates
            templates_dir = backend_dir / 'templates'
            if templates_dir.exists():
                diagnostics['paths']['templates_dir'] = str(templates_dir)
                diagnostics['paths']['template_files'] = [f.name for f in templates_dir.glob('*.html')]
            else:
                diagnostics['paths']['templates_dir'] = 'Not found'
                
        except Exception as e:
            diagnostics['paths'] = {'error': str(e)}
        
        # Basic dependency checks
        try:
            dependencies = ['flask', 'pdfkit', 'reportlab']
            diagnostics['basic_checks'] = {}
            
            for dep in dependencies:
                try:
                    __import__(dep)
                    diagnostics['basic_checks'][dep] = 'Available'
                except ImportError:
                    diagnostics['basic_checks'][dep] = 'Missing'
                    
        except Exception as e:
            diagnostics['basic_checks'] = {'error': str(e)}
        
        # wkhtmltopdf check (safe)
        try:
            import subprocess
            result = subprocess.run(['which', 'wkhtmltopdf'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                diagnostics['wkhtmltopdf'] = {
                    'available': True,
                    'path': result.stdout.strip()
                }
            else:
                diagnostics['wkhtmltopdf'] = {
                    'available': False,
                    'error': 'Not found in PATH'
                }
        except Exception as e:
            diagnostics['wkhtmltopdf'] = {
                'available': False,
                'error': str(e)
            }
        
        return jsonify(diagnostics), 200
        
    except Exception as e:
        # Even if everything fails, return something useful
        return jsonify({
            'status': 'error',
            'error': str(e),
            'type': type(e).__name__
        }), 500
    
@bp.route('/test', methods=['GET'])
def test_endpoint():
    """Super simple test endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Form routes are working',
        'timestamp': datetime.now().isoformat()
    }), 200