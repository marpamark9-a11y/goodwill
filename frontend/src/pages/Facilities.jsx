import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Facilities = () => {
  const { category } = useParams();
  const [facilities, setFacilities] = useState([]);
  const [filteredFacilities, setFilteredFacilities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/category/list`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch facilities from backend and apply filter immediately
  const fetchFacilities = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/facility/list`);
      const data = await res.json();
      const fetchedFacilities = data.facilities || [];

      setFacilities(fetchedFacilities);

      // Apply filter immediately after fetch
      if (category) {
        const filtered = fetchedFacilities.filter(fac => fac.category === category);
        setFilteredFacilities(filtered);
      } else {
        setFilteredFacilities(fetchedFacilities);
      }

    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  // Refetch filter when route param (category) changes
  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [category]);

  const handleFacilityClick = (item) => {
    if (item.available) {
      navigate(`/reservation/${item._id}`);
      window.scrollTo(0, 0);
    }
    // If unavailable, do nothing (prevent navigation)
  };

  const handleCategoryClick = (cat) => {
    if (cat === 'all') {
      navigate('/facilities');
    } else {
      navigate(`/facilities/${cat}`);
    }
  };

  return (
    <div>
      <p className='text-gray-600'>Browse through the available facilities.</p>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-primary text-white' : ''}`}
        >
          Filters
        </button>

        {/* Sidebar Filters */}
        <div className={`flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {/* All Facilities Filter */}
          <p
            onClick={() => handleCategoryClick('all')}
            className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
              !category ? 'bg-indigo-100 text-black' : ''
            }`}
          >
            All Facilities
          </p>

          {/* Category Filters */}
          {categories.map((cat, index) => (
            <p
              key={index}
              onClick={() => handleCategoryClick(cat.category)}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                category === cat.category ? 'bg-indigo-100 text-black' : ''
              }`}
            >
              {cat.category}
            </p>
          ))}
        </div>

        {/* Facilities Grid */}
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {filteredFacilities.map((item, index) => (
            <div
              key={index}
              onClick={() => handleFacilityClick(item)}
              className={`border rounded-xl overflow-hidden transition-all duration-500 ${
                item.available 
                  ? 'border-indigo-200 cursor-pointer hover:translate-y-[-10px]' 
                  : 'border-gray-300 cursor-not-allowed opacity-70'
              }`}
            >
              <img 
                className={`w-full h-48 object-cover ${
                  item.available ? 'bg-indigo-50' : 'bg-gray-100'
                }`} 
                src={item.image} 
                alt={item.name} 
              />
              <div className='p-4'>
                <div className='flex items-center gap-2 text-sm'>
                  <p className={`w-2 h-2 rounded-full ${
                    item.available ? 'bg-green-500' : 'bg-red-500'
                  }`}></p>
                  <p className={item.available ? 'text-green-500' : 'text-red-500'}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                <p className='text-zinc-600 text-sm'>{item.category}</p>
                {!item.available && (
                  <p className='text-red-500 text-sm mt-2 font-medium'>
                    Currently unavailable for booking
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Facilities;