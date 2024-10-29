// src/components/forms/Form519A501A.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'react-toastify';

const Form519A501A = () => {
  const { formType } = useParams(); // use formType to differentiate between forms
  const [formData, setFormData] = useState({
    ItemNo: '',
    ReceivingNo: ''
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
        toast.success(`${formType} PDF generated successfully!`);
      })
      .catch(error => console.error("Error generating PDF:", error));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleGeneratePDF} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl space-y-6">
        <h2 className="text-2xl font-bold text-center mb-4">Generate PDF for Form {formType}</h2>

        {/* Item No Dropdown */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Item No:</label>
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
          <label className="block text-sm font-medium text-gray-700">Select Receiving No:</label>
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

        <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md">Generate PDF</button>
      </form>
    </div>
  );
};

export default Form519A501A;
