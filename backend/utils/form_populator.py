from ..models import ItemNumber

def populate_item_form(data):
    return ItemNumber(
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

