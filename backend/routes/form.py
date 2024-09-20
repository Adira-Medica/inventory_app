from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from .. import db
from ..models import ItemNumber
from ..utils.form_populator import populate_item_form
from ..utils.role_checker import role_required

bp = Blueprint('form', __name__, url_prefix='/api/form')

@bp.route('/populate', methods=['POST'])
@jwt_required()
@role_required('Admin')
def populate_form():
    data = request.json
    new_item = populate_item_form(data)
    db.session.add(new_item)
    db.session.commit()
    return jsonify({"message": "Form populated and item created successfully"}), 201
