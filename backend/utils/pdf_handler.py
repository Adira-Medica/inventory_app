# backend/utils/pdf_handler.py
from reportlab.pdfgen import canvas  # type: ignore
from reportlab.lib.pagesizes import letter  # type: ignore
from PyPDF2 import PdfReader, PdfWriter  # type: ignore
import io
import os
from datetime import datetime

class PDFHandler:
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        self.output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated')
        os.makedirs(self.output_dir, exist_ok=True)
        print(f"Template dir: {self.template_dir}")
        print(f"Output dir: {self.output_dir}")

        # Define coordinates as class attributes
        self.field_coordinates = {
            'Item No': (100, 715),        # Top section
            'Tracking No': (250, 715),
            'Client Name': (600, 715),
            
            'Item Description': (100, 680), 
            
            'Storage Conditions:Temperature': (100, 650),
            'Other': (500, 650),
            
            'RN': (100, 470),            # Middle section
            'Lot No': (250, 470),
            'PO No': (400, 470),
            
            'Protocol No': (400, 450),
            'Vendor': (100, 450),
            
            'UoM': (100, 430),
            'Total Units (vendor count)': (320, 430),
            'Total Storage Containers': (600, 430),
            
            'NCMR': (100, 300),          # Bottom section
            'Comments': (100, 250),
        }

        self.checkbox_coordinates = {
            'Material placed in storage as documented above': (60, 600),
            'Discrepancies and/or damaged documented on the shipping paperwork': (60, 580),
            'Supporting documentation received attached': (60, 560),
            'Shipment REJECTED. Reason documented on the shipping paperwork': (60, 540),
            
            'Purchase Order': (60, 350),
            'Packing Slip': (200, 350),
            'Bill of Lading': (340, 350),
            'CoC/CoA': (480, 350),
            'SDS #': (60, 330),
            'Invoice': (200, 330),
            'Other (Specify)': (340, 330),
        }

    def generate_520b_pdf(self, data):
        try:
            print("Starting PDF generation with data:", data)
            
            template_path = os.path.join(self.template_dir, '520B.pdf')
            print(f"Template path: {template_path}")
            
            if not os.path.exists(template_path):
                raise FileNotFoundError(f"Template not found at {template_path}")

            # Create packet
            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=letter)
            
            # Set font and size
            c.setFont("Helvetica", 8)  # Smaller font size

            # Draw text fields
            for field, coords in self.field_coordinates.items():
                if field in data and data[field]:
                    print(f"Drawing field {field} at {coords} with value {data[field]}")
                    c.drawString(coords[0], coords[1], str(data[field]))

            # Draw checkmarks for selected checkboxes with a larger font
            c.setFont("Helvetica", 12)  # Larger font for checkmarks
            for field, coords in self.checkbox_coordinates.items():
                if field in data and data[field]:
                    print(f"Drawing checkbox {field} at {coords}")
                    c.drawString(coords[0], coords[1], "✓")

            # Draw date with original font size
            c.setFont("Helvetica", 8)
            if data.get('Expiration Date'):
                print(f"Drawing Expiration Date: {data['Expiration Date']}")
                c.drawString(100, 400, f"Expiration Date: {data['Expiration Date']}")

            c.save()
            packet.seek(0)

            # Create PDF
            new_pdf = PdfReader(packet)
            existing_pdf = PdfReader(template_path)
            output = PdfWriter()

            # Merge pages
            page = existing_pdf.pages[0]
            page.merge_page(new_pdf.pages[0])
            output.add_page(page)

            # Save the output
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(
                self.output_dir,
                f"520B_{timestamp}.pdf"
            )

            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)

            with open(output_path, 'wb') as output_file:
                output.write(output_file)

            print(f"PDF generated successfully at: {output_path}")
            return output_path

        except Exception as e:
            print(f"Error in PDF generation: {str(e)}")
            print("Traceback:")
            import traceback
            traceback.print_exc()
            raise


    def generate_501a_pdf(self, data):
        try:
            template_path = os.path.join(self.template_dir, '501A.pdf')
            if not os.path.exists(template_path):
                raise FileNotFoundError(f"Template not found at {template_path}")

            # Create packet
            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=letter)
            c.setFont("Helvetica", 8)

            # Define field coordinates for 501A form
            field_coordinates = {
                'Receiving No': (100, 700),
                'Item No': (300, 700),
                'Item Description': (100, 650),
                'Client Name': (100, 600),
                'Vendor Name': (100, 550),
                'Lot No': (100, 500),
                'Storage Conditions': (100, 450),
                'Other Storage Conditions': (100, 400),
                'Total Units Received/UOM': (100, 350),
                'Controlled Substance': (100, 300),
                'Comments': (100, 100)
            }

            # Add text fields
            for field, coords in field_coordinates.items():
                if field in data and data[field]:
                    c.drawString(coords[0], coords[1], str(data[field]))

            # Add checkboxes for Location Status
            checkbox_y = 250
            if data.get('locationStatus', {}).get('quarantine'):
                c.drawString(100, checkbox_y, "✓")  # Quarantine checkbox
            if data.get('locationStatus', {}).get('rejected'):
                c.drawString(200, checkbox_y, "✓")  # Rejected checkbox
            if data.get('locationStatus', {}).get('released'):
                c.drawString(300, checkbox_y, "✓")  # Released checkbox

            # Add date
            if data.get('dateType') and data.get('dateValue'):
                date_y = 200
                c.drawString(100, date_y, f"{data['dateType']}: {data['dateValue']}")

            c.save()
            packet.seek(0)

            # Create PDF
            new_pdf = PdfReader(packet)
            existing_pdf = PdfReader(template_path)
            output = PdfWriter()

            # Merge pages
            page = existing_pdf.pages[0]
            page.merge_page(new_pdf.pages[0])
            output.add_page(page)

            # Save the output
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(
                self.output_dir,
                f"501A_{timestamp}.pdf"
            )

            with open(output_path, 'wb') as output_file:
                output.write(output_file)

            return output_path
        except Exception as e:
            print(f"Error in PDF generation: {str(e)}")
            print("Traceback:")
            import traceback
            traceback.print_exc()
            raise

    def generate_519a_pdf(self, data):
        try:
            template_path = os.path.join(self.template_dir, '519A.pdf')
            if not os.path.exists(template_path):
                raise FileNotFoundError(f"Template not found at {template_path}")

            # Create packet
            packet = io.BytesIO()
            c = canvas.Canvas(packet, pagesize=letter)
            c.setFont("Helvetica", 8)

            # Define field coordinates for 519A form
            field_coordinates = {
                'Receiving No': (100, 700),
                'Item No': (300, 700),
                'Item Description': (100, 650),
                'Lot No': (100, 600),
                'Storage Conditions': (100, 550),
                'Other Storage Conditions': (100, 500),
                'Date and Time Received': (300, 500),
                'Temperature Device on Alarm': (100, 450),
                'Temperature Device Deactivated': (300, 450),
                'Temperature Device Returned': (100, 400),
                'Container No': (100, 350),
                'Total Units/Container': (300, 350),
                'Maximum Exposure Time': (100, 300),
                'Working Exposure Time': (300, 300),
                'Temper Time': (100, 250),
            }

            # Add text fields
            for field, coords in field_coordinates.items():
                field_value = ""
                if field in data:
                    field_value = data[field]
                elif field == 'Temperature Device on Alarm':
                    field_value = data.get('tempDeviceInfo', {}).get('onAlarm', '')
                elif field == 'Temperature Device Deactivated':
                    field_value = data.get('tempDeviceInfo', {}).get('deactivated', '')
                elif field == 'Temperature Device Returned':
                    field_value = data.get('tempDeviceInfo', {}).get('returnedToCourier', '')
                elif field == 'Maximum Exposure Time':
                    field_value = data.get('exposureTimes', {}).get('maximumExposure', '')
                elif field == 'Working Exposure Time':
                    field_value = data.get('exposureTimes', {}).get('workingExposure', '')
                elif field == 'Temper Time':
                    field_value = data.get('exposureTimes', {}).get('temperTime', '')

                if field_value:
                    c.drawString(coords[0], coords[1], str(field_value))

            # Add drug movements table
            movements_start_y = 200
            for i, movement in enumerate(data.get('drugMovements', [])):
                y = movements_start_y - (i * 20)
                c.drawString(100, y, movement.get('destination', ''))
                c.drawString(200, y, movement.get('date', ''))
                c.drawString(250, y, movement.get('time', ''))
                c.drawString(300, y, str(movement.get('exposureTime', '')))
                c.drawString(350, y, str(movement.get('cumulativeET', '')))
                c.drawString(400, y, movement.get('completedBy', ''))
                c.drawString(500, y, movement.get('verifiedBy', ''))

            c.save()
            packet.seek(0)

            # Create PDF
            new_pdf = PdfReader(packet)
            existing_pdf = PdfReader(template_path)
            output = PdfWriter()

            # Merge pages
            page = existing_pdf.pages[0]
            page.merge_page(new_pdf.pages[0])
            output.add_page(page)

            # Save the output
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join(
                self.output_dir,
                f"519A_{timestamp}.pdf"
            )

            with open(output_path, 'wb') as output_file:
                output.write(output_file)

            return output_path
        except Exception as e:
            print(f"Error in PDF generation: {str(e)}")
            print("Traceback:")
            import traceback
            traceback.print_exc()
            raise