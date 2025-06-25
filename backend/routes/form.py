# backend/routes/form.py - Complete file with all endpoints
from flask import Blueprint, request, jsonify, send_file, render_template
from flask_jwt_extended import jwt_required # type: ignore
from ..models import ItemNumber, ReceivingData
from ..utils.html_to_pdf_handler import HTMLToPDFHandler
from datetime import datetime
import os
import traceback
import platform
import subprocess
from pathlib import Path

bp = Blueprint('form', __name__, url_prefix='/api/form')

def handle_pdf_generation_error(error, form_type):
    """Centralized error handling for PDF generation"""
    error_msg = str(error)
    
    if "wkhtmltopdf" in error_msg.lower():
        return jsonify({
            'error': 'PDF generation service unavailable',
            'details': 'wkhtmltopdf is not properly configured on the server',
            'solution': 'Please contact system administrator'
        }), 500
    elif "template" in error_msg.lower():
        return jsonify({
            'error': 'Template error',
            'details': f'Failed to render {form_type} template',
            'solution': 'Template file may be missing or corrupted'
        }), 500
    elif "permission" in error_msg.lower() or "access" in error_msg.lower():
        return jsonify({
            'error': 'File system error',
            'details': 'Unable to write PDF file',
            'solution': 'Server permissions issue - contact administrator'
        }), 500
    else:
        return jsonify({
            'error': f'Failed to generate {form_type} PDF',
            'details': error_msg,
            'solution': 'Please try again or contact support'
        }), 500

# =============================================================================
# DIAGNOSTIC AND TEST ENDPOINTS
# =============================================================================

