# backend/routes/item.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..models import ItemNumber
from ..extensions import db
from sqlalchemy import func

bp = Blueprint('item', __name__, url_prefix='/api/item')

# Add a new endpoint to check for duplicate descriptions
@bp.route('/check-description', methods=['POST'])
@jwt_required()
def check_description():
    data = request.get_json()
    description = data.get('description', '').strip()
    
    # Case-insensitive check for existing description
    existing_item = ItemNumber.query.filter(
        func.lower(ItemNumber.description) == func.lower(description)
    ).first()
    
    return jsonify({
        'exists': existing_item is not None,
        'message': 'Description already exists' if existing_item else None
    })

@bp.route('/create', methods=['POST'])
@jwt_required()
def create_item():
    data = request.get_json()

    # Case-insensitive check for existing description
    existing_item = ItemNumber.query.filter(
        func.lower(ItemNumber.description) == func.lower(data['description'].strip())
    ).first()
    
    if existing_item:
        return jsonify({
            'error': 'An item with this description already exists'
        }), 400

    new_item = ItemNumber(**data)
    
    db.session.add(new_item)
    try:
        db.session.commit()
        return jsonify({'message': 'Item created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@bp.route('/get', methods=['GET'])
@jwt_required()
def get_items():
    items = ItemNumber.query.all()
    return jsonify([{
        'id': item.id,
        'item_number': item.item_number,
        'description': item.description,
        'client': item.client,
        'protocol_number': item.protocol_number,
        'vendor': item.vendor,
        'uom': item.uom,
        'controlled': item.controlled,
        'temp_storage_conditions': item.temp_storage_conditions,
        'other_storage_conditions': item.other_storage_conditions,
        'max_exposure_time': item.max_exposure_time,
        'temper_time': item.temper_time,
        'working_exposure_time': item.working_exposure_time,
        'vendor_code_rev': item.vendor_code_rev,
        'randomized': item.randomized,
        'sequential_numbers': item.sequential_numbers,
        'study_type': item.study_type
    } for item in items]), 200

@bp.route('/update/<int:id>', methods=['PUT'])
@jwt_required()
def update_item(id):
    item = ItemNumber.query.get_or_404(id)
    data = request.get_json()
    
    for key, value in data.items():
        setattr(item, key, value)
    
    db.session.commit()
    return jsonify({'message': 'Item updated successfully'}), 200

@bp.route('/delete/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_item(id):
    item = ItemNumber.query.get_or_404(id)
    db.session.delete(item)
    db.session.commit()
    return jsonify({'message': 'Item deleted successfully'}), 200

@bp.route('/numbers', methods=['GET'])
def get_item_numbers():
    items = ItemNumber.query.all()
    return jsonify([{
        'item_number': item.item_number,
        'description': item.description
    } for item in items])