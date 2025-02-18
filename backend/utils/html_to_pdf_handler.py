# backend/utils/html_to_pdf_handler.py
from flask import render_template
import pdfkit # type: ignore
from pathlib import Path
from datetime import datetime

class HTMLToPDFHandler:
    def __init__(self):
        self.template_dir = Path(__file__).parent.parent / 'templates'
        self.generated_dir = Path(__file__).parent.parent / 'generated'
        self.generated_dir.mkdir(exist_ok=True)
        
        self.config = pdfkit.configuration(
            wkhtmltopdf=r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
        )
        
        self.pdf_options = {
            'page-size': 'A4',
            'margin-top': '0mm',
            'margin-right': '0mm',
            'margin-bottom': '0mm',
            'margin-left': '0mm',
            'encoding': 'UTF-8',
            'no-outline': None,
            'enable-local-file-access': None
        }

    def _format_boolean_value(self, value):
        """Helper to safely handle boolean values"""
        if isinstance(value, bool):
            return 'checked' if value else ''
        return 'checked' if str(value).lower() in ['true', 'yes', '1'] else ''

    def generate_520b_pdf(self, data):
        try:
            print("Received data for 520B:", data)  # Debug print
            
            template_data = {
                # Basic fields
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

                # Delivery acceptance with Yes/No/NA options
                'deliveryAcceptance': {
                    'material_placed_yes': data.get('deliveryAcceptance', {}).get('material_placed') == 'yes',
                    'material_placed_no': data.get('deliveryAcceptance', {}).get('material_placed') == 'no',
                    'discrepancies_yes': data.get('deliveryAcceptance', {}).get('discrepancies') == 'yes',
                    'discrepancies_no': data.get('deliveryAcceptance', {}).get('discrepancies') == 'no',
                    'supporting_docs_yes': data.get('deliveryAcceptance', {}).get('supporting_docs') == 'yes',
                    'supporting_docs_no': data.get('deliveryAcceptance', {}).get('supporting_docs') == 'no',
                    'shipment_rejected_yes': data.get('deliveryAcceptance', {}).get('shipment_rejected') == 'yes',
                    'shipment_rejected_no': data.get('deliveryAcceptance', {}).get('shipment_rejected') == 'no',
                },
                'deliveryAcceptanceNA': {
                    'material_placed': data.get('deliveryAcceptance', {}).get('material_placed') == 'na',
                    'discrepancies': data.get('deliveryAcceptance', {}).get('discrepancies') == 'na',
                    'supporting_docs': data.get('deliveryAcceptance', {}).get('supporting_docs') == 'na',
                    'shipment_rejected': data.get('deliveryAcceptance', {}).get('shipment_rejected') == 'na',
                },
                
                # Date section
                'dateType': data.get('selectedDateType', ''),
                'dateValue': data.get('dateValue', ''),
                
                # Completed By sections
                'deliveryCompletedBy': data.get('deliveryCompletedBy', ''),
                'receivingCompletedBy': data.get('receivedBy', ''),
                
                # Document verification and issues sections
                'documentVerification': [
                    {'name': 'Purchase Order', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('Purchase Order', False))},
                    {'name': 'Packing Slip', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('Packing Slip', False))},
                    {'name': 'Bill of Lading', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('Bill of Lading', False))},
                    {'name': 'CoC/CoA', 'checked': self._format_boolean_value(data.get('documentVerification', {}).get('CoC/CoA', False))},
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

            print("Template data for 520B:", template_data)  # Debug print
            rendered_html = render_template('520B.html', **template_data)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"520B_{data.get('RN', 'unknown')}_{timestamp}.pdf"
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )

            return output_path

        except Exception as e:
            print(f"Error generating 520B PDF: {str(e)}")
            raise

    def generate_519a_pdf(self, data):
        try:
            template_data = {
                'receiving_no': data.get('Receiving No', ''),
                'item_no': data.get('Item No', ''),
                'item_description': data.get('Item Description', ''),
                'lot_no': data.get('Lot No', ''),
                'storage_conditions': data.get('Storage Conditions', ''),
                'date_time_received': data.get('Date and Time Received', ''),
                'other_storage_conditions': data.get('Other Storage Conditions', ''),
                'temp_device_alarm': data.get('Temperature Device on Alarm', ''),
                'temp_device_deactivated': data.get('Temperature Device Deactivated', ''),
                'temp_device_returned': data.get('Temperature Device Returned to Courier', ''),
                'max_exposure_time': data.get('Maximum Exposure Time', ''),
                'temper_time': data.get('Temper Time', ''),
                'working_exposure_time': data.get('Working Exposure Time', ''),
                'container_no': data.get('Container No', ''),
                'total_units_per_container': data.get('Total Units/Container', ''),
                'record_created_by': data.get('Record Created By', ''),
                'drug_movements': data.get('drugMovements', [])
            }

            rendered_html = render_template('519A.html', **template_data)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"519A_{data.get('Receiving No', 'unknown')}_{timestamp}.pdf"
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )

            return output_path

        except Exception as e:
            print(f"Error generating 519A PDF: {str(e)}")
            raise

    def generate_501a_pdf(self, data):
        try:
            print("Received 501A data:", data)  # Debug print
            
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
               
                # Location status checkboxes
                'locationStatus': {
                    'quarantine': self._format_boolean_value(
                        data.get('locationStatus', {}).get('quarantine', False)
                    ),
                    'rejected': self._format_boolean_value(
                        data.get('locationStatus', {}).get('rejected', False)
                    ),
                    'released': self._format_boolean_value(
                        data.get('locationStatus', {}).get('released', False)
                    )
                },
               
                # Date fields
                'dateType': data.get('dateType', ''),
                'dateValue': data.get('dateValue', ''),
                
                # Completed By field
                'completedBy': data.get('completedBy', ''),
                
                # Transactions table
                'transactions': data.get('transactions', []),
               
                # Comments
                'comments': data.get('comments', '')
            }

            print("Template data for 501A:", template_data)  # Debug print
            rendered_html = render_template('501A.html', **template_data)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = self.generated_dir / f"501A_{data.get('receiving_no', 'unknown')}_{timestamp}.pdf"
            
            pdfkit.from_string(
                rendered_html,
                str(output_path),
                options=self.pdf_options,
                configuration=self.config
            )

            return output_path

        except Exception as e:
            print(f"Error generating 501A PDF: {str(e)}")
            raise