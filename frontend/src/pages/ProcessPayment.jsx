import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

const ProcessPayment = () => {
  const { reference } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      const amount = searchParams.get('amount');
      const reservationId = searchParams.get('reservationId');

      // Here you would integrate with your actual payment gateway
      // For this example, we'll simulate a successful payment
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentReference: reference,
          amount,
          reservationId
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirect to success page or reservation list
        navigate('/payment-success');
      } else {
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setError('An error occurred while processing the payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p>Processing your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-primary text-white px-6 py-2 rounded-full"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return null;
};

export default ProcessPayment;