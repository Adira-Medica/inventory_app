# backend/seed_data.py
from __init__ import create_app
from extensions import db
from models import User, ItemNumber, ReceivingData

def seed_database():
    app = create_app()
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()

        # Create test users
        users = [
            User(username="admin", role="admin"),
            User(username="manager", role="manager"),
            User(username="user", role="user")
        ]
        
        for user in users:
            user.set_password("password123")
            db.session.add(user)

        # Create test items
        items = [
            ItemNumber(
                item_number="D200001",
                description="Test Item A",
                client="AdiraMedica",
                protocol_number="P001",
                vendor="Vendor X",
                uom="kg",
                controlled="No",
                temp_storage_conditions="Room Temp",
                other_storage_conditions="N/A",
                max_exposure_time=72,
                temper_time=24,
                working_exposure_time=48,
                vendor_code_rev="V1",
                randomized="Yes",
                sequential_numbers="No",
                study_type="Double Blind"
            ),
            ItemNumber(
                item_number="NP200002",
                description="Test Item B",
                client="Client B",
                protocol_number="P002",
                vendor="Vendor Y",
                uom="L",
                controlled="Yes - CII Non",
                temp_storage_conditions="Cool",
                other_storage_conditions="Dry",
                max_exposure_time=36,
                temper_time=12,
                working_exposure_time=24,
                vendor_code_rev="V2",
                randomized="No",
                sequential_numbers="Yes",
                study_type="Single Blind"
            )
        ]
        db.session.bulk_save_objects(items)

        # Create test receiving data
        receiving_data = [
            ReceivingData(
                item_id=1,
                receiving_no="L111122001",
                tracking_number="15646W15039413",
                lot_no="AM22004",
                po_no="1234",
                total_units_vendor=100,
                total_storage_containers=10,
                exp_date="12/31/2023",
                ncmr="No",
                total_units_received=100,
                temp_device_in_alarm="No",
                temp_device_deactivated="Yes",
                temp_device_returned_to_courier="No",
                comments_for_520b="N/A"
            ),
            ReceivingData(
                item_id=2,
                receiving_no="L102522001",
                tracking_number="6418467",
                lot_no="NR-02-178",
                po_no="N/A",
                total_units_vendor=50,
                total_storage_containers=5,
                exp_date="TBD",
                ncmr="Yes",
                total_units_received=50,
                temp_device_in_alarm="Yes - NCMR",
                temp_device_deactivated="No",
                temp_device_returned_to_courier="Yes",
                comments_for_520b="Test 1"
            )
        ]
        db.session.bulk_save_objects(receiving_data)
        db.session.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    seed_database()
