// src/components/GeneratePDF.js
import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const GeneratePDF = ({ formType }) => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    checkboxes: {}  // State to track checkbox selections
  });
  const [itemOptions, setItemOptions] = useState([]);
  const [receivingOptions, setReceivingOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const itemResponse = await axios.get('/item/numbers');
        const receivingResponse = await axios.get('/receiving/numbers');
        setItemOptions(itemResponse.data);
        setReceivingOptions(receivingResponse.data);
      } catch (error) {
        console.error("Error fetching options:", error);
      }
    };
    fetchOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      checkboxes: { ...prevFormData.checkboxes, [name]: checked }
    }));
  };

  const handleGeneratePDF = (e) => {
    e.preventDefault();
    axios.post(`/form/generate-pdf/${formType}`, formData, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${formType}_filled.pdf`);
        document.body.appendChild(link);
        link.click();
      })
      .catch(error => console.error("Error generating PDF:", error));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleGeneratePDF} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-center mb-4">Generate PDF for {formType}</h2>

        {/* Item No Dropdown */}
        <div className="space-y-2">
          <label htmlFor="ItemNo" className="block text-sm font-medium text-gray-700">Select Item No:</label>
          <select
            name="ItemNo"
            value={formData.ItemNo}
            onChange={handleInputChange}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select an Item No</option>
            {itemOptions.map(item => (
              <option key={item.item_number} value={item.item_number}>
                {item.item_number}
              </option>
            ))}
          </select>
        </div>

        {/* Receiving No Dropdown */}
        <div className="space-y-2">
          <label htmlFor="ReceivingNo" className="block text-sm font-medium text-gray-700">Select Receiving No:</label>
          <select
            name="ReceivingNo"
            value={formData.ReceivingNo}
            onChange={handleInputChange}
            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Select a Receiving No</option>
            {receivingOptions.map(receiving => (
              <option key={receiving.receiving_no} value={receiving.receiving_no}>
                {receiving.receiving_no}
              </option>
            ))}
          </select>
        </div>

        {/* Checkbox Options for Form 520B */}
        {formType === "520B" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Options:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Dual-option checkboxes */}
              {[
                "Material placed in storage as documented above",
                "Discrepancies and/or damaged documented on the shipping paperwork",
                "Supporting documentation received attached",
                "Shipment REJECTED. Reason documented on the shipping paperwork"
              ].map(option => (
                <div key={option} className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name={option}
                      onChange={handleCheckboxChange}
                      className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">{option}</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name={`${option} - N/A`}
                      onChange={handleCheckboxChange}
                      className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label className="text-sm text-gray-700">N/A</label>
                  </div>
                </div>
              ))}

              {/* Single-option checkboxes */}
              {[
                "Purchase Order",
                "Packing Slip",
                "Quantity discrepancies found",
                "Bill of Lading",
                "CoC/CoA",
                "Damage to shipping container(s)",
                "SDS #",
                "Invoice",
                "Damage to product within shipping container",
                "Other (Specify)",
                "Temperature excursion",
                "Expiration Date",
                "Retest Date",
                "Use-by-Date"
              ].map(option => (
                <div key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    name={option}
                    onChange={handleCheckboxChange}
                    className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">{option}</label>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md shadow-md font-medium"
        >
          Generate PDF
        </button>
      </form>
    </div>
  );
};

export default GeneratePDF;
