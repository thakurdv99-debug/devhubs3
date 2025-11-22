import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { PaymentMethodIcon, CloseIcon } from '@shared/utils/iconUtils';

const PaymentMethodManager = () => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock payment methods data (replace with actual API calls)
  const mockPaymentMethods = [
    {
      id: '1',
      type: 'card',
      provider: 'razorpay',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: '12',
      expiryYear: '2025',
      isDefault: true,
      name: 'John Doe'
    },
    {
      id: '2',
      type: 'upi',
      provider: 'razorpay',
      upiId: 'john.doe@okicici',
      isDefault: false,
      name: 'John Doe'
    }
  ];

  useEffect(() => {
    // Load payment methods
    setPaymentMethods(mockPaymentMethods);
  }, []);

  const handleAddMethod = async (methodData) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newMethod = {
        id: Date.now().toString(),
        ...methodData,
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods(prev => [...prev, newMethod]);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (methodId) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
    } catch (error) {
      console.error('Error setting default method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
    } catch (error) {
      console.error('Error deleting payment method:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (type, brand) => {
    return <PaymentMethodIcon type={type} className="w-5 h-5 text-white" />;
  };

  const getMethodDisplayName = (method) => {
    if (method.type === 'card') {
      return `${method.brand} •••• ${method.last4}`;
    } else if (method.type === 'upi') {
      return `UPI - ${method.upiId}`;
    }
    return method.type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
        >
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="glass rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Your Payment Methods</h3>
        
        {paymentMethods.length > 0 ? (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`bg-[#2A2A2A] rounded-lg p-4 border transition-all ${
                  method.isDefault ? 'border-[#00A8E8]' : 'border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      method.type === 'card' ? 'bg-[#00A8E8]' : 'bg-[#0062E6]'
                    }`}>
                      {method.type === 'card' ? (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {method.type === 'card' ? 'Card' : 'UPI'} • {method.provider}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {method.type === 'card' 
                          ? `•••• •••• •••• ${method.last4}`
                          : method.upiId
                        }
                      </p>
                      {method.isDefault && (
                        <span className="inline-block bg-[#00A8E8] text-white text-xs px-2 py-1 rounded-full mt-1">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-[#00A8E8] hover:text-[#0062E6] text-sm font-medium transition-colors"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">No payment methods added</p>
            <p className="text-gray-500">Add a payment method to get started</p>
          </div>
        )}
      </div>

      {/* Add Payment Method Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-md">
            <div className="glass rounded-xl p-6 border border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add Payment Method</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <form onSubmit={handleAddMethod} className="space-y-4">
                {/* Payment Type */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Payment Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'card' })}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.type === 'card'
                          ? 'border-[#00A8E8] bg-[#00A8E8] bg-opacity-10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-white font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                        </svg>
                        Card
                      </div>
                      <div className="text-xs text-gray-400">Credit/Debit</div>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'upi' })}
                      className={`p-3 rounded-lg border transition-all ${
                        formData.type === 'upi'
                          ? 'border-[#00A8E8] bg-[#00A8E8] bg-opacity-10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="text-white font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                        </svg>
                        UPI
                      </div>
                      <div className="text-xs text-gray-400">UPI ID</div>
                    </button>
                  </div>
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Payment Provider
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, provider: 'razorpay' })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.provider === 'razorpay'
                          ? 'border-[#00A8E8] bg-[#00A8E8]/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-white font-medium">Razorpay</div>
                        <div className="text-gray-400 text-sm">Recommended</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                {formData.type === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
                        maxLength="19"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                          className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
                          maxLength="5"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          placeholder="123"
                          value={formData.cvv}
                          onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
                          maxLength="4"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Details */}
                {formData.type === 'upi' && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      placeholder="username@upi"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      className="w-full bg-[#1E1E1E] text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-[#00A8E8] focus:outline-none"
                    />
                  </div>
                )}

                {/* Set as Default */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="setDefault"
                    checked={formData.setAsDefault}
                    onChange={(e) => setFormData({ ...formData, setAsDefault: e.target.checked })}
                    className="w-4 h-4 text-[#00A8E8] bg-[#1E1E1E] border-gray-600 rounded focus:ring-[#00A8E8] focus:ring-2"
                  />
                  <label htmlFor="setDefault" className="text-gray-300 text-sm">
                    Set as default payment method
                  </label>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex-1"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Method'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add Payment Method Form Component
const AddPaymentMethodForm = ({ onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    type: 'card',
    provider: 'razorpay',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
    upiId: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Payment Type Selection */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Payment Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'card' }))}
            className={`p-3 rounded-lg border transition-all ${
              formData.type === 'card'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              Card
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'upi' }))}
            className={`p-3 rounded-lg border transition-all ${
              formData.type === 'upi'
                ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              UPI
            </div>
          </button>
        </div>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Payment Provider
        </label>
        <select
          name="provider"
          value={formData.provider}
          onChange={handleInputChange}
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        >
          <option value="razorpay">Razorpay</option>
        </select>
      </div>

      {/* Card Fields */}
      {formData.type === 'card' && (
        <>
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Card Number
            </label>
            <input
              type="text"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              maxLength="19"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Month
              </label>
              <input
                type="text"
                name="expiryMonth"
                value={formData.expiryMonth}
                onChange={handleInputChange}
                placeholder="MM"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Year
              </label>
              <input
                type="text"
                name="expiryYear"
                value={formData.expiryYear}
                onChange={handleInputChange}
                placeholder="YY"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="2"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={formData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                maxLength="4"
              />
            </div>
          </div>
        </>
      )}

      {/* UPI Fields */}
      {formData.type === 'upi' && (
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            UPI ID
          </label>
          <input
            type="text"
            name="upiId"
            value={formData.upiId}
            onChange={handleInputChange}
            placeholder="username@bank"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Name Field */}
      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="John Doe"
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Adding...' : 'Add Method'}
        </button>
      </div>
    </form>
  );
};

export default PaymentMethodManager;
