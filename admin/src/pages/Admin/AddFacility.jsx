import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { assets } from '../../assets/assets';

const AddEditFacility = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');

  const [facilityImg, setFacilityImg] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [minBookingHours, setMinBookingHours] = useState(1);
  const [description, setDescription] = useState('');
  const [packages, setPackages] = useState([{ name: '', description: '', feePerHour: '' }]);
  const [available, setAvailable] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, index: null });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/category/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(res.data.categories || []);
        if (!id && res.data.categories.length > 0) setCategory(res.data.categories[0].category);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setErrorMessage('Failed to load categories');
        setShowErrorDialog(true);
      }
    };

    const fetchFacility = async () => {
      try {
        const res = await axios.get(`${baseUrl}/api/facility/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const facility = res.data.facilities.find((f) => f._id === id);
        if (!facility) {
          setErrorMessage('Facility not found');
          setShowErrorDialog(true);
          return;
        }
        setName(facility.name);
        setCategory(facility.category);
        setOpenTime(facility.openTime);
        setCloseTime(facility.closeTime);
        setMinBookingHours(facility.minBookingHours);
        setDescription(facility.about);
        setPackages(facility.pricingPackages);
        setAvailable(facility.available);
        setFacilityImg(facility.image);
      } catch (err) {
        console.error('Error loading facility:', err);
        setErrorMessage('Failed to load facility data');
        setShowErrorDialog(true);
      }
    };

    fetchCategories();
    if (id) fetchFacility();
  }, [id]);

  const handlePackageChange = (index, field, value) => {
    const updated = [...packages];
    updated[index][field] = value;
    setPackages(updated);
  };

  const addPackage = () => {
    setPackages([...packages, { name: '', description: '', feePerHour: '' }]);
  };

  const confirmRemovePackage = (index) => {
    setConfirmDialog({ show: true, index });
  };

  const removePackage = () => {
    const updated = [...packages];
    updated.splice(confirmDialog.index, 1);
    setPackages(updated);
    setConfirmDialog({ show: false, index: null });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('about', description);
    formData.append('openTime', openTime);
    formData.append('closeTime', closeTime);
    formData.append('minBookingHours', minBookingHours);
    formData.append('pricingPackages', JSON.stringify(packages));
    formData.append('available', available ? 'true' : 'false');

    if (facilityImg && typeof facilityImg !== 'string') {
      formData.append('image', facilityImg);
    } else if (typeof facilityImg === 'string') {
      formData.append('image', facilityImg);
    }

    try {
      if (id) {
        formData.append('facilityId', id);
        await axios.post(`${baseUrl}/api/facility/edit`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage('Facility updated successfully');
        setShowSuccessDialog(true);
      } else {
        await axios.post(`${baseUrl}/api/facility/add`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccessMessage('Facility added successfully');
        setShowSuccessDialog(true);
      }
    } catch (err) {
      // console.error('Submit failed:', err);
      // setErrorMessage('Failed to save facility. Please try again.');
      // setShowErrorDialog(true);
    }
  };

  const deleteFacility = async () => {
    if (!id) return;
    try {
      // ✅ FIXED: Clear ALL dialog states first
      setShowErrorDialog(false);
      setShowSuccessDialog(false);
      setErrorMessage('');
      
      await axios.post(
        `${baseUrl}/api/facility/delete`,
        { facilityId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // ✅ FIXED: Only set success state after successful deletion
      setShowDeleteDialog(false);
      setSuccessMessage('Facility deleted successfully');
      setShowSuccessDialog(true);
      
    } catch (err) {
      console.error('Delete failed:', err);
      // ✅ FIXED: Only set error state for delete failures
      setShowDeleteDialog(false);
      setErrorMessage('Failed to delete facility. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    
    if (successMessage.includes('deleted') || successMessage.includes('updated')) {
      navigate('/manage-facilities');
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full'>
      <p className='mb-3 text-lg font-medium'>{id ? 'Edit Facility' : 'Add Facility'}</p>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
        {/* Image Upload */}
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor='facility-img'>
            <img
              className='w-16 h-16 object-cover bg-gray-100 rounded-full cursor-pointer'
              src={facilityImg ? (typeof facilityImg === 'string' ? facilityImg : URL.createObjectURL(facilityImg)) : assets.upload_area}
              alt='Upload'
            />
          </label>
          <input type='file' id='facility-img' hidden onChange={(e) => setFacilityImg(e.target.files[0])} />
          <p>Upload facility image</p>
        </div>

        {/* Basic Info */}
        <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>
          <div className='w-full lg:flex-1 flex flex-col gap-4'>
            <label>Facility Name</label>
            <input className='border rounded px-3 py-2' value={name} onChange={(e) => setName(e.target.value)} required />

            <label>Category</label>
            <select className='border rounded px-2 py-2' value={category} onChange={(e) => setCategory(e.target.value)} required>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.category}>{cat.category}</option>
              ))}
            </select>

            <label>Open Time</label>
            <input type='time' className='border rounded px-3 py-2' value={openTime} onChange={(e) => setOpenTime(e.target.value)} required />

            <label>Close Time</label>
            <input type='time' className='border rounded px-3 py-2' value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required />
          </div>

          <div className='w-full lg:flex-1 flex flex-col gap-4'>
            <label>Min Booking Hours</label>
            <input type='number' min={1} className='border rounded px-3 py-2' value={minBookingHours} onChange={(e) => setMinBookingHours(e.target.value)} required />

            <label>Description</label>
            <textarea rows={4} className='border rounded px-3 py-2' value={description} onChange={(e) => setDescription(e.target.value)} />

            <label>Status</label>
            <div className='flex gap-2 items-center'>
              <input type='checkbox' checked={available} onChange={() => setAvailable(!available)} />
              <span>{available ? 'Available' : 'Unavailable'}</span>
            </div>
          </div>
        </div>

        {/* Pricing Packages */}
        <div className='mt-6'>
          <label className='font-medium mb-2 block'>Pricing Packages</label>
          {packages.map((pack, index) => (
            <div key={index} className='border p-3 rounded mb-2 relative'>
              <input className='w-full mb-2 border rounded px-3 py-2' placeholder='Package Name' value={pack.name} onChange={(e) => handlePackageChange(index, 'name', e.target.value)} required />
              <input className='w-full mb-2 border rounded px-3 py-2' placeholder='Description' value={pack.description} onChange={(e) => handlePackageChange(index, 'description', e.target.value)} required />
              <input className='w-full mb-2 border rounded px-3 py-2' type='number' placeholder='Fee per Hour' value={pack.feePerHour} onChange={(e) => handlePackageChange(index, 'feePerHour', e.target.value)} required />
              {packages.length > 1 && (
                <button type='button' onClick={() => confirmRemovePackage(index)} className='absolute top-2 right-2 text-red-500 hover:text-red-700 text-sm'>Remove</button>
              )}
            </div>
          ))}
          <button type='button' onClick={addPackage} className='bg-gray-200 px-4 py-2 rounded-full'>+ Add Package</button>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-4 mt-6'>
          <button type='submit' className='bg-primary px-10 py-3 text-white rounded-full'>{id ? 'Update Facility' : 'Add Facility'}</button>
          {id && <button type='button' onClick={() => setShowDeleteDialog(true)} className='bg-red-600 text-white px-6 py-3 rounded-full'>Delete</button>}
        </div>
      </div>

      {/* Package Remove Confirmation Dialog */}
      {confirmDialog.show && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-sm'>
            <h2 className='text-lg font-semibold mb-4'>Remove Package</h2>
            <p className='text-gray-700 mb-4'>Are you sure you want to remove this pricing package?</p>
            <div className='flex justify-center gap-4'>
              <button onClick={removePackage} className='bg-red-600 text-white px-6 py-2 rounded-full'>Yes</button>
              <button onClick={() => setConfirmDialog({ show: false, index: null })} className='bg-gray-200 px-6 py-2 rounded-full'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-sm'>
            <h2 className='text-lg font-semibold mb-4 text-red-600'>Delete Facility</h2>
            <p className='text-gray-700 mb-4'>Are you sure you want to delete <strong>{name}</strong>?</p>
            <div className='flex justify-center gap-4'>
              <button onClick={deleteFacility} className='bg-red-600 text-white px-6 py-2 rounded-full'>Yes, Delete</button>
              <button onClick={() => setShowDeleteDialog(false)} className='bg-gray-200 px-6 py-2 rounded-full'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-sm'>
            <h2 className='text-lg font-semibold mb-4'>Success</h2>
            <p className='text-gray-700 mb-4'>{successMessage}</p>
            <button onClick={handleSuccessDialogClose} className='bg-primary text-white px-6 py-2 rounded-full'>OK</button>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl shadow-xl text-center w-[90%] max-w-sm'>
            <h2 className='text-lg font-semibold mb-4 text-red-600'>Error</h2>
            <p className='text-gray-700 mb-4'>{errorMessage}</p>
            <button onClick={() => setShowErrorDialog(false)} className='bg-primary text-white px-6 py-2 rounded-full'>OK</button>
          </div>
        </div>
      )}
    </form>
  );
};

export default AddEditFacility;