@bp.route('/diagnose-pdf', methods=['GET'])
def diagnose_pdf_service():
    """Simple diagnostic endpoint that won't crash"""
    try:
        diagnostics = {
            'status': 'running',
            'python_version': platform.python_version(),
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

@bp.route('/test-pdf-generation', methods=['GET'])
def test_pdf_generation():
    """Simple GET endpoint to test PDF generation from browser"""
    try:
        print("🧪 Testing PDF generation...")
        
        # Test data for 501A
        test_data = {
            'receiving_no': 'TEST001',
            'item_no': 'ITEM001', 
            'item_description': 'Test Item Description',
            'client_name': 'Test Client',
            'vendor_name': 'Test Vendor',
            'lot_no': 'LOT001',
            'storage_conditions': 'Room Temperature',
            'total_units_received': '100',
            'controlled_substance': 'No',
            'locationStatus': {
                'quarantine': True,
                'rejected': False,
                'released': False
            },
            'dateType': 'Received Date',
            'dateValue': '12/25/2024',
            'completedBy': 'Test User',
            'transactions': [
                {
                    'date': '12/25/2024',
                    'reason': 'Initial Receipt',
                    'transactionType': 'Receipt',
                    'quantity': '100',
                    'balance': '100',
                    'balanceLocation': 'Warehouse A',
                    'enteredBy': 'Test User'
                }
            ],
            'comments': 'This is a test PDF generation'
        }
        
        # Try to generate PDF
        pdf_handler = HTMLToPDFHandler()
        output_path = pdf_handler.generate_501a_pdf(test_data)
        
        if output_path and output_path.exists():
            return send_file(
                str(output_path),
                as_attachment=True,
                download_name="test_501A.pdf",
                mimetype='application/pdf'
            )
        else:
            return jsonify({
                'error': 'PDF file not created',
                'details': 'File does not exist after generation'
            }), 500
            
    except Exception as e:
        print(f"❌ Error in test PDF generation: {str(e)}")
        print(f"📍 Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'error': 'PDF generation failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

# =============================================================================
# TEMPLATE TEST ENDPOINTS
# =============================================================================

@bp.route('/test-template/501A', methods=['GET'])
def test_501a_template():
    """Test if 501A template renders correctly"""
    try:
        template_data = {
            'receiving_no': 'TEST001',
            'item_no': 'ITEM001',
            'item_description': 'Test Item Description',
            'client_name': 'Test Client',
            'vendor_name': 'Test Vendor',
            'lot_no': 'LOT001',
            'storage_conditions': 'Room Temperature',
            'total_units_received': '100',
            'controlled_substance': 'No',
            'locationStatus': {
                'quarantine': 'checked',
                'rejected': '',
                'released': ''
            },
            'dateType': 'Received Date',
            'dateValue': '12/25/2024',
            'completedBy': 'Test User',
            'transactions': [
                {
                    'date': '12/25/2024',
                    'reason': 'Initial Receipt',
                    'transactionType': 'Receipt',
                    'quantity': '100',
                    'balance': '100',
                    'balanceLocation': 'Warehouse A',
                    'enteredBy': 'Test User'
                }
            ],
            'comments': 'Test comments'
        }
        
        rendered_html = render_template('501A.html', **template_data)
        return rendered_html, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return jsonify({
            'error': 'Template rendering failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/test-template/520B', methods=['GET'])
def test_520b_template():
    """Test if 520B template renders correctly"""
    try:
        template_data = {
            'item_no': 'TEST001',
            'tracking_no': 'TRACK001',
            'client_name': 'Test Client',
            'item_description': 'Test Item Description',
            'receiving_no': 'RN001',
            'lot_no': 'LOT001',
            'vendor': 'Test Vendor',
            'deliveryAcceptance': [
                {'name': 'Item numbers match shipping documentation', 'checked': 'checked'},
                {'name': 'Lot numbers match shipping documentation', 'checked': ''},
            ],
            'documentVerification': [
                {'name': 'COA #', 'checked': 'checked'},
                {'name': 'SDS #', 'checked': ''},
            ],
            'issuesSection': [
                {'name': 'Quantity discrepancies found', 'checked': ''},
                {'name': 'Damage to shipping container(s)', 'checked': ''},
            ],
            'ncmr': 'No',
            'comments': 'Test comments',
            'dateType': 'Received Date',
            'dateValue': '12/25/2024',
            'receivingCompletedBy': 'Test User'
        }
        
        rendered_html = render_template('520B.html', **template_data)
        return rendered_html, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return jsonify({
            'error': 'Template rendering failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/test-template/519A', methods=['GET'])
def test_519a_template():
    """Test if 519A template renders correctly"""
    try:
        template_data = {
            'receiving_no': 'TEST001',
            'item_no': 'ITEM001',
            'item_description': 'Test Item Description',
            'lot_no': 'LOT001',
            'storage_conditions': 'Frozen (-20°C)',
            'date_time_received': '12/25/2024 10:00 AM',
            'container_no': 'CONT001',
            'total_units_per_container': '50',
            'record_created_by': 'Test User',
            'drug_movements': [
                {
                    'destination': 'Freezer A',
                    'date': '12/25/2024',
                    'time': '10:30 AM',
                    'exposure_time': '5 min',
                    'cumulative_et': '5 min',
                    'completed_by': 'Test User',
                    'verified_by': 'Supervisor'
                }
            ]
        }
        
        rendered_html = render_template('519A.html', **template_data)
        return rendered_html, 200, {'Content-Type': 'text/html'}
        
    except Exception as e:
        return jsonify({
            'error': 'Template rendering failed',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

# =============================================================================
# MAIN PDF GENERATION ENDPOINTS
# =============================================================================

@bp.route('/generate-pdf/501A', methods=['POST'])
@jwt_required()
def generate_501a():
    try:
        print("🔄 Receiving request for 501A PDF generation")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty or invalid JSON'
            }), 400
        
        print("📝 Request data:", data)
        
        # Validate required fields
        required_fields = ['receiving_no', 'item_no']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'details': f'Required fields missing: {", ".join(missing_fields)}'
            }), 400
        
        try:
            pdf_handler = HTMLToPDFHandler()
        except Exception as handler_error:
            print(f"❌ Failed to initialize PDF handler: {str(handler_error)}")
            return jsonify({
                'error': 'PDF service initialization failed',
                'details': str(handler_error)
            }), 500
        
        try:
            output_path = pdf_handler.generate_501a_pdf(data)
            print(f"✅ PDF generated successfully: {output_path}")
        except Exception as generation_error:
            print(f"❌ PDF generation failed: {str(generation_error)}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return handle_pdf_generation_error(generation_error, "501A")
        
        try:
            from ..utils.audit_logger import log_activity
            log_activity(
                action="Generate Form",
                details=f"Generated 501A form for receiving {data.get('receiving_no', 'unknown')}"
            )
        except Exception as log_error:
            print(f"⚠️ Logging failed: {str(log_error)}")
        
        if output_path and output_path.exists():
            try:
                return send_file(
                    str(output_path),
                    as_attachment=True,
                    download_name=f"501A_{data.get('receiving_no', 'unknown')}.pdf",
                    mimetype='application/pdf'
                )
            except Exception as send_error:
                print(f"❌ Failed to send file: {str(send_error)}")
                return jsonify({
                    'error': 'Failed to send PDF file',
                    'details': str(send_error)
                }), 500
        else:
            return jsonify({
                'error': 'PDF file not found after generation',
                'details': 'File was not created or was deleted'
            }), 500
            
    except Exception as e:
        print(f"❌ Unexpected error in 501A route: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@bp.route('/generate-pdf/520B', methods=['POST'])
@jwt_required()
def generate_520b():
    try:
        print("🔄 Receiving request for 520B PDF generation")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty or invalid JSON'
            }), 400
        
        print("📝 Request data:", data)
        
        # Validate required fields for 520B
        required_fields = ['Item No', 'RN']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'details': f'Required fields missing: {", ".join(missing_fields)}'
            }), 400
        
        try:
            pdf_handler = HTMLToPDFHandler()
        except Exception as handler_error:
            print(f"❌ Failed to initialize PDF handler: {str(handler_error)}")
            return jsonify({
                'error': 'PDF service initialization failed',
                'details': str(handler_error)
            }), 500
        
        try:
            output_path = pdf_handler.generate_520b_pdf(data)
            print(f"✅ PDF generated successfully: {output_path}")
        except Exception as generation_error:
            print(f"❌ PDF generation failed: {str(generation_error)}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return handle_pdf_generation_error(generation_error, "520B")
        
        try:
            from ..utils.audit_logger import log_activity
            log_activity(
                action="Generate Form",
                details=f"Generated 520B form for item {data.get('Item No', 'unknown')}"
            )
        except Exception as log_error:
            print(f"⚠️ Logging failed: {str(log_error)}")
        
        if output_path and output_path.exists():
            try:
                return send_file(
                    str(output_path),
                    as_attachment=True,
                    download_name=f"520B_{data.get('RN', 'unknown')}.pdf",
                    mimetype='application/pdf'
                )
            except Exception as send_error:
                print(f"❌ Failed to send file: {str(send_error)}")
                return jsonify({
                    'error': 'Failed to send PDF file',
                    'details': str(send_error)
                }), 500
        else:
            return jsonify({
                'error': 'PDF file not found after generation',
                'details': 'File was not created or was deleted'
            }), 500
            
    except Exception as e:
        print(f"❌ Unexpected error in 520B route: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

@bp.route('/generate-pdf/519A', methods=['POST'])
@jwt_required()
def generate_519a():
    try:
        print("🔄 Receiving request for 519A PDF generation")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty or invalid JSON'
            }), 400
        
        print("📝 Request data:", data)
        
        # Validate required fields for 519A
        required_fields = ['receiving_no', 'item_no']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'details': f'Required fields missing: {", ".join(missing_fields)}'
            }), 400
        
        try:
            pdf_handler = HTMLToPDFHandler()
        except Exception as handler_error:
            print(f"❌ Failed to initialize PDF handler: {str(handler_error)}")
            return jsonify({
                'error': 'PDF service initialization failed',
                'details': str(handler_error)
            }), 500
        
        try:
            output_path = pdf_handler.generate_519a_pdf(data)
            print(f"✅ PDF generated successfully: {output_path}")
        except Exception as generation_error:
            print(f"❌ PDF generation failed: {str(generation_error)}")
            print(f"❌ Traceback: {traceback.format_exc()}")
            return handle_pdf_generation_error(generation_error, "519A")
        
        try:
            from ..utils.audit_logger import log_activity
            log_activity(
                action="Generate Form",
                details=f"Generated 519A form for receiving {data.get('receiving_no', 'unknown')}"
            )
        except Exception as log_error:
            print(f"⚠️ Logging failed: {str(log_error)}")
        
        if output_path and output_path.exists():
            try:
                return send_file(
                    str(output_path),
                    as_attachment=True,
                    download_name=f"519A_{data.get('receiving_no', 'unknown')}.pdf",
                    mimetype='application/pdf'
                )
            except Exception as send_error:
                print(f"❌ Failed to send file: {str(send_error)}")
                return jsonify({
                    'error': 'Failed to send PDF file',
                    'details': str(send_error)
                }), 500
        else:
            return jsonify({
                'error': 'PDF file not found after generation',
                'details': 'File was not created or was deleted'
            }), 500
            
    except Exception as e:
        print(f"❌ Unexpected error in 519A route: {str(e)}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'details': str(e)
        }), 500

