# backend/inventory_app/routes/receiving.py

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models import ReceivingData

bp = Blueprint('receiving', __name__, url_prefix='/api/receiving')

@bp.route('/numbers', methods=['GET'])
@jwt_required()
def get_receiving_numbers():
    # Fetch only receiving_no from ReceivingData model
    receivings = ReceivingData.query.with_entities(ReceivingData.receiving_no).all()
    # Return a JSON list of receiving numbers
    return jsonify([{"receiving_no": receiving.receiving_no} for receiving in receivings])
