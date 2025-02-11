// src/components/forms/Form501A.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';

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

      const itemOpts = itemResponse.data.map(item => ({
        value: item.item_number,
        label: `${item.item_number} - ${item.description}`
      }));

      const receivingOpts = receivingResponse.data.map(rec => ({
        value: rec.receiving_no,
        label: rec.receiving_no
      }));

      setItemOptions(itemOpts);
      setReceivingOptions(receivingOpts);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Error loading data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/item/get/${selectedValue}`);
      setSelectedItemData(response.data);
      setFormData(prev => ({
        ...prev,
        ItemNo: selectedValue,
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

  const handleReceivingSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/receiving/get/${selectedValue}`);
      setSelectedReceivingData(response.data);
      setFormData(prev => ({
        ...prev,
        ReceivingNo: selectedValue,
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              label="Item Number"
              options={itemOptions}
              value={formData.ItemNo}
              onChange={handleItemSelect}
              placeholder="Search item number..."
              required
            />

            <SearchableSelect
              label="Receiving Number"
              options={receivingOptions}
              value={formData.ReceivingNo}
              onChange={handleReceivingSelect}
              placeholder="Search receiving number..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Description</label>
              <input
                type="text"
                value={formData.itemDescription}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Controlled Substance</label>
              <input
                type="text"
                value={formData.controlledSubstance}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lot Number</label>
              <input
                type="text"
                value={formData.lotNo}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Conditions</label>
              <input
                type="text"
                value={formData.storageConditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Storage Conditions</label>
              <input
                type="text"
                value={formData.otherStorageConditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location by Status:</h3>
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