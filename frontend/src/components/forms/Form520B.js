// src/components/forms/Form520B.js
import React, { useState, useEffect } from 'react';
import axios from '../../api/axios'; // Adjust path to correctly locate axios.js

import { toast } from 'react-toastify';

const Form520B = () => {
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: '',
    checkboxes: {},
    selectedDateType: '',
    dateValue: ''
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

  const handleDateCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      selectedDateType: checked ? name : '',
      checkboxes: { ...prevFormData.checkboxes, [name]: checked }
    }));
  };

  const handleGeneratePDF = (e) => {
    e.preventDefault();
    axios.post(`/form/generate-pdf/520B`, formData, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `520B_filled.pdf`);
        document.body.appendChild(link);
        link.click();
        toast.success(`PDF for form 520B generated successfully!`);
      })
      .catch(error => console.error("Error generating PDF:", error));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleGeneratePDF} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-center mb-4">Generate PDF for 520B</h2>

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

        {/* Verified the following Receiving Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verified the following Receiving Documents: (Check all that apply)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Verified the following Receiving Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Verified the following Receiving Documents:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Purchase Order",
              "Packing Slip",
              "Bill of Lading",
              "CoC/CoA",
              "SDS #",
              "Invoice",
              "Other (Specify)"
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

        {/* Check all that apply and explain in the comments section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Check all that apply and explain in the comments section:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              "Quantity discrepancies found",
              "Damage to shipping container(s)",
              "Damage to product within shipping container",
              "Temperature excursion"
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

        {/* Grouped Date Checkboxes */}
        <div className="flex items-center space-x-4">
          {["Expiration Date", "Retest Date", "Use-by-Date"].map(option => (
            <div key={option} className="flex items-center">
              <input
                type="checkbox"
                name={option}
                onChange={handleDateCheckboxChange}
                checked={formData.selectedDateType === option}
                className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">{option}</label>
            </div>
          ))}
        </div>

        {/* Date Input */}
        {formData.selectedDateType && (
          <div className="mt-4">
            <label htmlFor="dateValue" className="block text-sm font-medium text-gray-700">
              Enter {formData.selectedDateType} (MM/DD/YYYY):
            </label>
            <input
              type="text"
              name="dateValue"
              value={formData.dateValue}
              onChange={(e) => setFormData({ ...formData, dateValue: e.target.value })}
              placeholder="MM/DD/YYYY"
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
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

export default Form520B;
