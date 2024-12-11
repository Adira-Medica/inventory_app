# backend/routes/form.py
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from ..models import ItemNumber, ReceivingData
from ..utils.form_handler import PDFFormHandler
from ..utils.pdf_handler import PDFHandler
import os

bp = Blueprint('form', __name__, url_prefix='/api/form')

@bp.route('/generate-pdf/<form_type>', methods=['POST'])
@jwt_required()
def generate_pdf(form_type):
    data = request.get_json()
    
    # Get associated data from database
    item = ItemNumber.query.filter_by(item_number=data['ItemNo']).first()
    if not item:
        return jsonify({'error': 'Item not found'}), 404
        
    receiving = ReceivingData.query.filter_by(receiving_no=data['ReceivingNo']).first()
    if not receiving:
        return jsonify({'error': 'Receiving data not found'}), 404
    
    # Combine data
    form_data = {
        # Item data
        'item_number': item.item_number,
        'description': item.description,
        'client': item.client,
        'protocol_number': item.protocol_number,
        'vendor': item.vendor,
        'uom': item.uom,
        'controlled': item.controlled,
        'temp_storage_conditions': item.temp_storage_conditions,
        'other_storage_conditions': item.other_storage_conditions,
        
        # Receiving data
        'receiving_no': receiving.receiving_no,
        'tracking_number': receiving.tracking_number,
        'lot_no': receiving.lot_no,
        'po_no': receiving.po_no,
        'total_units_vendor': receiving.total_units_vendor,
        'total_storage_containers': receiving.total_storage_containers,
        'exp_date': receiving.exp_date,
        'ncmr': receiving.ncmr,
        'temp_device_in_alarm': receiving.temp_device_in_alarm,
        
        # Form specific data
        **data
    }
    
    try:
        pdf_handler = PDFFormHandler()
        output_path = pdf_handler.generate_pdf(form_type, form_data)
        return send_file(
            output_path,
            as_attachment=True,
            download_name=f"{form_type}_{data['ReceivingNo']}.pdf"
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    # backend/routes/form.py
@bp.route('/generate-pdf/520B', methods=['POST'])
def generate_520b():
    try:
        # Log received data
        print("Received data in route:", request.json)
        
        data = request.json
        
        # Initialize PDF handler
        pdf_handler = PDFHandler()
        
        try:
            # Generate PDF
            output_path = pdf_handler.generate_520b_pdf(data)
            print(f"PDF generated successfully at: {output_path}")
            
            # Verify file exists
            if not os.path.exists(output_path):
                raise FileNotFoundError(f"Generated PDF not found at {output_path}")
            
            return send_file(
                output_path,
                as_attachment=True,
                download_name=f"520B_{data.get('RN', 'unknown')}.pdf",
                mimetype='application/pdf'
            )
        except Exception as e:
            print(f"Error in PDF generation: {str(e)}")
            print("Traceback:")
            import traceback
            traceback.print_exc()
            raise
            
    except Exception as e:
        print(f"Error in route: {str(e)}")
        return jsonify({'error': str(e)}), 500