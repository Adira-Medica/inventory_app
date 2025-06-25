# backend/utils/html_to_pdf_handler.py - Replace your entire file with this:
from flask import render_template
import pdfkit # type: ignore
from pathlib import Path
from datetime import datetime
import os

class HTMLToPDFHandler:
    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / 'templates'
        self.generated_dir = Path(__file__).parent.parent / 'generated'
        self.generated_dir.mkdir(exist_ok=True)
        
        # ✅ FIXED: Use the wkhtmltopdf we know exists on Render from diagnostics
        self.config = pdfkit.configuration(wkhtmltopdf='/usr/bin/wkhtmltopdf')
        
        self.pdf_options = {
            'page-size': 'A4',
            'margin-top': '10mm',
            'margin-right': '10mm',
            'margin-bottom': '10mm',
            'margin-left': '10mm',
            'encoding': 'UTF-8',
            'no-outline': None,
            'enable-local-file-access': None,
            'disable-smart-shrinking': None,
            'print-media-type': None
        }

    def _format_boolean_value(self, value):
        """Helper to safely handle boolean values"""
        if isinstance(value, bool):
            return 'checked' if value else ''
        return 'checked' if str(value).lower() in ['true', 'yes', '1'] else ''

    def generate_501a_pdf(self, data):
        try:
            print(f"🔄 Generating 501A PDF for receiving: {data.get('receiving_no', 'unknown')}")
            
            template_data = {
                'receiving_no': data.get('receiving_no', ''),
                'item_no': data.get('item_no', ''),
                'item_description': data.get('item_description', ''),
                'client_name': data.get('client_name', ''),
                'vendor_name': data.get('vendor_name', ''),
                'lot_no': data.get('lot_no', ''),
                'storage_conditions': data.get('storage_conditions', ''),
                'other_storage_conditions': data.get('other_storage_conditions', ''),
                'total_units_received': data.get('total_units_received', ''),
                'controlled_substance': data.get('controlled_substance', ''),
                'locationStatus': {
                    'quarantine': self._format_boolean_value(data.get('locationStatus', {}).get('quarantine', False)),
                    'rejected': self._format_boolean_value(data.get('locationStatus', {}).get('rejected', False)),
                    'released': self._format_boolean_value(data.get('locationStatus', {}).get('released', False))
                },
                'dateType': data.get('dateType', ''),
                'dateValue': data.get('dateValue', ''),
                'completedBy': data.get('completedBy', ''),
                'transactions': data.get('transactions', []),
                'comments': data.get('comments', '')
            }
            
            print(f"📝 Rendering template with data keys: {list(template_data.keys())}")
            rendered_html = render_template('501A.html', **template_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"501A_{data.get('receiving_no', 'unknown')}_{timestamp}.pdf"
            
            print(f"🎯 Generating PDF to: {output_path}")
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )
            
            if not output_path.exists():
                raise Exception("PDF file was not created")
                
            file_size = output_path.stat().st_size
            print(f"✅ PDF generated successfully: {output_path} ({file_size} bytes)")
            
            return output_path
            
        except Exception as e:
            print(f"❌ Error generating 501A PDF: {str(e)}")
            import traceback
            print(f"📍 Traceback: {traceback.format_exc()}")
            raise Exception(f"PDF generation failed: {str(e)}")

    def generate_520b_pdf(self, data):
        try:
            print(f"🔄 Generating 520B PDF for item: {data.get('Item No', 'unknown')}")
            
            template_data = {
                'item_no': data.get('Item No', ''),
                'tracking_no': data.get('Tracking No', ''),
                'client_name': data.get('Client Name', ''),
                'item_description': data.get('Item Description', ''),
                'storage_conditions_temp': data.get('Storage Conditions:Temperature', ''),
                'storage_conditions_other': data.get('Other', ''),
                'receiving_no': data.get('RN', ''),
                'lot_no': data.get('Lot No', ''),
                'po_no': data.get('PO No', ''),
                'protocol_no': data.get('Protocol No', ''),
                'vendor': data.get('Vendor', ''),
                'uom': data.get('UoM', ''),
                'total_units': data.get('Total Units (vendor count)', ''),
                'total_containers': data.get('Total Storage Containers', ''),
                'deliveryAcceptance': [
                    {'name': 'Item numbers match shipping documentation', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Item numbers match shipping documentation', False))},
                    {'name': 'Lot numbers match shipping documentation', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Lot numbers match shipping documentation', False))},
                    {'name': 'Quantity matches shipping documentation', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Quantity matches shipping documentation', False))},
                    {'name': 'Shipping container is intact', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Shipping container is intact', False))},
                    {'name': 'Product container(s) is/are intact', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Product container(s) is/are intact', False))},
                    {'name': 'Temperature recording device included', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Temperature recording device included', False))},
                    {'name': 'Temperature has been maintained', 'checked': self._format_boolean_value(data.get('deliveryAcceptance', {}).get('Temperature has been maintained', False))}
                ],
                # Add the missing deliveryAcceptanceNA data
                'deliveryAcceptanceNA': {
                    'material_placed': self._format_boolean_value(data.get('deliveryAcceptanceNA', {}).get('material_placed', False)),
                    'temperature_maintained': self._format_boolean_value(data.get('deliveryAcceptanceNA', {}).get('temperature_maintained', False)),
                    'device_included': self._format_boolean_value(data.get('deliveryAcceptanceNA', {}).get('device_included', False))
                },
                'dateType': data.get('dateType', ''),
                'dateValue': data.get('dateValue', ''),
                'receivingCompletedBy': data.get('receivingCompletedBy', ''),
                'documentVerification': [
                    {'name': 'COA #', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('COA #', False))},
                    {'name': 'SDS #', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('SDS #', False))},
                    {'name': 'Invoice', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('Invoice', False))},
                    {'name': 'Other (Specify)', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('Other (Specify)', False))}
                ],
                'issuesSection': [
                    {'name': 'Quantity discrepancies found', 'checked': self._format_boolean_value(data.get('issuesSection', {}).get('Quantity discrepancies found', False))},
                    {'name': 'Damage to shipping container(s)', 'checked': self._format_boolean_value(data.get('issuesSection', {}).get('Damage to shipping container(s)', False))},
                    {'name': 'Damage to product within shipping container', 'checked': self._format_boolean_value(data.get('issuesSection', {}).get('Damage to product within shipping container', False))},
                    {'name': 'Temperature excursion', 'checked': self._format_boolean_value(data.get('issuesSection', {}).get('Temperature excursion', False))}
                ],
                'ncmr': data.get('NCMR', 'N/A'),
                'comments': data.get('Comments', '')
            }
            
            rendered_html = render_template('520B.html', **template_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"520B_{data.get('RN', 'unknown')}_{timestamp}.pdf"
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )
            
            if not output_path.exists():
                raise Exception("PDF file was not created")
                
            return output_path
            
        except Exception as e:
            print(f"❌ Error generating 520B PDF: {str(e)}")
            raise Exception(f"PDF generation failed: {str(e)}")

    def generate_519a_pdf(self, data):
        try:
            print(f"🔄 Generating 519A PDF for receiving: {data.get('receiving_no', 'unknown')}")
            
            template_data = {
                'receiving_no': data.get('receiving_no', ''),
                'item_no': data.get('item_no', ''),
                'item_description': data.get('item_description', ''),
                'lot_no': data.get('lot_no', ''),
                'storage_conditions': data.get('storage_conditions', ''),
                'date_time_received': data.get('date_time_received', ''),
                'other_storage_conditions': data.get('other_storage_conditions', ''),
                'temp_device_alarm': data.get('temp_device_alarm', ''),
                'temp_device_deactivated': data.get('temp_device_deactivated', ''),
                'temp_device_returned': data.get('temp_device_returned', ''),
                'max_exposure_time': str(data.get('max_exposure_time', '')) + ' (min)',
                'temper_time': str(data.get('temper_time', '')) + ' (min)',
                'working_exposure_time': str(data.get('working_exposure_time', '')) + ' (min)',
                'container_no': data.get('container_no', ''),
                'total_units_per_container': data.get('total_units_per_container', ''),
                'record_created_by': data.get('record_created_by', ''),
                'record_created_date': data.get('record_created_date', ''),
                'drug_movements': [
                    {
                        'destination': movement.get('destination', ''),
                        'date': movement.get('date', ''),
                        'time': movement.get('time', ''),
                        'exposure_time': movement.get('exposure_time', ''),
                        'cumulative_et': movement.get('cumulative_et', ''),
                        'completed_by': movement.get('completed_by', ''),
                        'verified_by': movement.get('verified_by', '')
                    }
                    for movement in data.get('drug_movements', [])
                ]
            }
            
            rendered_html = render_template('519A.html', **template_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"519A_{data.get('receiving_no', 'unknown')}_{timestamp}.pdf"
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )
            
            if not output_path.exists():
                raise Exception("PDF file was not created")
                
            return output_path
            
        except Exception as e:
            print(f"❌ Error generating 519A PDF: {str(e)}")
            raise Exception(f"PDF generation failed: {str(e)}")