import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const StaffProfile = () => {
  const { user, login } = useAuth(); // Use login function to update context
  const [isEdit, setIsEdit] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [userData, setUserData] = useState({
    _id: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    userType: '',
    image: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (user) {
      setUserData(user);
    }
  }, [user]);

  // Refresh user data from server
  const refreshUserData = async () => {
    try {
      const response = await axios.post(
        `${baseUrl}/api/user/get-profile`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      const updatedUser = response.data.user;
      const normalizedUser = {
        ...updatedUser,
        role: updatedUser.userType
      };

      // Update localStorage and context
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      // Use login function to update context state
      if (login) {
        login(normalizedUser, token);
      }
      
      return updatedUser;
    } catch (err) {
      console.error('Failed to refresh user data:', err);
      return null;
    }
  };

  // Upload image to server
  const handleImageUpload = async (file) => {
    if (!token) {
      alert('No authentication token found');
      return null;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post(
        `${baseUrl}/api/user/upload-avatar`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh user data to get latest changes
      await refreshUserData();
      
      return response.data.user.image;
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!token) {
      alert('No authentication token found');
      return;
    }

    // Validate phone number (only digits)
    if (userData.phoneNumber && !/^\d+$/.test(userData.phoneNumber)) {
      alert('Phone number must contain only numbers');
      return;
    }

    setUpdatingProfile(true);
    try {
      const response = await axios.post(
        `${baseUrl}/api/user/update-profile`,
        {
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          address: userData.address
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh user data to get latest changes
      await refreshUserData();
      
      setIsEdit(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Profile update failed:', err);
      alert('Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) {
      alert('No authentication token found');
      return;
    }

    if (!newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    try {
      await axios.post(
        `${baseUrl}/api/user/change-password`,
        {
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);
      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Password change failed:', err);
      alert('Failed to change password');
    }
  };

  // Handle phone number input - only allow numbers
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setUserData((prev) => ({ ...prev, phoneNumber: value }));
  };

  // Handle file input for image upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    await handleImageUpload(file);
  };

  return (
    <div className="m-5 flex flex-col gap-4">
      <h2 className="text-xl font-semibold">My Profile</h2>

      <div className="bg-white border rounded-lg p-6 max-w-3xl w-full">
        <div className="flex items-center gap-6 mb-5">
          <img
            src={userData.image || 'https://via.placeholder.com/150'}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border"
          />
          {isEdit && (
            <div className="flex flex-col gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadingImage}
              />
              <p className="text-xs text-gray-500">
                {uploadingImage ? 'Uploading...' : 'Change profile picture'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            {isEdit ? (
              <input
                type="text"
                className="border rounded w-full px-3 py-2"
                value={userData.fullName}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            ) : (
              <p className="text-gray-700">{userData.fullName}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-gray-700">{userData.email}</p>
          </div>

          <div>
            <label className="text-sm font-medium">Phone Number</label>
            {isEdit ? (
              <input
                type="tel"
                className="border rounded w-full px-3 py-2"
                value={userData.phoneNumber}
                onChange={handlePhoneChange}
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="Only numbers allowed"
              />
            ) : (
              <p className="text-gray-700">{userData.phoneNumber}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            {isEdit ? (
              <input
                type="text"
                className="border rounded w-full px-3 py-2"
                value={userData.address}
                onChange={(e) =>
                  setUserData((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            ) : (
              <p className="text-gray-700">{userData.address}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">User Type</label>
            <p className="capitalize text-gray-700">{userData.userType}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          {isEdit ? (
            <button
              className="bg-primary text-white px-5 py-2 rounded-full hover:bg-opacity-90 disabled:opacity-50"
              onClick={handleProfileUpdate}
              disabled={uploadingImage || updatingProfile}
            >
              {updatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              className="border border-primary text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-white"
              onClick={() => setIsEdit(true)}
            >
              Edit Profile
            </button>
          )}
          <button
            className="bg-gray-100 text-gray-700 px-5 py-2 rounded-full hover:bg-gray-200"
            onClick={() => setShowPasswordDialog(true)}
          >
            Change Password
          </button>
        </div>
      </div>

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold text-green-600 mb-2">Success</h2>
            <p className="text-gray-600 text-sm">Your changes have been saved.</p>
            <button
              className="mt-4 bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90"
              onClick={() => setShowSuccessDialog(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-3">Change Password</h2>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-3"
              placeholder="New Password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              className="w-full border rounded px-3 py-2 mb-4"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-primary text-white rounded-full hover:bg-opacity-90"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProfile;