# backend/routes/form.py
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
    
# Add this to your backend/routes/form.py

@bp.route('/diagnose-pdf', methods=['GET'])
@jwt_required()
def diagnose_pdf_service():
    """Diagnostic endpoint to check PDF generation capabilities"""
    import os
    import platform
    import subprocess
    from pathlib import Path
    
    diagnostics = {
        'system_info': {
            'platform': platform.system(),
            'platform_release': platform.release(),
            'architecture': platform.architecture(),
            'python_version': platform.python_version()
        },
        'environment': {
            'render_env': os.environ.get('RENDER', 'Not set'),
            'flask_env': os.environ.get('FLASK_ENV', 'Not set'),
            'pythonpath': os.environ.get('PYTHONPATH', 'Not set')
        },
        'file_system': {},
        'wkhtmltopdf': {},
        'dependencies': {}
    }
    
    # Check file system
    backend_dir = Path(__file__).parent.parent
    templates_dir = backend_dir / 'templates'
    generated_dir = backend_dir / 'generated'
    
    diagnostics['file_system'] = {
        'backend_dir_exists': backend_dir.exists(),
        'templates_dir_exists': templates_dir.exists(),
        'generated_dir_exists': generated_dir.exists(),
        'templates_dir_writable': templates_dir.exists() and os.access(templates_dir, os.W_OK),
        'generated_dir_writable': generated_dir.exists() and os.access(generated_dir, os.W_OK),
        'templates_dir_path': str(templates_dir),
        'generated_dir_path': str(generated_dir)
    }
    
    # List template files
    if templates_dir.exists():
        diagnostics['file_system']['template_files'] = [f.name for f in templates_dir.glob('*.html')]
    
    # Check wkhtmltopdf
    try:
        # Check if wkhtmltopdf is in PATH
        result = subprocess.run(['which', 'wkhtmltopdf'], 
                              capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            wkhtmltopdf_path = result.stdout.strip()
            diagnostics['wkhtmltopdf']['path'] = wkhtmltopdf_path
            
            # Get version
            version_result = subprocess.run([wkhtmltopdf_path, '--version'], 
                                          capture_output=True, text=True, timeout=10)
            diagnostics['wkhtmltopdf']['version'] = version_result.stdout.strip()
            diagnostics['wkhtmltopdf']['available'] = True
        else:
            diagnostics['wkhtmltopdf']['available'] = False
            diagnostics['wkhtmltopdf']['error'] = 'wkhtmltopdf not found in PATH'
    except Exception as e:
        diagnostics['wkhtmltopdf']['available'] = False
        diagnostics['wkhtmltopdf']['error'] = str(e)
    
    # Check Python dependencies
    dependencies_to_check = ['pdfkit', 'reportlab', 'jinja2', 'flask']
    for dep in dependencies_to_check:
        try:
            __import__(dep)
            diagnostics['dependencies'][dep] = 'Available'
        except ImportError:
            diagnostics['dependencies'][dep] = 'Missing'
    
    # Test pdfkit configuration
    try:
        import pdfkit # type: ignore
        
        # Test different configuration approaches
        configs_to_test = [
            ('default', lambda: pdfkit.configuration()),
            ('auto_detect', lambda: pdfkit.configuration(wkhtmltopdf=None)),
        ]
        
        # Add common paths to test
        common_paths = [
            '/usr/bin/wkhtmltopdf',
            '/usr/local/bin/wkhtmltopdf', 
            '/opt/bin/wkhtmltopdf',
            'wkhtmltopdf'  # Let system find it
        ]
        
        for path in common_paths:
            if os.path.exists(path) or path == 'wkhtmltopdf':
                configs_to_test.append((f'path_{path}', lambda p=path: pdfkit.configuration(wkhtmltopdf=p)))
        
        diagnostics['pdfkit_configs'] = {}
        for name, config_func in configs_to_test:
            try:
                config = config_func()
                diagnostics['pdfkit_configs'][name] = {
                    'success': True,
                    'path': getattr(config, 'wkhtmltopdf', 'Unknown')
                }
            except Exception as e:
                diagnostics['pdfkit_configs'][name] = {
                    'success': False,
                    'error': str(e)
                }
                
    except ImportError:
        diagnostics['pdfkit_configs'] = {'error': 'pdfkit not available'}
    
    return jsonify(diagnostics), 200