# backend/inventory_app/routes/receiving.py

from flask import Blueprint, request, jsonify
from .. import db
from ..models import ReceivingData, ItemNumber
from flask_jwt_extended import jwt_required

bp = Blueprint('receiving', __name__, url_prefix='/api/receiving')

@bp.route('/get', methods=['GET'])
@jwt_required()
def get_receiving_data():
    data = ReceivingData.query.all()
    result = [{
        "id": entry.id,
        "item_number": entry.item.item_number,
        "receiving_no": entry.receiving_no,
        "tracking_number": entry.tracking_number,
        "lot_no": entry.lot_no,
        "po_no": entry.po_no,
        "total_units_vendor": entry.total_units_vendor,
        "total_storage_containers": entry.total_storage_containers,
        "exp_date": entry.exp_date,
        "ncmr": entry.ncmr,
        "total_units_received": entry.total_units_received,
        "temp_device_in_alarm": entry.temp_device_in_alarm,
        "ncmr2": entry.ncmr2,
        "temp_device_deactivated": entry.temp_device_deactivated,
        "temp_device_returned_to_courier": entry.temp_device_returned_to_courier,
        "comments_for_520b": entry.comments_for_520b
    } for entry in data]
    return jsonify(result), 200

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_receiving_data():
    data = request.json
    item = ItemNumber.query.filter_by(item_number=data['item_number']).first()

    if not item:
        return jsonify({"error": "Invalid Item Number"}), 400

    new_entry = ReceivingData(
        item_id=item.id,
        receiving_no=data['receiving_no'],
        tracking_number=data.get('tracking_number'),
        lot_no=data.get('lot_no'),
        po_no=data.get('po_no', 'N/A'),
        total_units_vendor=data.get('total_units_vendor'),
        total_storage_containers=data.get('total_storage_containers'),
        exp_date=data.get('exp_date', 'N/A'),
        ncmr=data.get('ncmr', 'N/A'),
        total_units_received=data.get('total_units_received'),
        temp_device_in_alarm=data.get('temp_device_in_alarm', 'N/A'),
        ncmr2=data.get('ncmr2', 'N/A'),
        temp_device_deactivated=data.get('temp_device_deactivated', 'N/A'),
        temp_device_returned_to_courier=data.get('temp_device_returned_to_courier', 'N/A'),
        comments_for_520b=data.get('comments_for_520b', 'N/A')
    )
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Receiving data added successfully"}), 201

@bp.route('/update/<int:id>', methods=['PUT'])
@jwt_required()
def update_receiving_data(id):
    data = request.json
    entry = ReceivingData.query.get(id)

    if not entry:
        return jsonify({"error": "Receiving data not found"}), 404

    item = ItemNumber.query.filter_by(item_number=data['item_number']).first()
    if not item:
        return jsonify({"error": "Invalid Item Number"}), 400

    # Update fields
    entry.item_id = item.id
    entry.receiving_no = data.get('receiving_no', entry.receiving_no)
    entry.tracking_number = data.get('tracking_number', entry.tracking_number)
    entry.lot_no = data.get('lot_no', entry.lot_no)
    entry.po_no = data.get('po_no', entry.po_no)
    entry.total_units_vendor = data.get('total_units_vendor', entry.total_units_vendor)
    entry.total_storage_containers = data.get('total_storage_containers', entry.total_storage_containers)
    entry.exp_date = data.get('exp_date', entry.exp_date)
    entry.ncmr = data.get('ncmr', entry.ncmr)
    entry.total_units_received = data.get('total_units_received', entry.total_units_received)
    entry.temp_device_in_alarm = data.get('temp_device_in_alarm', entry.temp_device_in_alarm)
    entry.ncmr2 = data.get('ncmr2', entry.ncmr2)
    entry.temp_device_deactivated = data.get('temp_device_deactivated', entry.temp_device_deactivated)
    entry.temp_device_returned_to_courier = data.get('temp_device_returned_to_courier', entry.temp_device_returned_to_courier)
    entry.comments_for_520b = data.get('comments_for_520b', entry.comments_for_520b)

    db.session.commit()
    return jsonify({"message": "Receiving data updated successfully"}), 200

@bp.route('/delete/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_receiving_data(id):
    entry = ReceivingData.query.get(id)
    if not entry:
        return jsonify({"error": "Receiving data not found"}), 404

    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Receiving data deleted successfully"}), 200
