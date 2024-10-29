# backend/inventory_app/routes/item.py

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required  # type: ignore
from .. import db
from ..models import ItemNumber
from ..utils.form_populator import populate_item_form  # Importing populate utility
from ..utils.role_checker import role_required  # Importing role checker utility

bp = Blueprint('item', __name__, url_prefix='/api/item')

@bp.route('/create', methods=['POST'])
@jwt_required()
@role_required('Admin')  # Only Admin users can create new items
def create_item():
    data = request.json
    new_item = populate_item_form(data)  # Populating form fields using utility
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
@role_required('Manager')  # Only Manager and higher roles can update items
def update_item(item_id):
    data = request.json
    item = ItemNumber.query.get(item_id)
    
    if not item:
        return jsonify({"error": "Item not found"}), 404

    # Populate data fields into a new temporary item instance
    updated_data = populate_item_form(data)
    
    # Manually update fields in the existing item
    item.item_number = updated_data.item_number
    item.description = updated_data.description
    item.client = updated_data.client
    item.protocol_number = updated_data.protocol_number
    item.vendor = updated_data.vendor
    item.uom = updated_data.uom
    item.controlled = updated_data.controlled
    item.temp_storage_conditions = updated_data.temp_storage_conditions
    item.other_storage_conditions = updated_data.other_storage_conditions
    item.max_exposure_time = updated_data.max_exposure_time
    item.temper_time = updated_data.temper_time
    item.working_exposure_time = updated_data.working_exposure_time
    item.vendor_code_rev = updated_data.vendor_code_rev
    item.randomized = updated_data.randomized
    item.sequential_numbers = updated_data.sequential_numbers
    item.study_type = updated_data.study_type

    db.session.commit()
    return jsonify({"message": "Item updated successfully"}), 200

@bp.route('/delete/<int:item_id>', methods=['DELETE'])
@jwt_required()
@role_required('Admin')  # Only Admin users can delete items
def delete_item(item_id):
    item = ItemNumber.query.get(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item deleted successfully"}), 200


@bp.route('/numbers', methods=['GET'])
@jwt_required()
def get_item_numbers():
    # Fetch only item_number from ItemNumber model
    items = ItemNumber.query.with_entities(ItemNumber.item_number).all()
    # Return a JSON list of item numbers
    return jsonify([{"item_number": item.item_number} for item in items])
