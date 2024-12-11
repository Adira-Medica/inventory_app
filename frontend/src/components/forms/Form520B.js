// src/components/forms/Form520B.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { mockItemData, mockReceivingData } from '../../mockData';
import api from '../../api/axios';

const Form520B = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    checkboxes: {},
    selectedDateType: '',
    dateValue: '',
    deliveryAcceptance: {
      "Material placed in storage as documented above": false,
      "Discrepancies and/or damaged documented on the shipping paperwork": false,
      "Supporting documentation received attached": false,
      "Shipment REJECTED. Reason documented on the shipping paperwork": false
    },
    documentVerification: {
      "Purchase Order": false,
      "Packing Slip": false,
      "Bill of Lading": false,
      "CoC/CoA": false,
      "SDS #": false,
      "Invoice": false,
      "Other (Specify)": false
    },
    issuesSection: {
      "Quantity discrepancies found": false,
      "Damage to shipping container(s)": false,
      "Damage to product within shipping container": false,
      "Temperature excursion": false
    }
  });

  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [selectedReceivingData, setSelectedReceivingData] = useState(null);

  useEffect(() => {
    // Using mock data for now
    setItemOptions(mockItemData);
    setReceivingOptions(mockReceivingData);

    // Pre-fill form with first item and receiving number (for testing)
    if (mockItemData.length && mockReceivingData.length) {
      setFormData(prev => ({
          ...prev,
          ItemNo: mockItemData[0].item_number,
          ReceivingNo: mockReceivingData[0].receiving_no,
          checkboxes: {
              "Material placed in storage as documented above": true,
              "Supporting documentation received attached": true,
              "Purchase Order": true,
              "Packing Slip": true
          },
          selectedDateType: 'Expiration Date',
          dateValue: '12/31/2024'
      }));
    }
  }, []);

  const handleItemSelect = (selectedItemNo) => {
    const selectedItem = itemOptions.find(item => item.item_number === selectedItemNo);
    if (selectedItem) {
      setSelectedItemData(selectedItem);
      setFormData(prev => ({
        ...prev,
        ItemNo: selectedItem.item_number
      }));
    }
  };

  const handleReceivingSelect = (selectedReceivingNo) => {
    const selectedReceiving = receivingOptions.find(
      rec => rec.receiving_no === selectedReceivingNo
    );
    if (selectedReceiving) {
      setSelectedReceivingData(selectedReceiving);
      setFormData(prev => ({
        ...prev,
        ReceivingNo: selectedReceiving.receiving_no
      }));
    }
  };

  const handleCheckboxChange = (section, name) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: !prev[section][name]
      }
    }));
  };

  const handleDateTypeChange = (dateType) => {
    setFormData(prev => ({
      ...prev,
      selectedDateType: prev.selectedDateType === dateType ? '' : dateType,
      dateValue: prev.selectedDateType === dateType ? '' : prev.dateValue
    }));
  };

//   const handleGeneratePDF = async (e) => {
//     e.preventDefault();

//     // Create form data from selected mock data
//     const selectedItem = itemOptions.find(item => item.item_number === formData.ItemNo);
//     const selectedReceiving = receivingOptions.find(rec => rec.receiving_no === formData.ReceivingNo);

//     if (!selectedItem || !selectedReceiving) {
//         toast.error('Please select both Item Number and Receiving Number');
//         return;
//     }

//     // Prepare data for PDF generation
//     const pdfData = {
//         'Item No.': selectedItem?.item_number || '',
//         'Item Description': selectedItem?.description || '',
//         'Client Name': selectedItem?.client || '',
//         'Protocol No.': selectedItem?.protocol_number || '',
//         'Vendor': selectedItem?.vendor || '',
//         'UoM': selectedItem?.uom || '',
//         'Storage Conditions:Temperature': selectedItem?.temp_storage_conditions || '',
//         'Other': selectedItem?.other_storage_conditions || '',
        
//         // Receiving data
//         'RN': selectedReceiving?.receiving_no || '',
//         'Tracking No.': selectedReceiving?.tracking_number || '',
//         'Lot No.': selectedReceiving?.lot_no || '',
//         'PO No.': selectedReceiving?.po_no || '',
//         'Total Units (vendor count)': selectedReceiving?.total_units_vendor || '',
//         'Total Storage Containers': selectedReceiving?.total_storage_containers || '',
        
//         // Form checkboxes
//         'Material placed in storage': formData.checkboxes['Material placed in storage as documented above'] || false,
//         'Discrepancies documented': formData.checkboxes['Discrepancies and/or damaged documented on the shipping paperwork'] || false,
//         'Supporting documentation': formData.checkboxes['Supporting documentation received attached'] || false,
//         'Shipment REJECTED': formData.checkboxes['Shipment REJECTED. Reason documented on the shipping paperwork'] || false,
        
//         // Document verification
//         'Purchase Order': formData.checkboxes['Purchase Order'] || false,
//         'Packing Slip': formData.checkboxes['Packing Slip'] || false,
//         'Bill of Lading': formData.checkboxes['Bill of Lading'] || false,
//         'CoC/CoA': formData.checkboxes['CoC/CoA'] || false,
//         'SDS #': formData.checkboxes['SDS #'] || false,
//         'Invoice': formData.checkboxes['Invoice'] || false,
//         'Other (Specify)': formData.checkboxes['Other (Specify)'] || false,

