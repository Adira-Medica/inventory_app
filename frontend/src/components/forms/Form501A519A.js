import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const Form501A519A = () => {
  const { formType } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemNo: '',
    receivingNo: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Add your form submission logic here
      toast.success(`Form ${formType} generated successfully!`);
      navigate('/');
    } catch (error) {
      toast.error('Error generating form');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Generate Form {formType}</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Item Number"
              className="w-full p-2 border rounded"
              value={formData.itemNo}
              onChange={(e) => setFormData({...formData, itemNo: e.target.value})}
            />
            <input
              type="text"
              placeholder="Receiving Number"
              className="w-full p-2 border rounded"
              value={formData.receivingNo}
              onChange={(e) => setFormData({...formData, receivingNo: e.target.value})}
            />
          </div>
          <div className="mt-6">
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
              Generate PDF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Form501A519A;
