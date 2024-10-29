# backend/inventory_app/routes/form.py

from flask import Blueprint, request, jsonify, send_file
from pdfrw import PdfReader, PdfWriter
from ..models import ItemNumber, ReceivingData
from .. import db
import os

bp = Blueprint('form', __name__, url_prefix='/api/form')

def populate_pdf_fields(template_path, output_path, field_data):
    template_pdf = PdfReader(template_path)
    
    # Populate each field in the PDF
    for field in template_pdf.Root.AcroForm.Fields:
        field_name = field.T[1:-1]  # Extract field name from PDF
        if field_name in field_data:
            field.V = f"({field_data[field_name]})"  # Set field value in PDF
    
    PdfWriter(output_path, trailer=template_pdf).write()

@bp.route('/generate-pdf/<template_name>', methods=['POST'])
def generate_pdf(template_name):
    data = request.json
    template_path = os.path.join('templates', f"{template_name}.pdf")
    output_path = os.path.join('output', f"{template_name}_filled.pdf")

    if not os.path.exists(template_path):
        return jsonify({"error": "Template not found"}), 404

    field_data = {"Item No.": data.get("ItemNo"), "Receiving No.": data.get("ReceivingNo")}

    if template_name == "520B":
        checkboxes = data.get("checkboxes", {})
        
        # Dual-option checkboxes
        dual_options = [
            "Material placed in storage as documented above",
            "Discrepancies and/or damaged documented on the shipping paperwork",
            "Supporting documentation received attached",
            "Shipment REJECTED. Reason documented on the shipping paperwork"
        ]
        
        for option in dual_options:
            field_data[option] = "Yes" if checkboxes.get(option) else ""
            field_data[f"{option} - N/A"] = "Yes" if checkboxes.get(f"{option} - N/A") else ""
        
        # Single-option checkboxes
        single_options = [
            "Purchase Order", "Packing Slip", "Quantity discrepancies found",
            "Bill of Lading", "CoC/CoA", "Damage to shipping container(s)",
            "SDS #", "Invoice", "Damage to product within shipping container",
            "Other (Specify)", "Temperature excursion", "Expiration Date",
            "Retest Date", "Use-by-Date"
        ]
        
        for option in single_options:
            field_data[option] = "Yes" if checkboxes.get(option) else ""
    
    populate_pdf_fields(template_path, output_path, field_data)
    return send_file(output_path, as_attachment=True)
