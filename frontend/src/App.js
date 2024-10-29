// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import DataSelectionPage from './components/DataSelectionPage';
import AddDataForm from './components/AddDataForm';
import EditDeleteTable from './components/EditDeleteTable';
import Form520B from './components/forms/Form520B';
import Form519A501A from './components/forms/Form519A501A';
import Register from './components/Register';

// Define fields for ItemData and ReceivingData forms
const itemFields = [
  { name: 'item_number', label: 'Item Number' },
  { name: 'description', label: 'Description' },
  { name: 'client', label: 'Client' },
  { name: 'protocol_number', label: 'Protocol Number' },
  { name: 'vendor', label: 'Vendor' },
  { name: 'uom', label: 'UoM' },
  { name: 'controlled', label: 'Controlled' },
  { name: 'temp_storage_conditions', label: 'Temperature Storage Conditions' },
  { name: 'other_storage_conditions', label: 'Other Storage Conditions' },
  { name: 'max_exposure_time', label: 'Maximum Exposure Time' },
  { name: 'temper_time', label: 'Temper Time' },
  { name: 'working_exposure_time', label: 'Working Exposure Time' },
  { name: 'vendor_code_rev', label: 'Vendor Code & Revision' },
  { name: 'randomized', label: 'Randomized' },
  { name: 'sequential_numbers', label: 'Sequential Numbers' },
  { name: 'study_type', label: 'Study Type' }
];

const receivingFields = [
  { name: 'receiving_no', label: 'Receiving Number' },
  { name: 'tracking_number', label: 'Tracking Number' },
  { name: 'lot_no', label: 'Lot Number' },
  { name: 'po_no', label: 'PO Number' },
  { name: 'total_units_vendor', label: 'Total Units (Vendor Count)' },
  { name: 'total_storage_containers', label: 'Total Storage Containers' },
  { name: 'exp_date', label: 'Expiration Date' },
  { name: 'ncmr', label: 'NCMR' },
  { name: 'total_units_received', label: 'Total Units Received' },
  { name: 'temp_device_in_alarm', label: 'Temp Device in Alarm' },
  { name: 'ncmr2', label: 'NCMR2' },
  { name: 'temp_device_deactivated', label: 'Temp Device Deactivated' },
  { name: 'temp_device_returned_to_courier', label: 'Temp Device Returned to Courier' },
  { name: 'comments_for_520b', label: 'Comments for Form 520B' }
];

// Define dropdown options for fields that require them
const itemDropdownOptions = {
  client: ['AdiraMedica', 'AsclepiX Therapeutics', 'Bellicum', 'Dechra', 'Loop Therapeutics', 'Loyal', 'NEMA Research', 'Thermo Fisher Scientific'],
  vendor: ['ACS Dobfar S.p.A., Nucleo Industriale', 'AdiraMedica', 'Akston Biosciences', 'Alcami Corporation', 'Areva Pharmaceuticals'],
  controlled: ['No', 'Yes - CII Narc', 'Yes - CII Non', 'Yes - CIII Narc', 'Yes - CIII Non'],
  study_type: ['Blind', 'Single Blind', 'Double Blind', 'Open', 'N/A']
};

const receivingDropdownOptions = {
  ncmr: ['Yes', 'No', 'N/A'],
  temp_device_in_alarm: ['Yes - NCMR', 'No', 'N/A'],
  ncmr2: ['Yes', 'No', 'N/A'],
  temp_device_deactivated: ['Yes', 'No', 'N/A'],
  temp_device_returned_to_courier: ['Yes', 'No', 'N/A'],
  comments_for_520b: ['N/A', 'Test 1', 'Test 2']
};

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={5000} />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />

        {/* ItemData Routes */}
        <Route path="/itemdata" element={<ProtectedRoute><DataSelectionPage dataType="ItemData" /></ProtectedRoute>} />
        <Route path="/add-itemdata" element={<ProtectedRoute><AddDataForm dataType="ItemData" fields={itemFields} dropdownOptions={itemDropdownOptions} /></ProtectedRoute>} />
        <Route path="/edit-itemdata" element={<ProtectedRoute><EditDeleteTable dataType="ItemData" fields={itemFields} /></ProtectedRoute>} />

        {/* ReceivingData Routes */}
        <Route path="/receivingdata" element={<ProtectedRoute><DataSelectionPage dataType="ReceivingData" /></ProtectedRoute>} />
        <Route path="/add-receivingdata" element={<ProtectedRoute><AddDataForm dataType="ReceivingData" fields={receivingFields} dropdownOptions={receivingDropdownOptions} /></ProtectedRoute>} />
        <Route path="/edit-receivingdata" element={<ProtectedRoute><EditDeleteTable dataType="ReceivingData" fields={receivingFields} /></ProtectedRoute>} />

        {/* Form Routes */}
        <Route path="/generate-pdf/520B" element={<ProtectedRoute><Form520B /></ProtectedRoute>} />
        <Route path="/generate-pdf/501A" element={<ProtectedRoute><Form519A501A /></ProtectedRoute>} />
        <Route path="/generate-pdf/519A" element={<ProtectedRoute><Form519A501A /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
