import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CategoryMenu = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/category/list`);
      const data = await res.json();

      if (data.success) {
        setCategories(data.categories);
      } else {
        console.error('Failed to fetch categories:', data.message);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div id='category' className='flex flex-col items-center gap-4 py-16 text-gray-800'>
      <h1 className='text-3xl font-medium'>Find by Category</h1>
      <p className='sm:w-1/3 text-center text-sm'>
        Simply browse through our extensive list of facilities, set your reservation hassle-free.
      </p>
      <div className='flex sm:justify-center gap-4 pt-5 w-full overflow-scroll'>
        {loading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories found.</p>
        ) : (
          categories.map((item, index) => (
            <Link
              to={`/facilities/${item.category}`}
              onClick={() => scrollTo(0, 0)}
              className='flex flex-col items-center text-xs cursor-pointer flex-shrink-0 hover:translate-y-[-10px] transition-all duration-500'
              key={index}
            >
              <img className='w-16 sm:w-24 mb-2' src={item.image} alt={item.category} />
              <p>{item.category}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryMenu;