# =============================================================================
# DEBUG ENDPOINTS
# =============================================================================

@bp.route('/debug-pdf/501A', methods=['POST'])
def debug_501a_pdf():
    """Debug version of 501A PDF generation"""
    try:
        print("🔍 Debug: Starting 501A PDF generation...")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty'
            }), 400
        
        print(f"📦 Debug: Received data keys: {list(data.keys())}")
        
        # Test template rendering first
        try:
            print("🎨 Debug: Testing template rendering...")
            
            template_data = {
                'receiving_no': data.get('receiving_no', 'TEST'),
                'item_no': data.get('item_no', 'TEST'),
                'item_description': data.get('item_description', 'TEST'),
                'client_name': data.get('client_name', 'TEST'),
                'locationStatus': {'quarantine': '', 'rejected': '', 'released': ''},
                'transactions': [],
                'comments': 'Test'
            }
            
            rendered_html = render_template('501A.html', **template_data)
            print(f"✅ Debug: Template rendered successfully ({len(rendered_html)} chars)")
            
        except Exception as template_error:
            print(f"❌ Debug: Template rendering failed: {str(template_error)}")
            return jsonify({
                'error': 'Template rendering failed',
                'details': str(template_error),
                'stage': 'template_rendering'
            }), 500
        
        # Test PDF generation
        try:
            print("📄 Debug: Testing PDF generation...")
            
            import pdfkit # type: ignore
            test_html = "<html><body><h1>Test 501A PDF</h1></body></html>"
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            test_path = Path(__file__).parent.parent / 'generated' / f"test_501A_{timestamp}.pdf"
            test_path.parent.mkdir(exist_ok=True)
            
            print(f"🎯 Debug: Generating test PDF to: {test_path}")
            
            pdfkit.from_string(
                test_html,
                str(test_path),
                options={'page-size': 'A4'},
                configuration=pdfkit.configuration(wkhtmltopdf='/usr/bin/wkhtmltopdf')
            )
            
            if test_path.exists():
                file_size = test_path.stat().st_size
                test_path.unlink()
                
                return jsonify({
                    'status': 'success',
                    'message': '519A PDF generation is working',
                    'template_chars': len(rendered_html),
                    'test_pdf_size': file_size
                }), 200
            else:
                return jsonify({
                    'error': 'PDF file was not created',
                    'stage': 'pdf_generation'
                }), 500
                
        except Exception as pdf_error:
            print(f"❌ Debug: PDF generation failed: {str(pdf_error)}")
            return jsonify({
                'error': 'PDF generation failed',
                'details': str(pdf_error),
                'stage': 'pdf_generation',
                'traceback': traceback.format_exc()
            }), 500
        
    except Exception as e:
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================

@bp.route('/pdf-health', methods=['GET'])
def pdf_health_check():
    """Check if PDF generation service is working"""
    try:
        pdf_handler = HTMLToPDFHandler()
        
        # Test basic functionality
        test_data = {
            'receiving_no': 'HEALTH001',
            'item_no': 'HEALTH001',
            'item_description': 'Health check item',
            'client_name': 'Health check client'
        }
        
        status = {
            'pdf_service': 'available',
            'wkhtmltopdf_config': 'configured',
            'templates_dir': str(pdf_handler.template_dir),
            'generated_dir': str(pdf_handler.generated_dir),
            'generated_dir_writable': pdf_handler.generated_dir.exists() and os.access(pdf_handler.generated_dir, os.W_OK),
            'template_files': []
        }
        
        # List available templates
        if pdf_handler.template_dir.exists():
            status['template_files'] = [f.name for f in pdf_handler.template_dir.glob('*.html')]
        
        return jsonify(status), 200
        
    except Exception as e:
        return jsonify({
            'pdf_service': 'unavailable',
            'error': str(e),
            'status': 'unhealthy'
        }), 500

@bp.route('/debug-pdf/520B', methods=['POST'])
def debug_520b_pdf():
    """Debug version of 520B PDF generation"""
    try:
        print("🔍 Debug: Starting 520B PDF generation...")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty'
            }), 400
        
        print(f"📦 Debug: Received data keys: {list(data.keys())}")
        
        # Test template rendering first
        try:
            print("🎨 Debug: Testing template rendering...")
            
            template_data = {
                'item_no': data.get('Item No', 'TEST'),
                'tracking_no': data.get('Tracking No', 'TEST'),
                'client_name': data.get('Client Name', 'TEST'),
                'receiving_no': data.get('RN', 'TEST'),
                'deliveryAcceptance': [],
                'documentVerification': [],
                'issuesSection': [],
                'ncmr': 'No',
                'comments': 'Test'
            }
            
            rendered_html = render_template('520B.html', **template_data)
            print(f"✅ Debug: Template rendered successfully ({len(rendered_html)} chars)")
            
        except Exception as template_error:
            print(f"❌ Debug: Template rendering failed: {str(template_error)}")
            return jsonify({
                'error': 'Template rendering failed',
                'details': str(template_error),
                'stage': 'template_rendering'
            }), 500
        
        # Test PDF generation
        try:
            print("📄 Debug: Testing PDF generation...")
            
            import pdfkit # type: ignore
            test_html = "<html><body><h1>Test 520B PDF</h1></body></html>"
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            test_path = Path(__file__).parent.parent / 'generated' / f"test_520B_{timestamp}.pdf"
            test_path.parent.mkdir(exist_ok=True)
            
            pdfkit.from_string(
                test_html,
                str(test_path),
                options={'page-size': 'A4'},
                configuration=pdfkit.configuration(wkhtmltopdf='/usr/bin/wkhtmltopdf')
            )
            
            if test_path.exists():
                file_size = test_path.stat().st_size
                test_path.unlink()
                
                return jsonify({
                    'status': 'success',
                    'message': '520B PDF generation is working',
                    'template_chars': len(rendered_html),
                    'test_pdf_size': file_size
                }), 200
            else:
                return jsonify({
                    'error': 'PDF file was not created',
                    'stage': 'pdf_generation'
                }), 500
                
        except Exception as pdf_error:
            print(f"❌ Debug: PDF generation failed: {str(pdf_error)}")
            return jsonify({
                'error': 'PDF generation failed',
                'details': str(pdf_error),
                'stage': 'pdf_generation',
                'traceback': traceback.format_exc()
            }), 500
        
    except Exception as e:
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500

