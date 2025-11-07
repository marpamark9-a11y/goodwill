import React, { useContext, useEffect, useState, useRef } from 'react';
import { assets } from '../assets/assets';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MyProfile = () => {
  const { user, token, login, loadingAuth } = useContext(AuthContext);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: '',
    image: '',
    email: '',
    phoneNumber: '',
    address: ''
  });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRef = useRef();

  // Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.post(
          'http://localhost:4000/api/user/get-profile',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserData(res.data.user);
      } catch (err) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Autofocus full name input when edit starts
  useEffect(() => {
    if (isEdit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEdit]);

  // Save Profile
  const handleSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const res = await axios.post(
        'http://localhost:4000/api/user/update-profile',
        {
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          address: userData.address
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      login(res.data.user, token);
      setUserData(res.data.user);
      toast.success('Profile updated');

      if (newPassword.trim().length >= 6) {
        await axios.post(
          'http://localhost:4000/api/user/change-password',
          { newPassword },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Password updated');
        setNewPassword('');
        setConfirmPassword('');
      }

      setIsEdit(false);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  // Upload Avatar
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(
        'http://localhost:4000/api/user/upload-avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = res.data.user;
      setUserData(prev => ({ ...prev, image: updatedUser.image }));
      login(updatedUser, token);
      toast.success('Avatar updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload avatar');
    }
  };

  // Wait for AuthContext to fully load before rendering
  if (loadingAuth || !token || loading) {
    return <p className="text-gray-500">Loading profile...</p>;
  }

  return (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>
      {/* Avatar */}
      <div className='relative'>
        <img
          className='w-36 rounded'
          src={userData.image || assets.profile_pic}
          alt="Profile"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = assets.profile_pic;
          }}
        />
        {isEdit && (
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className='text-sm mt-2'
          />
        )}
      </div>

      {/* Full Name */}
      {isEdit ? (
        <input
          ref={inputRef}
          className='bg-gray-50 text-3xl font-medium max-w-60 mt-4'
          type="text"
          value={userData.fullName}
          onChange={(e) => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
        />
      ) : (
        <p className='font-medium text-3xl text-neutral-800 mt-4'>{userData.fullName}</p>
      )}

      <hr className='bg-zinc-400 h-[1px] border-none my-2' />

      {/* Contact Info */}
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email:</p>
          <p className='text-blue-500'>{userData.email}</p>

          <p className='font-medium'>Phone:</p>
          {isEdit ? (
            <input
              className='bg-gray-100 max-w-52'
              type="text"
              value={userData.phoneNumber}
              onChange={(e) => setUserData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
          ) : (
            <p className='text-blue-400'>{userData.phoneNumber}</p>
          )}

          <p className='font-medium'>Address:</p>
          {isEdit ? (
            <input
              className='bg-gray-50 w-full'
              type="text"
              value={userData.address}
              onChange={(e) => setUserData(prev => ({ ...prev, address: e.target.value }))}
            />
          ) : (
            <p className='text-gray-500'>{userData.address}</p>
          )}
        </div>
      </div>

      {/* Change Password */}
      {isEdit && (
        <div className='mt-4'>
          <p className='text-neutral-500 underline mt-3'>CHANGE PASSWORD</p>
          <input
            type='password'
            className='bg-gray-50 w-full mt-2 p-2 rounded'
            placeholder='New Password (min 6 chars)'
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            type='password'
            className='bg-gray-50 w-full mt-2 p-2 rounded'
            placeholder='Confirm Password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className='mt-10'>
        {isEdit ? (
          <button
            onClick={handleSave}
            className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
          >
            Save Information
          </button>
        ) : (
          <button
            onClick={() => setIsEdit(true)}
            className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
