# backend/utils/form_handler.py
from pdfrw import PdfReader, PdfWriter, PdfDict
import os

class PDFFormHandler:
    def __init__(self):
        self.template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'templates')
        self.output_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated')
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_pdf(self, form_type, data):
        template_path = os.path.join(self.template_dir, f'{form_type}.pdf')
        output_path = os.path.join(self.output_dir, f"{form_type}_{data['receiving_no']}_{data.get('lot_no', 'NOLOT')}.pdf")
        
        template = PdfReader(template_path)
        
        # Fill form fields
        for page in template.pages:
            if page.Annots:
                for annotation in page.Annots:
                    if annotation.FT == '/Tx':  # Text field
                        key = str(annotation.T)[1:-1]  # Remove parentheses
                        if key in data:
                            annotation.V = str(data[key])
                    elif annotation.FT == '/Btn':  # Checkbox/Radio button
                        key = str(annotation.T)[1:-1]
                        if key in data and data[key]:
                            annotation.AS = annotation.AP.D.keys()[0]
        
        PdfWriter().write(output_path, template)
        return output_path