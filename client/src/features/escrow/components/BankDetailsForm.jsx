import React, { useState, useEffect } from 'react';
import escrowWalletApi from '../services/escrowWalletApi';
import notificationService from '@shared/services/notificationService';

const BankDetailsForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    bankName: ''
  });
  const [loading, setLoading] = useState(false);
  const [existingDetails, setExistingDetails] = useState(null);

  useEffect(() => {
    fetchExistingBankDetails();
  }, []);

  const fetchExistingBankDetails = async () => {
    try {
      const response = await escrowWalletApi.getBankDetails();
      if (response.bankDetails) {
        setExistingDetails(response.bankDetails);
        setFormData({
          accountNumber: response.bankDetails.accountNumber || '',
          ifscCode: response.bankDetails.ifscCode || '',
          accountHolderName: response.bankDetails.accountHolderName || '',
          bankName: response.bankDetails.bankName || ''
        });
      }
    } catch (error) {
      console.error('Error fetching bank details:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await escrowWalletApi.updateBankDetails(formData);
      notificationService.success('Bank details updated successfully!');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (error) {
      console.error('Error updating bank details:', error);
      notificationService.error(error.message || 'Failed to update bank details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {existingDetails ? 'Update Bank Details' : 'Add Bank Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Account Number *
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleInputChange}
              className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              IFSC Code *
            </label>
            <input
              type="text"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleInputChange}
              className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              placeholder="Enter IFSC code"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Account Holder Name *
            </label>
            <input
              type="text"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleInputChange}
              className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              placeholder="Enter account holder name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Bank Name *
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              className="w-full bg-[#2A2A2A] text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
              placeholder="Enter bank name"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : (existingDetails ? 'Update' : 'Save')}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-[#2A2A2A] rounded-lg">
          <p className="text-gray-400 text-sm">
            <strong>Note:</strong> Your bank details are securely stored and used only for processing withdrawals. 
            We use industry-standard encryption to protect your information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsForm;
