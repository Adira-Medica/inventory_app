# backend/routes/receiving.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
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
    receiving_data = ReceivingData.query.all()
    return jsonify([{
        'id': rd.id,
        'item_id': rd.item_id,
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
        'temp_device_deactivated': rd.temp_device_deactivated,
        'temp_device_returned_to_courier': rd.temp_device_returned_to_courier,
        'comments_for_520b': rd.comments_for_520b
    } for rd in receiving_data]), 200

@bp.route('/numbers', methods=['GET'])
def get_receiving_numbers():
    receiving_data = ReceivingData.query.all()
    return jsonify([{
        'receiving_no': data.receiving_no
    } for data in receiving_data])