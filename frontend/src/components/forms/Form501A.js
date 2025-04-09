import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axios';
import SearchableSelect from '../common/SearchableSelect';
import BackButton from '../common/BackButton';

const Form501A = () => {
  const [formData, setFormData] = useState({
    receiving_no: '',
    item_no: '',
    item_description: '',
    client_name: '',
    vendor_name: '',
    lot_no: '',
    storage_conditions: '',
    other_storage_conditions: '',
    total_units_received: '',
    controlled_substance: '',
    locationStatus: {
      quarantine: true, // Set quarantine to true by default
      rejected: false,
      released: false
    },
    dateType: '',
    dateValue: '',
    completedBy: '',
    transactions: [
      {
        date: '',
        reason: 'Initial Receipt', // Default reason for first transaction
        transactionType: 'In',      // Default transaction type for first entry
        quantity: '',
        balance: '',
        balanceLocation: 'Quarantine', // Default location for first entry
        enteredBy: ''
      }
    ],
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
        item_no: selectedValue,
        item_description: response.data.description,
        client_name: response.data.client,
        vendor_name: response.data.vendor,
        storage_conditions: response.data.temp_storage_conditions,
        other_storage_conditions: response.data.other_storage_conditions,
        controlled_substance: response.data.controlled
      }));
    } catch (error) {
      console.error("Error fetching item details:", error);
      toast.error("Error loading item details");
    }
  };

  const handleReceivingSelect = async (selectedValue) => {
    try {
      const response = await api.get(`/receiving/get/${selectedValue}`);
      console.log('Receiving data:', response.data);
      setSelectedReceivingData(response.data);
     
      // Calculate units based on the format "quantity UOM"
      const totalUnitsReceived = `${response.data.total_units_received || ''} ${selectedItemData?.uom || ''}`;
      
      setFormData(prev => {
        // Create updated transactions with the first transaction set to initial receipt
        const updatedTransactions = [...prev.transactions];
        updatedTransactions[0] = {
          ...updatedTransactions[0],
          quantity: response.data.total_units_received || '',
          balance: response.data.total_units_received || '',
          date: new Date().toISOString().split('T')[0] // Set today's date
        };
        
        return {
          ...prev,
          receiving_no: selectedValue,
          lot_no: response.data.lot_no,
          total_units_received: totalUnitsReceived,
          transactions: updatedTransactions
        };
      });
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

  const handleTransactionChange = (index, field, value) => {
    const newTransactions = [...formData.transactions];
    newTransactions[index][field] = value;

    // Special handling for transaction type - calculate running balance
    if (field === 'transactionType' || field === 'quantity') {
      calculateRunningBalance(newTransactions, index);
    }

    setFormData(prev => ({
      ...prev,
      transactions: newTransactions
    }));
  };

  // Calculate running balance for all transactions
  const calculateRunningBalance = (transactions, changedIndex) => {
    // Skip if we don't have the first transaction's quantity yet
    if (!transactions[0].quantity) return;

    let runningBalance = parseInt(transactions[0].quantity) || 0;
    transactions[0].balance = runningBalance.toString();

    // Calculate running balance for subsequent transactions
    for (let i = 1; i < transactions.length; i++) {
      const transaction = transactions[i];
      const qty = parseInt(transaction.quantity) || 0;
      
      if (transaction.transactionType === 'In') {
        runningBalance += qty;
      } else if (transaction.transactionType === 'Out') {
        runningBalance -= qty;
      }
      // 'Adjust' type would directly set the new quantity
      else if (transaction.transactionType === 'Adjust') {
        runningBalance = qty;
      }
      
      // Update the balance field
      transaction.balance = runningBalance.toString();
    }
  };

  // Add a new transaction row
  const addTransaction = () => {
    setFormData(prev => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        {
          date: '',
          reason: '',
          transactionType: '',
          quantity: '',
          balance: '',
          balanceLocation: '',
          enteredBy: ''
        }
      ]
    }));
  };

  // Remove a transaction row
  const removeTransaction = (index) => {
    // Prevent removing the first transaction
    if (index === 0) {
      toast.warning("Cannot remove the initial transaction");
      return;
    }

    const newTransactions = formData.transactions.filter((_, i) => i !== index);
    
    // Recalculate balances
    setFormData(prev => {
      const updatedFormData = {
        ...prev,
        transactions: newTransactions
      };
      
      // Recalculate balances after removing a transaction
      calculateRunningBalance(updatedFormData.transactions, 0);
      
      return updatedFormData;
    });
  };

  const handleGeneratePDF = async (e) => {
    e.preventDefault();
    if (!selectedItemData || !selectedReceivingData) {
      toast.error('Please select both Item Number and Receiving Number');
      return;
    }

    try {
      const pdfData = {
        'receiving_no': formData.receiving_no,
        'item_no': formData.item_no,
        'item_description': selectedItemData.description,
        'client_name': selectedItemData.client,
        'vendor_name': selectedItemData.vendor,
        'lot_no': selectedReceivingData.lot_no,
        'storage_conditions': selectedItemData.temp_storage_conditions,
        'other_storage_conditions': selectedItemData.other_storage_conditions,
        'total_units_received': formData.total_units_received,
        'controlled_substance': selectedItemData.controlled,
        'locationStatus': {
          quarantine: formData.locationStatus.quarantine,
          rejected: formData.locationStatus.rejected,
          released: formData.locationStatus.released
        },
        'dateType': formData.dateType,
        'dateValue': formData.dateValue,
        'completedBy': formData.completedBy,
        'transactions': formData.transactions.filter(t => 
          // Filter out empty transactions
          t.date || t.reason || t.transactionType || t.quantity || t.balance || t.balanceLocation || t.enteredBy
        ),
        'comments': formData.comments
      };

      const response = await api.post('/form/generate-pdf/501A', pdfData, {
        responseType: 'blob'
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.download = `501A_${formData.receiving_no}.pdf`;
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
        <h2 className="text-2xl font-bold text-center mb-6">CTM Inventory Record (Form 501A)</h2>
        <BackButton />
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SearchableSelect
              label="Item Number"
              options={itemOptions}
              value={formData.item_no}
              onChange={handleItemSelect}
              placeholder="Search item number..."
              required
            />
            <SearchableSelect
              label="Receiving Number"
              options={receivingOptions}
              value={formData.receiving_no}
              onChange={handleReceivingSelect}
              placeholder="Search receiving number..."
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Item Description</label>
              <textarea
                value={formData.item_description}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Client Name</label>
              <input
                type="text"
                value={formData.client_name}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
              <input
                type="text"
                value={formData.vendor_name}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lot Number</label>
              <input
                type="text"
                value={formData.lot_no}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Storage Conditions</label>
              <input
                type="text"
                value={formData.storage_conditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Other Storage Conditions</label>
              <textarea
                value={formData.other_storage_conditions}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Controlled Substance</label>
              <input
                type="text"
                value={formData.controlled_substance}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Units Received/UOM</label>
              <input
                type="text"
                value={formData.total_units_received}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
              />
            </div>
          </div>
          {/* Location Status Section */}
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
          {/* Date Selection Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {['Expiration Date', 'Retest Date', 'Use-by-Date'].map(dateType => (
                <label key={dateType} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="dateType"
                    checked={formData.dateType === dateType}
                    onChange={() => handleDateTypeChange(dateType)}
                    className="h-4 w-4 text-indigo-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{dateType}</span>
                </label>
              ))}
            </div>
            {formData.dateType && (
              <div className="mt-2">
                <input
                  type="date"
                  value={formData.dateValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateValue: e.target.value }))}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}
          </div>
          {/* Completed By Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Completed By (Name and Initials)/Date:
            </label>
            <input
              type="text"
              value={formData.completedBy}
              onChange={(e) => setFormData(prev => ({ ...prev, completedBy: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {/* Transaction Table */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Transactions</h3>
              <button
                type="button"
                onClick={addTransaction}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Transaction
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Transaction<br/>(In/Out/Adjust)</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Balance Location</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entered By/Initials</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.transactions.map((transaction, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={transaction.date}
                          onChange={(e) => handleTransactionChange(index, 'date', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={transaction.reason}
                          onChange={(e) => handleTransactionChange(index, 'reason', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={transaction.transactionType}
                          onChange={(e) => handleTransactionChange(index, 'transactionType', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="">Select...</option>
                          <option value="In">In</option>
                          <option value="Out">Out</option>
                          <option value="Adjust">Adjust</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={transaction.quantity}
                          onChange={(e) => handleTransactionChange(index, 'quantity', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={transaction.balance}
                          readOnly={index > 0} // Only first transaction balance can be directly edited
                          onChange={(e) => handleTransactionChange(index, 'balance', e.target.value)}
                          className={`block w-full rounded-md ${index > 0 ? 'bg-gray-100' : ''} border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={transaction.balanceLocation}
                          onChange={(e) => handleTransactionChange(index, 'balanceLocation', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={transaction.enteredBy}
                          onChange={(e) => handleTransactionChange(index, 'enteredBy', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {index > 0 && ( // Don't allow removal of the first transaction
                          <button
                            type="button"
                            onClick={() => removeTransaction(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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