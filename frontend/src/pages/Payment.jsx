import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useContext(AppContext);
  const [reservation, setReservation] = useState(null);
  const [guestEmail, setGuestEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setReservation(data.reservation);
      } else {
        setError(data.message || 'Failed to fetch reservation details');
      }
    } catch (error) {
      setError('An error occurred while fetching reservation details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      console.log('Starting payment process for reservation:', id);
      // If reservation doesn't already have an email, require guest to provide one
      const emailToUse = reservation.email || guestEmail;
      const isValidEmail = (e) => typeof e === 'string' && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(e);
      if (!reservation.email) {
        if (!emailToUse || !isValidEmail(emailToUse)) {
          setError('Please enter a valid email address to receive your receipt.');
          setLoading(false);
          return;
        }
      }
      
      // First, initiate the payment
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: id,
          amount: reservation.totalPrice,
          // include guestEmail only when reservation doesn't already have one
          guestEmail: reservation.email ? undefined : emailToUse,
        }),
      });

      const data = await response.json();
      console.log('Payment creation response:', data);
      
      if (!response.ok) {
        console.error('Payment creation failed:', data);
        throw new Error(data.message || 'Failed to initiate payment');
      }

      if (!data.success) {
        console.error('Payment creation was not successful:', data);
        throw new Error(data.message || 'Payment initialization failed');
      }

      console.log('Payment created successfully with reference:', data.paymentReference);

      // If payment is initiated successfully, verify it
      const verifyResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentReference: data.paymentReference,
        }),
      });

      const verifyData = await verifyResponse.json();
      console.log('Payment verification response:', verifyData);

      if (!verifyResponse.ok || !verifyData.success) {
        console.error('Payment verification failed:', verifyData);
        throw new Error(verifyData.message || 'Payment verification failed');
      }

      console.log('Payment verified successfully');
      // If everything is successful, navigate to success page
      navigate('/payment-success');
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message || 'An error occurred while processing payment');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (error) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <p className="text-red-500 mb-4">{error}</p>
      <button 
        onClick={() => navigate('/')}
        className="bg-primary text-white px-6 py-2 rounded-full"
      >
        Return to Home
      </button>
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Payment Details</h1>
      
      {reservation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <h2 className="text-xl font-medium">{reservation.facilityName}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Date</p>
                <p className="font-medium">{new Date(reservation.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Time</p>
                <p className="font-medium">{reservation.startTime} - {reservation.endTime}</p>
              </div>
              <div>
                <p className="text-gray-600">Package</p>
                <p className="font-medium">{reservation.packageName}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-medium">{reservation.totalHours} hour/s</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Total Amount:</p>
                <p className="text-2xl font-bold text-primary">
                  {currencySymbol}{reservation.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Guest email input shown when reservation doesn't already have an email */}
              {!reservation.email && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Email for receipt</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="emailOptIn"
                      type="checkbox"
                      checked={emailOptIn}
                      onChange={() => setEmailOptIn((s) => !s)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="emailOptIn" className="text-sm text-gray-600">Send me email receipt</label>
                  </div>
                </div>
              )}
              <button
                onClick={handlePayment}
                className="w-full bg-primary text-white py-3 rounded-full hover:bg-opacity-90 transition-all duration-300"
              >
                Proceed to Payment
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;