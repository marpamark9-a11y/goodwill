import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TopFacilities = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/facility/list`);
      const data = await res.json();
      setFacilities(data.facilities || []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Top Facilities to Book</h1>
      <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of facilities.</p>

      {loading ? (
        <p>Loading facilities...</p>
      ) : (
        <div className='w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
          {facilities.slice(0, 10).map((item, index) => (
            <div
              onClick={() => {
                navigate(`/reservation/${item._id}`);
                window.scrollTo(0, 0);
              }}
              className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
              key={index}
            >
              <img className='bg-blue-50 w-full h-40 object-cover' src={item.image} alt={item.name} />
              <div className='p-4'>
                <div className='flex items-center gap-2 text-sm text-center text-green-500'>
                  <p className='w-2 h-2 bg-green-500 rounded-full'></p>
                  <p>{item.available ? 'Available' : 'Unavailable'}</p>
                </div>
                <p className='text-gray-900 text-lg font-medium'>{item.name}</p>
                <p className='text-gray-600 text-sm'>{item.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => {
          navigate('/facilities');
          scrollTo(0, 0);
        }}
        className='bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10'
      >
        more
      </button>
    </div>
  );
};

export default TopFacilities;
