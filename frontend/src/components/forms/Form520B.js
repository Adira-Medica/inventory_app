// src/components/forms/Form520B.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';
import BackButton from '../common/BackButton';

const Form520B = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    TrackingNo: '',
    ClientName: '',
    ItemDescription: '',
    StorageConditionsTemperature: '',
    Other: '',
    RN: '',
    LotNo: '',
    PONo: '',
    ProtocolNo: '',
    Vendor: '',
    UoM: '',
    TotalUnits: '',
    TotalStorageContainers: '',
    selectedDateType: '',
    dateValue: '',
    deliveryAcceptance: {
      material_placed: 'na',
      discrepancies: 'na',
      supporting_docs: 'na',
      shipment_rejected: 'na'
    },
    deliveryCompletedBy: '',
    receivedBy: '', // Changed from receivingCompletedBy
    documentVerification: {
      'Purchase Order': false,
      'Packing Slip': false,
      'Bill of Lading': false,
      'CoC/CoA': false,
      'SDS #': false,
      'Invoice': false,
      'Other (Specify)': false
    },
    issuesSection: {
      'Quantity discrepancies found': false,
      'Damage to shipping container(s)': false,
      'Damage to product within shipping container': false,
      'Temperature excursion': false
    },
    NCMR: 'N/A',
    Comments: ''
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
     
      // Filter out obsoleted items
      const itemOpts = itemResponse.data
        .filter(item => !item.is_obsolete) // Filter out obsoleted items
        .map(item => ({
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
        ItemDescription: response.data.description,
        ClientName: response.data.client,
        Vendor: response.data.vendor,
        StorageConditionsTemperature: response.data.temp_storage_conditions,
        Other: response.data.other_storage_conditions,
        UoM: response.data.uom,
        ProtocolNo: response.data.protocol_number
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
        RN: selectedValue,
        LotNo: response.data.lot_no,
        PONo: response.data.po_no,
        TrackingNo: response.data.tracking_number,
        TotalUnits: response.data.total_units_vendor,
        TotalStorageContainers: response.data.total_storage_containers
      }));
    } catch (error) {
      console.error("Error fetching receiving details:", error);
      toast.error("Error loading receiving details");
    }
  };

  const handleDeliveryOptionChange = (field, value) => {
    setFormData(prev => {
      const updatedDeliveryAcceptance = {...prev.deliveryAcceptance};
      
      // Reset all values for this field
      updatedDeliveryAcceptance[field] = value;
      
      // Update specific yes/no flags for the template
      if (field === 'material_placed') {
        updatedDeliveryAcceptance.material_placed_yes = value === 'yes';
        updatedDeliveryAcceptance.material_placed_no = value === 'no';
      } else if (field === 'discrepancies') {
        updatedDeliveryAcceptance.discrepancies_yes = value === 'yes';
        updatedDeliveryAcceptance.discrepancies_no = value === 'no';
      } else if (field === 'supporting_docs') {
        updatedDeliveryAcceptance.supporting_docs_yes = value === 'yes';
        updatedDeliveryAcceptance.supporting_docs_no = value === 'no';
      } else if (field === 'shipment_rejected') {
        updatedDeliveryAcceptance.shipment_rejected_yes = value === 'yes';
        updatedDeliveryAcceptance.shipment_rejected_no = value === 'no';
      }
      
      return {
        ...prev,
        deliveryAcceptance: updatedDeliveryAcceptance
      };
    });
  };

  const handleDateTypeChange = (dateType) => {
    setFormData(prev => ({
      ...prev,
      selectedDateType: prev.selectedDateType === dateType ? '' : dateType,
      dateValue: prev.selectedDateType === dateType ? '' : prev.dateValue
    }));
  };

  const handleDocumentVerificationChange = (field) => {
    setFormData(prev => ({
      ...prev,
      documentVerification: {
        ...prev.documentVerification,
        [field]: !prev.documentVerification[field]
      }
    }));
  };

  const handleIssuesSectionChange = (field) => {
    setFormData(prev => ({
      ...prev,
      issuesSection: {
        ...prev.issuesSection,
        [field]: !prev.issuesSection[field]
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
      const pdfData = {
        'Item No': formData.ItemNo,
        'Tracking No': formData.TrackingNo,
        'Client Name': formData.ClientName,
        'Item Description': formData.ItemDescription,
        'Storage Conditions:Temperature': formData.StorageConditionsTemperature,
        'Other': formData.Other,
        'RN': formData.RN,
        'Lot No': formData.LotNo,
        'PO No': formData.PONo,
        'Protocol No': formData.ProtocolNo,
        'Vendor': formData.Vendor,
        'UoM': formData.UoM,
        'Total Units (vendor count)': formData.TotalUnits,
        'Total Storage Containers': formData.TotalStorageContainers,
        'deliveryAcceptance': formData.deliveryAcceptance,
        'deliveryCompletedBy': formData.deliveryCompletedBy,
        'receivedBy': formData.receivedBy,
        'selectedDateType': formData.selectedDateType,
        'dateValue': formData.dateValue,
        'receivingCompletedBy': formData.receivedBy,
        'documentVerification': formData.documentVerification,
        'issuesSection': formData.issuesSection,
        'NCMR': formData.NCMR,
        'Comments': formData.Comments
      };

      const response = await api.post('/form/generate-pdf/520B', pdfData, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `520B_${formData.RN}.pdf`;
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
      <form onSubmit={handleGeneratePDF} className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-center mb-6">CTM Material Receiving Report (Form 520B)</h2>
        <BackButton />
        <div className="space-y-6">
          {/* Item and Receiving Selection */}
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
              <input
                type="text"
                value={formData.TrackingNo}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                type="text"
                value={formData.ClientName}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Item Description</label>
              <textarea
                value={formData.ItemDescription}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Conditions: Temperature</label>
              <input
                type="text"
                value={formData.StorageConditionsTemperature}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other</label>
              <input
                type="text"
                value={formData.Other}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
          </div>

          {/* Delivery Acceptance Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Acceptance</h3>
            <div className="grid grid-cols-1 gap-4">
              {[
                { label: 'Material placed in storage as documented above', field: 'material_placed' },
                { label: 'Discrepancies and/or damaged documented on the shipping paperwork', field: 'discrepancies' },
                { label: 'Supporting documentation received attached', field: 'supporting_docs' },
                { label: 'Shipment REJECTED. Reason documented on the shipping paperwork', field: 'shipment_rejected' }
              ].map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between bg-gray-50 p-4 rounded">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name={field}
                        value="na"
                        checked={formData.deliveryAcceptance[field] === 'na'}
                        onChange={() => handleDeliveryOptionChange(field, 'na')}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2">N/A</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name={field}
                        value="no"
                        checked={formData.deliveryAcceptance[field] === 'no'}
                        onChange={() => handleDeliveryOptionChange(field, 'no')}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2">No</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name={field}
                        value="yes"
                        checked={formData.deliveryAcceptance[field] === 'yes'}
                        onChange={() => handleDeliveryOptionChange(field, 'yes')}
                        className="form-radio h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2">Yes</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Completed By (Name and Initials)/Date:
              </label>
              <input
                type="text"
                value={formData.deliveryCompletedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryCompletedBy: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300"
              />
            </div>
          </div>

          {/* Receiving Report Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Receiving Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">RN</label>
                <input
                  type="text"
                  value={formData.RN}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Lot No.</label>
                <input
                  type="text"
                  value={formData.LotNo}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">PO No.</label>
                <input
                  type="text"
                  value={formData.PONo}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Protocol No.</label>
                <input
                  type="text"
                  value={formData.ProtocolNo}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">UOM</label>
                <input
                  type="text"
                  value={formData.UoM}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Units</label>
                <input
                  type="text"
                  value={formData.TotalUnits}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Storage Containers</label>
                <input
                  type="text"
                  value={formData.TotalStorageContainers}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Date Selection Section - MODIFIED TO HORIZONTAL ROW */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex flex-wrap items-center space-x-8">
                {['Expiry Date', 'Retest Date', 'Use-by-Date'].map(dateType => (
                  <label key={dateType} className="inline-flex items-center space-x-2">
                    <input
                      type="radio"
                      name="dateType"
                      checked={formData.selectedDateType === dateType}
                      onChange={() => handleDateTypeChange(dateType)}
                      className="form-radio h-4 w-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">{dateType}</span>
                  </label>
                ))}
                
                {formData.selectedDateType && (
                  <div className="ml-auto">
                    <input
                      type="date"
                      value={formData.dateValue}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateValue: e.target.value }))}
                      className="rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Document Verification and Issues Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Document Verification</h3>
              <div className="space-y-2">
                {Object.keys(formData.documentVerification).map(doc => (
                  <div key={doc} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.documentVerification[doc]}
                      onChange={() => handleDocumentVerificationChange(doc)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">{doc}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Issues</h3>
              <div className="space-y-2">
                {Object.keys(formData.issuesSection).map(issue => (
                  <div key={issue} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.issuesSection[issue]}
                      onChange={() => handleIssuesSectionChange(issue)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">{issue}</label>
                  </div>
                ))}
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">NCMR:</label>
                  <input
                    type="text"
                    value={formData.NCMR}
                    onChange={(e) => setFormData(prev => ({ ...prev, NCMR: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comments
            </label>
            <textarea
              value={formData.Comments}
              onChange={(e) => setFormData(prev => ({ ...prev, Comments: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
              rows={3}
            />
          </div>

          {/* Received By Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Received By (Name and Initials)/Date:
            </label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300"
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

export default Form520B;