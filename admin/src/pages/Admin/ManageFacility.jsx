import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FacilityList = () => {
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  const [facilities, setFacilities] = useState([]);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchFacilities = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/facility/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setFacilities([{ _id: 'add' }, ...res.data.facilities]);
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleCardClick = (item) => {
    if (item._id === 'add') {
      navigate('/add-facility');
    } else {
      navigate(`/add-facility/${item._id}`);
    }
  };

  // ✅ Fixed: Toggle availability function
  const toggleAvailability = async (facility, e) => {
    e.stopPropagation(); // Prevent card navigation
    
    const newAvailability = !facility.available;
    console.log('🔄 Toggling availability for:', facility.name, 'from', facility.available, 'to', newAvailability);

    try {
      const formData = new FormData();
      formData.append('facilityId', facility._id);
      formData.append('name', facility.name);
      formData.append('category', facility.category);
      formData.append('about', facility.about);
      formData.append('openTime', facility.openTime);
      formData.append('closeTime', facility.closeTime);
      formData.append('minBookingHours', facility.minBookingHours);
      formData.append('pricingPackages', JSON.stringify(facility.pricingPackages));
      formData.append('available', newAvailability.toString()); // Send the new value
      formData.append('image', facility.image); // Keep existing image

      // Debug: Log what we're sending
      console.log('📤 Sending update with available:', newAvailability.toString());

      const response = await axios.post(`${baseUrl}/api/facility/edit`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      console.log('✅ Update response:', response.data);

      // Update local state immediately
      setFacilities(prev => prev.map(f => 
        f._id === facility._id ? { ...f, available: newAvailability } : f
      ));

      setSuccessMessage(`"${facility.name}" is now ${newAvailability ? 'available' : 'unavailable'}`);
      setShowSuccessDialog(true);

    } catch (err) {
      console.error('❌ Error updating availability:', err);
      console.error('❌ Error details:', err.response?.data);
      alert('Failed to update availability status');
    }
  };

  return (
    <div className='m-5 max-h-[90vh] overflow-y-scroll'>
      <h1 className='text-lg font-medium'>All Facilities</h1>
      <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
        {facilities.map((item, index) => (
          <div
            key={index}
            onClick={() => handleCardClick(item)}
            className='border border-[#C9D8FF] rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:scale-105 transition-all duration-300'
          >
            <div className='bg-[#EAEFFF] group-hover:bg-primary transition-all duration-500 h-32 flex items-center justify-center'>
              {item._id === 'add' ? (
                <div className='text-4xl text-gray-500 font-bold'>+</div>
              ) : (
                <img className='h-full w-full object-cover' src={item.image} alt={item.name} />
              )}
            </div>

            <div className='p-4 text-center'>
              <p className='text-[#262626] text-lg font-medium'>
                {item._id === 'add' ? 'Add Facility' : item.name}
              </p>

              {item._id !== 'add' && (
                <>
                  <p className='text-[#5C5C5C] text-sm'>{item.category}</p>
                  <div
                    className='mt-2 flex items-center justify-center gap-1 text-sm cursor-default select-none'
                    onClick={(e) => e.stopPropagation()} // Prevent card navigation
                  >
                    {/* ✅ Fixed: Working availability toggle */}
                    <input 
                      type="checkbox" 
                      checked={item.available} 
                      onChange={(e) => toggleAvailability(item, e)}
                      onClick={(e) => e.stopPropagation()} // Additional event protection
                      className='cursor-pointer'
                    />
                    <p className={item.available ? 'text-green-600' : 'text-red-600'}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showSuccessDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl w-[90%] max-w-sm shadow-xl text-center'>
            <h2 className='text-lg font-semibold mb-4'>Success</h2>
            <p className='text-gray-700 mb-4'>{successMessage}</p>
            <button 
              onClick={() => {
                setShowSuccessDialog(false);
                // Optional: Refresh facilities to ensure sync with backend
                fetchFacilities();
              }} 
              className='bg-primary text-white px-6 py-2 rounded-full'
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityList;