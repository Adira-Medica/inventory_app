# backend/routes/form.py
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
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