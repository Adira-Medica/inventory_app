from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required # type: ignore
from .. import db
from ..models import ItemNumber
from ..utils.role_checker import role_required

bp = Blueprint('item', __name__, url_prefix='/api/item')

@bp.route('/create', methods=['POST'])
@jwt_required()
@role_required('Admin')
def create_item():
    data = request.json
    new_item = ItemNumber(
        item_number=data['item_number'],
        description=data['description'],
        client=data['client'],
        protocol_number=data['protocol_number'],
        vendor=data['vendor'],
        uom=data['uom'],
        controlled=data['controlled'],
        temp_storage_conditions=data['temp_storage_conditions'],
        other_storage_conditions=data.get('other_storage_conditions', 'N/A'),
        max_exposure_time=data.get('max_exposure_time'),
        temper_time=data.get('temper_time'),
        working_exposure_time=data.get('working_exposure_time'),
        vendor_code_rev=data['vendor_code_rev'],
        randomized=data['randomized'],
        sequential_numbers=data['sequential_numbers'],
        study_type=data['study_type']
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Item created successfully"}), 201

@bp.route('/get', methods=['GET'])
@jwt_required()
def get_items():
    items = ItemNumber.query.all()
    items_list = [{
        "id": item.id,
        "item_number": item.item_number,
        "description": item.description,
        "client": item.client,
        "protocol_number": item.protocol_number,
        "vendor": item.vendor,
        "uom": item.uom,
        "controlled": item.controlled,
        "temp_storage_conditions": item.temp_storage_conditions,
        "max_exposure_time": item.max_exposure_time,
        "temper_time": item.temper_time,
        "working_exposure_time": item.working_exposure_time,
        "vendor_code_rev": item.vendor_code_rev,
        "randomized": item.randomized,
        "sequential_numbers": item.sequential_numbers,
        "study_type": item.study_type
    } for item in items]
    return jsonify(items_list), 200

@bp.route('/update/<int:item_id>', methods=['PUT'])
@jwt_required()
@role_required('Manager')
def update_item(item_id):
    data = request.json
    item = ItemNumber.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    item.description = data['description']
    item.client = data['client']
    item.protocol_number = data['protocol_number']
    item.vendor = data['vendor']
    item.uom = data['uom']
    item.controlled = data['controlled']
    item.temp_storage_conditions = data['temp_storage_conditions']
    item.other_storage_conditions = data.get('other_storage_conditions', 'N/A')
    item.max_exposure_time = data.get('max_exposure_time')
    item.temper_time = data.get('temper_time')
    item.working_exposure_time = data.get('working_exposure_time')
    item.vendor_code_rev = data['vendor_code_rev']
    item.randomized = data['randomized']
    item.sequential_numbers = data['sequential_numbers']
    item.study_type = data['study_type']

    db.session.commit()
    return jsonify({"message": "Item updated successfully"}), 200

@bp.route('/delete/<int:item_id>', methods=['DELETE'])
@jwt_required()
@role_required('Admin')
def delete_item(item_id):
    item = ItemNumber.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted successfully"}), 200
