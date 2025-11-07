import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-green-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your payment. Your reservation has been confirmed.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/my-reservations')}
            className="w-full bg-primary text-white py-3 rounded-full hover:bg-opacity-90 transition-all duration-300"
          >
            View My Reservations
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition-all duration-300"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;