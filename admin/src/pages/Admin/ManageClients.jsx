import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageClients = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  if (!user || user.userType !== 'admin') {
    return (
      <div className="p-6 text-red-600 font-semibold text-center">
        ❌ Access Denied. Only admins can manage clients.
      </div>
    );
  }

  const [users, setUsers] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
  const [userIdToReactivate, setUserIdToReactivate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/user/list`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        // Filter to only show clients (users with userType 'user')
        const clients = data.users.filter(user => user.userType === 'user') || [];
        setUsers(clients);
      } else {
        setErrorMessage(data.message || 'Failed to load clients');
        setShowErrorDialog(true);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setErrorMessage('Failed to load clients. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search ID
  const filteredUsers = users.filter((u) => {
    return searchId === '' || u._id.toLowerCase().includes(searchId.toLowerCase());
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setConfirmPassword('');
    setPhone(user.phoneNumber);
    setAddress(user.address);
    setChangePassword(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowForm(true);
  };

  const confirmDelete = (id) => {
    setUserIdToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/user/delete-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userIdToDelete }),
      });
      
      const data = await res.json();
      console.log('Delete response:', data);
      
      if (data.success || data.message?.includes('success')) {
        setSuccessMessage('Client account deactivated successfully!');
        setShowSuccessDialog(true);
        setShowDeleteDialog(false);
        fetchUsers(); // Refresh the client list
      } else {
        setErrorMessage(data.message || 'Failed to delete client');
        setShowErrorDialog(true);
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setErrorMessage('Failed to delete client. Please try again.');
      setShowErrorDialog(true);
      setShowDeleteDialog(false);
    } finally {
      setUserIdToDelete(null);
    }
  };

  // ADMIN: Change password for any client
  const handlePasswordChange = async () => {
    if (!newPassword || !confirmNewPassword) {
      setErrors({ ...errors, newPassword: 'Please fill in all password fields' });
      return;
    }
    if (newPassword.length < 6) {
      setErrors({ ...errors, newPassword: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrors({ ...errors, confirmNewPassword: 'Passwords do not match' });
      return;
    }

    try {
      const res = await fetch(`${baseUrl}/api/user/admin-change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          userId: selectedUser._id,
          newPassword 
        }),
      });
      
      const data = await res.json();
      console.log('Admin password change response:', data);
      
      if (res.ok && data.success === true) {
        setSuccessMessage(data.message || `Password for ${selectedUser.fullName} changed successfully!`);
        setShowSuccessDialog(true);
        setChangePassword(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setErrors({});
      } else {
        setErrorMessage(data.message || 'Failed to change password');
        setShowErrorDialog(true);
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setErrorMessage('Failed to change password. Please try again.');
      setShowErrorDialog(true);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]+$/;
    const newErrors = {};

    if (!emailRegex.test(email)) newErrors.email = 'Invalid email format';
    if (!phoneRegex.test(phone)) newErrors.phone = 'Phone must be numeric';
    if (!selectedUser) {
      if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = { 
      fullName: name, 
      email, 
      userType: 'user', // Always set as 'user' for clients
      phoneNumber: phone, 
      address 
    };
    if (!selectedUser) payload.password = password;
    if (selectedUser) payload.userId = selectedUser._id;

    try {
      const res = await fetch(`${baseUrl}/api/user/${selectedUser ? 'edit' : 'register'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log('Submit response:', data);
      
      if (res.ok && (data.success || data.message?.includes('success') || data.message?.includes('added') || data.message?.includes('updated'))) {
        setSuccessMessage(selectedUser ? 'Client updated successfully!' : 'Client added successfully!');
        setShowSuccessDialog(true);
        setShowForm(false);
        resetForm();
        fetchUsers(); // Refresh the client list
      } else {
        setErrorMessage(data.message || `Failed to ${selectedUser ? 'update' : 'add'} client`);
        setShowErrorDialog(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage(`Failed to ${selectedUser ? 'update' : 'add'} client. Please try again.`);
      setShowErrorDialog(true);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSuccessMessage('');
    setShowForm(false);
    setShowDeleteDialog(false);
    setShowErrorDialog(false);
    resetForm();
  };

  const handleErrorDialogClose = () => {
    setShowErrorDialog(false);
    setErrorMessage('');
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setUserIdToDelete(null);
  };

  const confirmReactivate = (id) => {
    setUserIdToReactivate(id);
    setShowReactivateDialog(true);
  };

  const handleReactivate = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/user/reactivate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: userIdToReactivate }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccessMessage('Client account reactivated successfully!');
        setShowSuccessDialog(true);
        setShowReactivateDialog(false);
        fetchUsers(); // Refresh the user list
      } else {
        setErrorMessage(data.message || 'Failed to reactivate client');
        setShowErrorDialog(true);
        setShowReactivateDialog(false);
      }
    } catch (err) {
      console.error('Error reactivating client:', err);
      setErrorMessage('Failed to reactivate client. Please try again.');
      setShowErrorDialog(true);
      setShowReactivateDialog(false);
    } finally {
      setUserIdToReactivate(null);
    }
  };

  const handleReactivateDialogClose = () => {
    setShowReactivateDialog(false);
    setUserIdToReactivate(null);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhone('');
    setAddress('');
    setChangePassword(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setErrors({});
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showSuccessDialog) {
        handleSuccessDialogClose();
      } else if (showErrorDialog) {
        handleErrorDialogClose();
      } else if (showDeleteDialog) {
        handleDeleteDialogClose();
      } else if (showReactivateDialog) {
        handleReactivateDialogClose();
      } else if (showForm) {
        closeForm();
      }
    }
  };

  return (
    <div className='p-5 w-full'>
      <div className='mb-4 flex justify-between items-center'>
        <p className='text-xl font-semibold'>Manage Clients</p>
        <button onClick={() => {
          setShowForm(true);
          resetForm();
        }} className='bg-primary text-white px-4 py-2 rounded-full text-sm'>
          + Add Client
        </button>
      </div>

      {/* Search */}
      <div className='mb-4 flex gap-4 flex-wrap'>
        <div className='flex-1 min-w-[200px]'>
          <input
            type='text'
            placeholder='Search by Client ID...'
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className='w-full border px-3 py-2 rounded'
          />
        </div>
      </div>

      {loading ? (
        <div className='text-center py-10 text-gray-500'>⏳ Loading clients...</div>
      ) : (
        <div className='bg-white border rounded text-sm overflow-y-auto max-h-[60vh]'>
          <div className='grid grid-cols-7 gap-4 font-medium text-gray-600 p-4 border-b'>
            <p>ID</p>
            <p>Name</p>
            <p>Email</p>
            <p>Phone</p>
            <p>Address</p>
            <p>Status</p>
            <p>Action</p>
          </div>
          {filteredUsers.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>No clients found</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className='grid grid-cols-7 gap-4 p-4 border-b items-center text-gray-700'>
                <p className='text-xs font-mono truncate' title={user._id}>
                  {user._id.substring(0, 8)}...
                </p>
                <p>{user.fullName}</p>
                <p className='truncate'>{user.email}</p>
                <p>{user.phoneNumber}</p>
                <p className='truncate'>{user.address}</p>
                <p>
                  <span className={`px-2 py-1 rounded text-xs ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <div className='flex gap-2'>
                  <button onClick={() => handleEdit(user)} className='bg-yellow-400 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500'>Edit</button>
                  {user.active ? (
                    <button onClick={() => confirmDelete(user._id)} className='bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600'>Deactivate</button>
                  ) : (
                    <button onClick={() => confirmReactivate(user._id)} className='bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600'>Reactivate</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
          onClick={handleBackdropClick}
        >
          <form onSubmit={onSubmitHandler} className='bg-white p-6 rounded-xl max-w-2xl w-[90%] shadow-xl max-h-[90vh] overflow-y-auto'>
            <h3 className='text-lg font-semibold mb-4'>{selectedUser ? 'Edit Client' : 'Add Client'}</h3>
            
            {/* Client ID Display for Editing */}
            {selectedUser && (
              <div className='mb-4 p-3 bg-gray-50 rounded'>
                <label className='text-sm font-medium'>Client ID:</label>
                <p className='text-xs font-mono text-gray-600 mt-1'>{selectedUser._id}</p>
              </div>
            )}

            <div className='grid grid-cols-2 gap-6'>
              <div>
                <label className='text-sm'>Full Name</label>
                <input className='w-full border px-3 py-2 rounded mt-1' value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className='text-sm'>Email</label>
                <input className='w-full border px-3 py-2 rounded mt-1' value={email} onChange={(e) => setEmail(e.target.value)} required />
                {errors.email && <p className='text-xs text-red-600 mt-1'>{errors.email}</p>}
              </div>
              {!selectedUser && (
                <>
                  <div>
                    <label className='text-sm'>Password</label>
                    <input type='password' className='w-full border px-3 py-2 rounded mt-1' value={password} onChange={(e) => setPassword(e.target.value)} required />
                    {errors.password && <p className='text-xs text-red-600 mt-1'>{errors.password}</p>}
                  </div>
                  <div>
                    <label className='text-sm'>Confirm Password</label>
                    <input type='password' className='w-full border px-3 py-2 rounded mt-1' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    {errors.confirmPassword && <p className='text-xs text-red-600 mt-1'>{errors.confirmPassword}</p>}
                  </div>
                </>
              )}
              <div>
                <label className='text-sm'>Phone</label>
                <input
                  type="number"
                  className='w-full border px-3 py-2 rounded mt-1'
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                />
                {errors.phone && <p className='text-xs text-red-600 mt-1'>{errors.phone}</p>}
              </div>
              <div>
                <label className='text-sm'>Address</label>
                <input className='w-full border px-3 py-2 rounded mt-1' value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
            </div>

            {/* Change Password Section for Existing Clients */}
            {selectedUser && (
              <div className='mt-6 border-t pt-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h4 className='text-md font-medium'>Admin Password Reset</h4>
                  <button
                    type='button'
                    onClick={() => setChangePassword(!changePassword)}
                    className='text-primary text-sm hover:underline'
                  >
                    {changePassword ? 'Cancel Password Change' : 'Change Password'}
                  </button>
                </div>
                
                {changePassword && (
                  <div className='grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded'>
                    <div>
                      <label className='text-sm'>New Password</label>
                      <input 
                        type='password' 
                        className='w-full border px-3 py-2 rounded mt-1' 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder='Min 6 characters'
                      />
                      {errors.newPassword && <p className='text-xs text-red-600 mt-1'>{errors.newPassword}</p>}
                    </div>
                    <div>
                      <label className='text-sm'>Confirm New Password</label>
                      <input 
                        type='password' 
                        className='w-full border px-3 py-2 rounded mt-1' 
                        value={confirmNewPassword} 
                        onChange={(e) => setConfirmNewPassword(e.target.value)} 
                        placeholder='Confirm new password'
                      />
                      {errors.confirmNewPassword && <p className='text-xs text-red-600 mt-1'>{errors.confirmNewPassword}</p>}
                    </div>
                    <div className='col-span-2'>
                      <button
                        type='button'
                        onClick={handlePasswordChange}
                        className='bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700'
                      >
                        Update Password
                      </button>
                      <p className='text-xs text-gray-500 mt-2'>
                        ⚠️ This will immediately change the client's password. They will need to use this new password to login.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-end mt-6 gap-3'>
              <button type='submit' className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90'>
                {selectedUser ? 'Update Client' : 'Add Client'}
              </button>
              <button type='button' onClick={closeForm} className='ml-4 text-sm text-gray-500 hover:underline px-4 py-2 border rounded'>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Success Dialog */}
      {showSuccessDialog && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
          onClick={handleBackdropClick}
        >
          <div className='bg-white rounded-xl p-6 max-w-md w-[90%] text-center shadow-lg'>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h3 className='text-lg font-semibold text-green-600 mb-3'>Success</h3>
            <p className='text-sm text-gray-700 mb-4'>{successMessage}</p>
            <button 
              className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-colors'
              onClick={handleSuccessDialogClose}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Error Dialog */}
      {showErrorDialog && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
          onClick={handleBackdropClick}
        >
          <div className='bg-white rounded-xl p-6 max-w-md w-[90%] text-center shadow-lg'>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className='text-lg font-semibold text-red-600 mb-3'>Error</h3>
            <p className='text-sm text-gray-700 mb-4'>{errorMessage}</p>
            <button 
              className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition-colors'
              onClick={handleErrorDialogClose}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Reactivate Confirmation Dialog */}
      {showReactivateDialog && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
          onClick={handleBackdropClick}
        >
          <div className='bg-white rounded-xl p-6 max-w-md w-[90%] text-center shadow-lg'>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className='text-lg font-semibold text-green-600 mb-3'>Confirm Reactivation</h3>
            <p className='text-sm text-gray-700 mb-4'>Are you sure you want to reactivate this client's account? They will be able to log in again.</p>
            <div className='flex justify-center gap-4'>
              <button 
                onClick={handleReactivate} 
                className='bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors'
              >
                Yes, Reactivate
              </button>
              <button 
                onClick={handleReactivateDialogClose} 
                className='bg-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-400 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div 
          className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'
          onClick={handleBackdropClick}
        >
          <div className='bg-white rounded-xl p-6 max-w-md w-[90%] text-center shadow-lg'>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className='text-lg font-semibold text-red-600 mb-3'>Confirm Deactivation</h3>
            <p className='text-sm text-gray-700 mb-4'>Are you sure you want to deactivate this client's account? They will no longer be able to access the system.</p>
            <div className='flex justify-center gap-4'>
              <button 
                onClick={handleDelete} 
                className='bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors'
              >
                Yes, Deactivate
              </button>
              <button 
                onClick={handleDeleteDialogClose} 
                className='bg-gray-300 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-400 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageClients;