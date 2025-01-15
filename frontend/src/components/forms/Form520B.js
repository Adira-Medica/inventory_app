// src/components/forms/Form520B.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const Form520B = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    checkboxes: {},
    selectedDateType: '',
    dateValue: '',
    comments: '',
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setIsLoading(true);
      const [itemResponse, receivingResponse] = await Promise.all([
        api.get('/item/numbers'),
        api.get('/receiving/numbers')
      ]);

      setItemOptions(itemResponse.data);
      setReceivingOptions(receivingResponse.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = async (selectedItemNo) => {
    try {
      const response = await api.get(`/item/get/${selectedItemNo}`);
      setSelectedItemData(response.data);
      setFormData(prev => ({
        ...prev,
        ItemNo: selectedItemNo
      }));
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Error loading item details");
    }
  };

  const handleReceivingSelect = async (selectedReceivingNo) => {
    try {
      const response = await api.get(`/receiving/get/${selectedReceivingNo}`);
      setSelectedReceivingData(response.data);
      setFormData(prev => ({
        ...prev,
        ReceivingNo: selectedReceivingNo
      }));
    } catch (error) {
      console.error("Error fetching receiving details:", error);
      toast.error("Error loading receiving details");
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

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    
    if (!selectedItemData || !selectedReceivingData) {
      toast.error('Please select both Item Number and Receiving Number');
      return;
    }

    try {
      setIsSubmitting(true);
      const pdfData = {
        'Item No': formData.ItemNo,
        'Tracking No': selectedReceivingData.tracking_number,
        'Client Name': selectedItemData.client,
        'Item Description': selectedItemData.description,
        'Storage Conditions:Temperature': selectedItemData.temp_storage_conditions,
        'Other': selectedItemData.other_storage_conditions,
        'RN': formData.ReceivingNo,
        'Lot No': selectedReceivingData.lot_no,
        'PO No': selectedReceivingData.po_no,
        'Protocol No': selectedItemData.protocol_number,
        'Vendor': selectedItemData.vendor,
        'UoM': selectedItemData.uom,
        'Total Units (vendor count)': selectedReceivingData.total_units_vendor,
        'Total Storage Containers': selectedReceivingData.total_storage_containers,

        // Checkboxes
        ...Object.entries(formData.deliveryAcceptance).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {}),
        ...Object.entries(formData.documentVerification).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {}),
        ...Object.entries(formData.issuesSection).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: value
        }), {}),

        // Date information
        [formData.selectedDateType]: formData.dateValue,

        // Additional data
        'NCMR': selectedReceivingData.ncmr || 'N/A',
        'Comments': formData.comments || ''
      };

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

      toast.success('PDF Generated Successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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

          {/* Comments Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                bg-indigo-600 text-white px-4 py-2 rounded-md 
                hover:bg-indigo-700 focus:outline-none focus:ring-2 
                focus:ring-indigo-500 
                ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? 'Generating PDF...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Form520B;