//         // Date information
//         [formData.selectedDateType]: formData.dateValue || '',
        
//         // NCMR Status
//         'NCMR': selectedReceiving?.ncmr || 'N/A',
//         'Comments': selectedReceiving?.comments_for_520b || ''
//     };

//     try {
//       const response = await api.post('/form/generate-pdf/520B', pdfData, {
//           responseType: 'blob'
//       });

//       // Create blob and download
//       const file = new Blob([response.data], { type: 'application/pdf' });
//       const fileURL = URL.createObjectURL(file);
//       const link = document.createElement('a');
//       link.href = fileURL;
//       link.download = `520B_${pdfData.ReceivingNo}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       URL.revokeObjectURL(fileURL);

//       // Mock PDF generation for now
//       toast.success('PDF Generated Successfully');
//     } catch (error) {
//       console.error('PDF Data being sent:', pdfData);
//       console.error('Error generating PDF:', error);
//       toast.error('Failed to generate PDF');
//     }
// };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();

    const selectedItem = itemOptions.find(item => item.item_number === formData.ItemNo);
    const selectedReceiving = receivingOptions.find(rec => rec.receiving_no === formData.ReceivingNo);

    const pdfData = {
        'Item No': formData.ItemNo,
        'Tracking No': formData.TrackingNo,
        'Client Name': selectedItem?.client || '',
        'Item Description': selectedItem?.description || '',
        'Storage Conditions:Temperature': selectedItem?.temp_storage_conditions || '',
        'Other': selectedItem?.other_storage_conditions || '',
        'RN': formData.ReceivingNo,
        'PO No': formData.PO_No,
        'Protocol No': selectedItem?.protocol_number || '',
        'Vendor': selectedItem?.vendor || '',
        'UoM': selectedItem?.uom || '',
        'Total Units (vendor count)': selectedReceiving?.total_units_vendor || '',
        'Total Storage Containers': selectedReceiving?.total_storage_containers || '',
        'Lot No': selectedReceiving?.lot_no || '',
        
        // Checkboxes for delivery acceptance
        'Material placed in storage as documented above': formData.checkboxes['Material placed in storage as documented above'] || false,
        'Discrepancies and/or damaged documented on the shipping paperwork': formData.checkboxes['Discrepancies and/or damaged documented on the shipping paperwork'] || false,
        'Supporting documentation received attached': formData.checkboxes['Supporting documentation received attached'] || false,
        'Shipment REJECTED. Reason documented on the shipping paperwork': formData.checkboxes['Shipment REJECTED. Reason documented on the shipping paperwork'] || false,

        // Document verification checkboxes
        'Purchase Order': formData.checkboxes['Purchase Order'] || false,
        'Packing Slip': formData.checkboxes['Packing Slip'] || false,
        'Bill of Lading': formData.checkboxes['Bill of Lading'] || false,
        'CoC/CoA': formData.checkboxes['CoC/CoA'] || false,
        'SDS #': formData.checkboxes['SDS #'] || false,
        'Invoice': formData.checkboxes['Invoice'] || false,
        'Other (Specify)': formData.checkboxes['Other (Specify)'] || false,

        // Date type and value
        [formData.selectedDateType]: formData.dateValue,
        
        // NCMR and comments
        'NCMR': selectedReceiving?.ncmr || 'N/A',
        'Comments': formData.comments || ''
    };

    console.log('Sending PDF data:', pdfData);

    try {
        const response = await api.post('/form/generate-pdf/520B', pdfData, {
            responseType: 'blob'
        });

        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileURL;
        link.download = `520B_${formData.ReceivingNo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(fileURL);

        toast.success('PDF generated successfully!');
    } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <form onSubmit={handleGeneratePDF} className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Generate Form 520B</h2>

        <div className="space-y-6">
          {/* Dropdowns Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Number
              </label>
              <select
                value={formData.ItemNo}
                onChange={(e) => handleItemSelect(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Item Number</option>
                {itemOptions.map(item => (
                  <option key={item.item_number} value={item.item_number}>
                    {item.item_number} - {item.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Receiving Number
              </label>
              <select
                value={formData.ReceivingNo}
                onChange={(e) => handleReceivingSelect(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select Receiving Number</option>
                {receivingOptions.map(rec => (
                  <option key={rec.receiving_no} value={rec.receiving_no}>
                    {rec.receiving_no}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Document Verification Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Verified the following Receiving Documents:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData.documentVerification).map(item => (
                <div key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.documentVerification[item]}
                    onChange={() => handleCheckboxChange('documentVerification', item)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{item}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Issues Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Check all that apply and explain in the comments section:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.keys(formData.issuesSection).map(item => (
                <div key={item} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.issuesSection[item]}
                    onChange={() => handleCheckboxChange('issuesSection', item)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">{item}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Section */}
          <div className="space-y-4">
            <div className="flex space-x-6">
              {['Expiration Date', 'Retest Date', 'Use-by-Date'].map(dateType => (
                <label key={dateType} className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.selectedDateType === dateType}
                    onChange={() => handleDateTypeChange(dateType)}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dateType}</span>
                </label>
              ))}
            </div>
            {formData.selectedDateType && (
              <input
                type="text"
                placeholder="MM/DD/YYYY"
                value={formData.dateValue}
                onChange={(e) => setFormData(prev => ({ ...prev, dateValue: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Generate PDF
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Form520B;