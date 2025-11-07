import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';

const CancelReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCancel = async (e) => {
    e.preventDefault();
    
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: id,
          status: 'Cancelling',
          paymentStatus: 'Refund Pending',
          cancellationReason: cancellationReason,
          handledBy: 'SYSTEM',
          dateCancelled: new Date().toISOString().split('T')[0]
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        // show a success popup then navigate back so user sees the confirmation
        toast.success('Cancellation successful!');
        setTimeout(() => navigate('/my-reservations'), 900);
      } else {
        setError(data.message || 'Failed to cancel reservation');
      }
    } catch (error) {
      setError('An error occurred while canceling the reservation');
    } finally {
      setIsSubmitting(false);
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
      <h1 className="text-2xl font-semibold mb-6">Cancel Reservation</h1>
      
      {reservation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">{reservation.facilityName}</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium">{new Date(reservation.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Time</p>
                  <p className="font-medium">{reservation.startTime} - {reservation.endTime}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <form onSubmit={handleCancel}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Cancellation *
                    </label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg min-h-[100px]"
                      placeholder="Please provide a reason for cancelling this reservation..."
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full bg-red-600 text-white py-3 rounded-full hover:bg-red-700 transition-all duration-300 ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => navigate('/my-reservations')}
                      className="w-full border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition-all duration-300"
                    >
                      Keep Reservation
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CancelReservation;