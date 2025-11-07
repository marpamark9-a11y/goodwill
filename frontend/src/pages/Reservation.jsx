import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { AuthContext } from '../context/AuthContext';
import { assets } from '../assets/assets';
import RelatedFacilities from '../components/RelatedFacilities';

const Reservation = () => {
  const { facId } = useParams();
  const { facilities, currencySymbol } = useContext(AppContext);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  const [facInfo, setFacInfo] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [filteredEndTimes, setFilteredEndTimes] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fac = facilities.find(fac => fac._id === facId);
    if (fac) {
      setFacInfo(fac);
      if (fac?.pricingPackages?.length > 0) {
        setSelectedPackage(fac.pricingPackages[0]);
      }
    } else {
      fetch(`${import.meta.env.VITE_BACKEND_URL}/api/facility/list`)
        .then(res => res.json())
        .then(data => {
          const fallback = data.facilities.find(f => f._id === facId);
          if (fallback) {
            setFacInfo(fallback);
            if (fallback.pricingPackages?.length > 0) {
              setSelectedPackage(fallback.pricingPackages[0]);
            }
          }
        })
        .catch(err => console.error('Error loading facility:', err));
    }
  }, [facId, facilities]);

  useEffect(() => {
    if (selectedDate && facId) {
      fetchAvailableSlots();
      setStartTime('');
      setEndTime('');
      setFilteredEndTimes([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (startTime && endTime && selectedPackage) {
      calculateTotalPrice();
    }
  }, [startTime, endTime, selectedPackage]);

  const fetchAvailableSlots = async () => {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/reservation/${token ? 'available-slots' : 'available-slots-public'}`;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ facilityId: facId, date: selectedDate }),
      });

      const data = await res.json();
      if (data.availableSlots) {
        const cleanSlots = data.availableSlots.filter(slot => !slot.includes('(booked)'));
        setAvailableTimes(cleanSlots);
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
    }
  };

  const parseTime = (time) => {
    if (!time) return NaN;
    const [timePart, period] = time.split(' ');
    const [hour, minute] = timePart.split(':').map(Number);
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + minute;
  };

  const updateEndTimes = (start) => {
    const index = availableTimes.indexOf(start);
    if (index !== -1) {
      setFilteredEndTimes(availableTimes.slice(index + 1));
    }
  };

  const calculateTotalPrice = () => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);
    const duration = (end - start) / 60;
    setTotalPrice(duration > 0 ? duration * selectedPackage.feePerHour : 0);
  };

  const handleGuestSubmission = async () => {
    // prevent booking for past dates
    if (!selectedDate) {
      setError('Please select a date.');
      return;
    }
    if (selectedDate < today) {
      setError('Please choose today or a future date.');
      return;
    }
    // Validate guest form fields
    if (!guestName || guestName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (!guestEmail || !guestEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!guestPhone || guestPhone.trim().length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }

    try {
      const payload = {
        facilityId: facInfo._id,
        facilityName: facInfo.name,
        image: facInfo.image,
        category: facInfo.category,
        packageName: selectedPackage.name,
        packageFee: selectedPackage.feePerHour,
        totalPrice,
        totalHours: (parseTime(endTime) - parseTime(startTime)) / 60,
        date: selectedDate,
        startTime,
        endTime,
        userId: `GUEST_${Date.now()}`,
        userName: guestName,
        userType: 'guest',
        status: 'Pending',
        paymentStatus: 'Pending',
        isCompleted: false,
        paymentType: 'Online',
        notes: '',
        paymentReference: '',
        guestEmail: guestEmail,
        guestPhone: guestPhone
      };

      const url = `${import.meta.env.VITE_BACKEND_URL}/api/reservation/add-guest`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.status === 201 || result.success) {
        setGuestMode(false); // Close the guest form
        setShowDialog(true); // Show success message
      } else {
        setError(result.message || 'Reservation submission failed.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('An error occurred while submitting your reservation.');
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !startTime || !endTime || !selectedPackage) {
      setError('Please select a date, start time, end time, and package.');
      return;
    }
    setError('');

    // prevent booking for past dates
    if (selectedDate < today) {
      setError('Cant choose the date in the past.');
      return;
    }

    // If user is not logged in, show the guest form first
    if (!token) {
      setGuestMode(true);
      return;
    }

    try {
      const payload = {
          facilityId: facInfo._id,
          facilityName: facInfo.name,
          image: facInfo.image,
          category: facInfo.category,
          packageName: selectedPackage.name,
          packageFee: selectedPackage.feePerHour,
          totalPrice,
          totalHours: (parseTime(endTime) - parseTime(startTime)) / 60,
          date: selectedDate,
          startTime,
          endTime,
        // If guest, build a pseudo user id/name; backend will accept these fields for guest reservations
        userId: user ? user._id : `GUEST_${Date.now()}`,
        userName: user ? user.fullName : (guestName || 'Guest User'),
        userType: user ? user.userType : 'guest',
          status: 'Pending',
          paymentStatus: 'Pending',
          isCompleted: false,
          paymentType: 'Online',
          notes: '',
          paymentReference: ''
        };
  // Choose endpoint based on whether we have a token or not
  const endpoint = token ? 'add-secure' : 'add-guest';
  const url = `${import.meta.env.VITE_BACKEND_URL}/api/reservation/${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

      // If guest, attach contact fields
      if (!user) {
        payload.guestEmail = guestEmail || '';
        payload.guestPhone = guestPhone || '';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.status === 201 || result.success) {
        setShowDialog(true);
      } else {
        setError(result.message || 'Reservation submission failed.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      setError('An error occurred while submitting your reservation.');
    }
  };

  return facInfo ? (
    <div>
      {/* Facility Info */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={facInfo.image} alt={facInfo.name} />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
            {facInfo.name}
            <img className='w-5' src={assets.verified_icon} alt='' />
          </p>
          <p className='text-sm text-gray-500 mt-1'>{facInfo.about}</p>
        </div>
      </div>

      {/* Booking Section */}
      <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking slots</p>
        <div className='mt-4'>
          <p className='text-sm text-gray-700'>Select a Date:</p>
          <input
            type='date'
            className='w-full sm:w-60 p-2 border border-gray-300 rounded-lg mt-1'
            min={today}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className='mt-4'>
          <p className='text-sm text-gray-700'>Select a Package:</p>
          <select
            className='w-full sm:w-60 p-2 border border-gray-300 rounded-lg mt-1'
            value={selectedPackage?.name}
            onChange={(e) => {
              const selected = facInfo.pricingPackages.find(pkg => pkg.name === e.target.value);
              setSelectedPackage(selected);
            }}
          >
            {facInfo.pricingPackages.map((pkg, index) => (
              <option key={index} value={pkg.name}>
                {pkg.name} - {currencySymbol}{pkg.feePerHour}/hr
              </option>
            ))}
          </select>
        </div>
        <div className='mt-4'>
          <p className='text-sm text-gray-700'>Select Start Time:</p>
          <select
            className='w-full sm:w-60 p-2 border border-gray-300 rounded-lg mt-1'
            value={startTime}
            onChange={(e) => {
              setStartTime(e.target.value);
              updateEndTimes(e.target.value);
            }}
            disabled={!selectedDate}
          >
            <option value=''>Select Start Time</option>
            {availableTimes.map((time, index) => (
              <option key={index} value={time}>{time}</option>
            ))}
          </select>
        </div>
        <div className='mt-4'>
          <p className='text-sm text-gray-700'>Select End Time:</p>
          <select
            className='w-full sm:w-60 p-2 border border-gray-300 rounded-lg mt-1'
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            disabled={!startTime}
          >
            <option value=''>Select End Time</option>
            {filteredEndTimes.map((time, index) => (
              <option key={index} value={time}>{time}</option>
            ))}
          </select>
        </div>
        {totalPrice > 0 && (
          <div className='mt-4'>
            <p className='text-sm text-gray-700'>Total Price:</p>
            <p className='text-lg font-semibold'>
              {currencySymbol}{totalPrice.toFixed(2)}
            </p>
          </div>
        )}
        {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
        <button
          onClick={guestMode ? handleGuestSubmission : handleBooking}
          className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'
        >
          {user ? 'Book Reservation' : (guestMode ? 'Submit as Guest' : 'Continue as Guest / Login')}
        </button>

        {/* Guest modal - shown when guestMode is active and user not logged in */}
        {!user && guestMode && (
          <div className='fixed inset-0 z-50 flex items-center justify-center'>
            <div className='absolute inset-0 bg-black bg-opacity-40' onClick={() => setGuestMode(false)} />
            <div className='relative bg-white rounded-2xl w-[90%] sm:w-96 p-6 shadow-xl'>
              <h3 className='text-lg font-semibold mb-3'>Continue as Guest</h3>
              <p className='text-sm text-gray-600 mb-3'>Enter your details to complete the reservation.</p>
              <div className='flex flex-col gap-2'>
                <label className='text-sm'>Full name *</label>
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder='Full name' className='w-full p-2 border border-gray-300 rounded'/>

                <label className='text-sm'>Email *</label>
                <input 
                  type="email"
                  value={guestEmail} 
                  onChange={(e) => setGuestEmail(e.target.value)} 
                  placeholder='Enter your email address' 
                  className='w-full p-2 border border-gray-300 rounded'
                  required
                />

                <label className='text-sm'>Phone *</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder='Enter your phone number'
                  className='w-full p-2 border border-gray-300 rounded'
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>

              <div className='flex justify-end gap-2 mt-4'>
                <button onClick={() => setGuestMode(false)} className='px-4 py-2 rounded-lg border'>Cancel</button>
                <button onClick={handleGuestSubmission} className='px-4 py-2 rounded-lg bg-primary text-white'>Submit & Book</button>
              </div>
              <p className='text-xs text-gray-500 mt-3'>* All fields are required. You will receive confirmation details via email.</p>
            </div>
          </div>
        )}
      </div>

      {/* Success Dialog */}
      {showDialog && (
        <div className='fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center'>
          <div className='bg-white p-6 rounded-2xl w-96 text-center shadow-xl'>
            <div className="text-green-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className='text-xl font-bold text-green-600 mb-2'>Reservation Booked Successfully</h2>
            {!user ? (
              <div>
                <p className='text-sm text-gray-600 mb-4'>Please check your email for the reservation overview and payment instructions.</p>
                <button
                  onClick={() => {
                    setShowDialog(false);
                    navigate('/');
                  }}
                  className='bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300'
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <div>
                <p className='text-sm text-gray-600 mb-4'>Your reservation has been successfully submitted!</p>
                <button
                  onClick={() => navigate('/my-reservations')}
                  className='bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-all duration-300'
                >
                  View My Reservations
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ) : <p className='text-center mt-10 text-gray-500'>Loading facility details...</p>;
};

export default Reservation;