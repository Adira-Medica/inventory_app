// src/components/forms/Form501A.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';

const Form501A = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    itemDescription: '',
    clientName: '',
    vendorName: '',
    lotNo: '',
    storageConditions: '',
    otherStorageConditions: '',
    totalUnitsReceived: '',
    controlledSubstance: '',
    locationStatus: {
      quarantine: false,
      rejected: false,
      released: false
    },
    dateType: '',
    dateValue: '',
    comments: ''
  });

  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [selectedReceivingData, setSelectedReceivingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
        ItemNo: selectedItemNo,
        itemDescription: response.data.description,
        clientName: response.data.client,
        vendorName: response.data.vendor,
        storageConditions: response.data.temp_storage_conditions,
        otherStorageConditions: response.data.other_storage_conditions,
        controlledSubstance: response.data.controlled
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
        ReceivingNo: selectedReceivingNo,
        lotNo: response.data.lot_no,
        totalUnitsReceived: response.data.total_units_received
      }));
    } catch (error) {
      console.error("Error fetching receiving details:", error);
      toast.error("Error loading receiving details");
    }
  };

  const handleLocationStatusChange = (status) => {
    setFormData(prev => ({
      ...prev,
      locationStatus: {
        ...prev.locationStatus,
        [status]: !prev.locationStatus[status]
      }
    }));
  };

  const handleDateTypeChange = (dateType) => {
    setFormData(prev => ({
      ...prev,
      dateType: prev.dateType === dateType ? '' : dateType,
      dateValue: prev.dateType === dateType ? '' : prev.dateValue
    }));
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    
    if (!selectedItemData || !selectedReceivingData) {
      toast.error('Please select both Item Number and Receiving Number');
      return;
    }

    try {
      const response = await api.post('/form/generate-pdf/501A', formData, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `501A_${formData.ReceivingNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);

      toast.success('PDF Generated Successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
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
        <h2 className="text-2xl font-bold text-center mb-6">Generate Form 501A</h2>
        
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

          {/* Location Status Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Location by Status:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['quarantine', 'rejected', 'released'].map(status => (
                <div key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.locationStatus[status]}
                    onChange={() => handleLocationStatusChange(status)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700 capitalize">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Date Type:
            </h3>
            <div className="flex space-x-6">
              {['Expiration Date', 'Retest Date', 'Use-By-Date'].map(dateType => (
                <label key={dateType} className="flex items-center">
                  <input
                    type="radio"
                    checked={formData.dateType === dateType}
                    onChange={() => handleDateTypeChange(dateType)}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{dateType}</span>
                </label>
              ))}
            </div>
            
            {formData.dateType && (
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

export default Form501A;