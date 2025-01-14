# backend/routes/receiving.py
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity, jwt_required
from ..models import ReceivingData, ItemNumber
from ..extensions import db

bp = Blueprint('receiving', __name__, url_prefix='/api/receiving')

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_receiving():
    data = request.get_json()
    new_receiving = ReceivingData(**data)
    
    db.session.add(new_receiving)
    db.session.commit()
    
    return jsonify({'message': 'Receiving data created successfully'}), 201

@bp.route('/get', methods=['GET'])
@jwt_required()
def get_receiving():
    try:
        print("Fetching receiving data...")
        receiving_data = ReceivingData.query.all()
        print(f"Found {len(receiving_data)} receiving records")
        
        return jsonify([{
            'id': rd.id,
            'item_number': rd.item_number,
            'receiving_no': rd.receiving_no,
            'tracking_number': rd.tracking_number,
            'lot_no': rd.lot_no,
            'po_no': rd.po_no,
            'total_units_vendor': rd.total_units_vendor,
            'total_storage_containers': rd.total_storage_containers,
            'exp_date': rd.exp_date,
            'ncmr': rd.ncmr,
            'total_units_received': rd.total_units_received,
            'temp_device_in_alarm': rd.temp_device_in_alarm,
            'ncmr2': rd.ncmr2,
            'temp_device_deactivated': rd.temp_device_deactivated,
            'temp_device_returned_to_courier': rd.temp_device_returned_to_courier,
            'comments_for_520b': rd.comments_for_520b
        } for rd in receiving_data]), 200
            
    except Exception as e:
        print(f"Error in get_receiving: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/numbers', methods=['GET'])
def get_receiving_numbers():
    receiving_data = ReceivingData.query.all()
    return jsonify([{
        'receiving_no': data.receiving_no
    } for data in receiving_data])

@bp.route('/update/<int:id>', methods=['PUT'])
@jwt_required()
def update_receiving(id):
    try:
        receiving = ReceivingData.query.get_or_404(id)
        data = request.get_json()

        print(f"Updating receiving {id} with data:", data)
        
        for key, value in data.items():
            if hasattr(receiving, key) and key not in ['id', 'created_at', 'created_by']:
                print(f"Setting {key} to {value}")  # Debug log
                setattr(receiving, key, value)
        
        receiving.updated_at = datetime.utcnow()
        current_user = get_jwt_identity()
        receiving.updated_by = current_user['id']
        
        db.session.commit()
        return jsonify({'message': 'Receiving data updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        import traceback
        error_traceback = traceback.format_exc()
        print("Error updating receiving:", error_traceback)  # Debug log
        return jsonify({'error': str(e)}), 500