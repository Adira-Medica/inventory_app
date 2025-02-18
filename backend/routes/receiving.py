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
        receiving_data = ReceivingData.query.order_by(ReceivingData.display_order).all()
        
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
            'comments_for_520b': rd.comments_for_520b,
            'is_obsolete': rd.is_obsolete,
            'display_order': rd.display_order
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
        
        # Preserve display_order
        current_display_order = receiving.display_order
        
        for key, value in data.items():
            if hasattr(receiving, key) and key != 'display_order':
                setattr(receiving, key, value)
        
        # Keep the original display_order
        receiving.display_order = current_display_order
        
        db.session.commit()
        return jsonify({'message': 'Receiving data updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@bp.route('/get/<receiving_no>', methods=['GET'])
@jwt_required()
def get_receiving_detail(receiving_no):
    try:
        receiving = ReceivingData.query.filter_by(receiving_no=receiving_no).first()
        if not receiving:
            return jsonify({'error': 'Receiving data not found'}), 404
            
        return jsonify({
            'id': receiving.id,
            'receiving_no': receiving.receiving_no,
            'tracking_number': receiving.tracking_number,
            'lot_no': receiving.lot_no,
            'po_no': receiving.po_no,
            'total_units_vendor': receiving.total_units_vendor,
            'total_storage_containers': receiving.total_storage_containers,
            'exp_date': receiving.exp_date,
            'ncmr': receiving.ncmr,
            'total_units_received': receiving.total_units_received
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@bp.route('/toggle-obsolete/<int:id>', methods=['PUT'])
@jwt_required()
def toggle_receiving_obsolete(id):
    try:
        receiving = ReceivingData.query.get_or_404(id)
        receiving.is_obsolete = not receiving.is_obsolete
        db.session.commit()
        return jsonify({
            'message': 'Receiving data obsolete status updated',
            'is_obsolete': receiving.is_obsolete
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500