import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const EditReservation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useContext(AppContext);
  
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedEndTime, setSelectedEndTime] = useState('');
  const [filteredEndTimes, setFilteredEndTimes] = useState([]);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (selectedDate && reservation?.facilityId) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchReservation = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setReservation(data.reservation);
        setSelectedDate(data.reservation.date);
        setSelectedStartTime(data.reservation.startTime);
        setSelectedEndTime(data.reservation.endTime);
      } else {
        setError(data.message || 'Failed to fetch reservation details');
      }
    } catch (error) {
      setError('An error occurred while fetching reservation details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/available-slots-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facilityId: reservation.facilityId,
          date: selectedDate,
          excludeReservationId: id // Exclude current reservation from conflicts
        }),
      });

      const data = await response.json();
      if (data.availableSlots) {
        const cleanSlots = data.availableSlots.filter(slot => !slot.includes('(booked)'));
        setAvailableTimes(cleanSlots);
        updateEndTimes(selectedStartTime);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const updateEndTimes = (start) => {
    if (!start) {
      setFilteredEndTimes([]);
      return;
    }
    const index = availableTimes.indexOf(start);
    if (index !== -1) {
      setFilteredEndTimes(availableTimes.slice(index + 1));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reservation/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: id,
          date: selectedDate,
          startTime: selectedStartTime,
          endTime: selectedEndTime
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        navigate('/my-reservations');
      } else {
        setError(data.message || 'Failed to update reservation');
      }
    } catch (error) {
      setError('An error occurred while updating the reservation');
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
      <h1 className="text-2xl font-semibold mb-6">Edit Reservation</h1>
      
      {reservation && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-medium mb-4">{reservation.facilityName}</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <select
                    value={selectedStartTime}
                    onChange={(e) => {
                      setSelectedStartTime(e.target.value);
                      updateEndTimes(e.target.value);
                      setSelectedEndTime('');
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Start Time</option>
                    {availableTimes.map((time, index) => (
                      <option key={index} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <select
                    value={selectedEndTime}
                    onChange={(e) => setSelectedEndTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                    disabled={!selectedStartTime}
                  >
                    <option value="">Select End Time</option>
                    {filteredEndTimes.map((time, index) => (
                      <option key={index} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total Amount:</p>
                  <p className="text-2xl font-bold text-primary">
                    {currencySymbol}{reservation.totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button
                  type="submit"
                  className="w-full bg-primary text-white py-3 rounded-full hover:bg-opacity-90 transition-all duration-300"
                >
                  Update Reservation
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/my-reservations')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-full hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EditReservation;