@bp.route('/debug-pdf/519A', methods=['POST'])
def debug_519a_pdf():
    """Debug version of 519A PDF generation"""
    try:
        print("🔍 Debug: Starting 519A PDF generation...")
        
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No data provided',
                'details': 'Request body is empty'
            }), 400
        
        print(f"📦 Debug: Received data keys: {list(data.keys())}")
        
        # Test template rendering first
        try:
            print("🎨 Debug: Testing template rendering...")
            
            template_data = {
                'receiving_no': data.get('receiving_no', 'TEST'),
                'item_no': data.get('item_no', 'TEST'),
                'item_description': data.get('item_description', 'TEST'),
                'lot_no': data.get('lot_no', 'TEST'),
                'drug_movements': []
            }
            
            rendered_html = render_template('519A.html', **template_data)
            print(f"✅ Debug: Template rendered successfully ({len(rendered_html)} chars)")
            
        except Exception as template_error:
            print(f"❌ Debug: Template rendering failed: {str(template_error)}")
            return jsonify({
                'error': 'Template rendering failed',
                'details': str(template_error),
                'stage': 'template_rendering'
            }), 500
        
        # Test PDF generation
        try:
            print("📄 Debug: Testing PDF generation...")
            
            import pdfkit # type: ignore
            test_html = "<html><body><h1>Test 519A PDF</h1></body></html>"
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            test_path = Path(__file__).parent.parent / 'generated' / f"test_519A_{timestamp}.pdf"
            test_path.parent.mkdir(exist_ok=True)
            
            pdfkit.from_string(
                test_html,
                str(test_path),
                options={'page-size': 'A4'},
                configuration=pdfkit.configuration(wkhtmltopdf='/usr/bin/wkhtmltopdf')
            )
            
            if test_path.exists():
                file_size = test_path.stat().st_size
                test_path.unlink()
                
                return jsonify({
                    'status': 'success',
                    'message': '519A PDF generation is working',
                    'template_chars': len(rendered_html),
                    'test_pdf_size': file_size
                }), 200
            else:
                return jsonify({
                    'error': 'PDF file was not created',
                    'stage': 'pdf_generation'
                }), 500
                
        except Exception as pdf_error:
            print(f"❌ Debug: PDF generation failed: {str(pdf_error)}")
            return jsonify({
                'error': 'PDF generation failed',
                'details': str(pdf_error),
                'stage': 'pdf_generation',
                'traceback': traceback.format_exc()
            }), 500
        
    except Exception as e:
        return jsonify({
            'error': 'Unexpected error',
            'details': str(e),
            'traceback': traceback.format_exc()
        }), 500