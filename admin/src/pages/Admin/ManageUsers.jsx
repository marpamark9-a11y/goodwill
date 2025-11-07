import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageUsers = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate();

  if (!user || user.userType !== 'admin') {
    return (
      <div className="p-6 text-red-600 font-semibold text-center">
        ❌ Access Denied. Only admins can manage users.
      </div>
    );
  }

  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState('all');
  const [searchId, setSearchId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState(null);
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
        setUsers(data.users || []);
      } else {
        setErrorMessage(data.message || 'Failed to load users');
        setShowErrorDialog(true);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setErrorMessage('Failed to load users. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on role and search ID
  const filteredUsers = users.filter((u) => {
    // Only show staff and admin users
    const isStaffOrAdmin = u.userType === 'staff' || u.userType === 'admin';
    const matchesRole = filterRole === 'all' || u.userType === filterRole;
    const matchesSearch = searchId === '' || u._id.toLowerCase().includes(searchId.toLowerCase());
    return isStaffOrAdmin && matchesRole && matchesSearch;
  });

  const handleEdit = (user) => {
    setSelectedUser(user);
    setName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setConfirmPassword('');
    setRole(user.userType);
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
        setSuccessMessage('User deleted successfully!');
        setShowSuccessDialog(true);
        setShowDeleteDialog(false);
        fetchUsers(); // Refresh the user list
      } else {
        setErrorMessage(data.message || 'Failed to delete user');
        setShowErrorDialog(true);
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setErrorMessage('Failed to delete user. Please try again.');
      setShowErrorDialog(true);
      setShowDeleteDialog(false);
    } finally {
      setUserIdToDelete(null);
    }
  };

  // ADMIN: Change password for any user
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
      // Use the admin change password endpoint
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
      
      // FIXED: Check both HTTP status and success property
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

    const payload = { fullName: name, email, userType: role, phoneNumber: phone, address };
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
      
      // FIXED: Check both HTTP status and success indicators
      if (res.ok && (data.success || data.message?.includes('success') || data.message?.includes('added') || data.message?.includes('updated'))) {
        setSuccessMessage(selectedUser ? 'User updated successfully!' : 'User added successfully!');
        setShowSuccessDialog(true);
        setShowForm(false);
        resetForm();
        fetchUsers(); // Refresh the user list
      } else {
        setErrorMessage(data.message || `Failed to ${selectedUser ? 'update' : 'add'} user`);
        setShowErrorDialog(true);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setErrorMessage(`Failed to ${selectedUser ? 'update' : 'add'} user. Please try again.`);
      setShowErrorDialog(true);
    }
  };

  // FIXED: Enhanced success dialog close handler
  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setSuccessMessage('');
    // Close any other open dialogs
    setShowForm(false);
    setShowDeleteDialog(false);
    setShowErrorDialog(false);
    // Reset form if it was open
    resetForm();
  };

  // FIXED: Enhanced error dialog close handler
  const handleErrorDialogClose = () => {
    setShowErrorDialog(false);
    setErrorMessage('');
  };

  const handleDeleteDialogClose = () => {
    setShowDeleteDialog(false);
    setUserIdToDelete(null);
  };

  const resetForm = () => {
    setSelectedUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('staff');
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

  // FIXED: Close dialog when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showSuccessDialog) {
        handleSuccessDialogClose();
      } else if (showErrorDialog) {
        handleErrorDialogClose();
      } else if (showDeleteDialog) {
        handleDeleteDialogClose();
      } else if (showForm) {
        closeForm();
      }
    }
  };

  return (
    <div className='p-5 w-full'>
      <div className='mb-4 flex justify-between items-center'>
        <p className='text-xl font-semibold'>Manage Staff</p>
        <button onClick={() => {
          setShowForm(true);
          resetForm();
        }} className='bg-primary text-white px-4 py-2 rounded-full text-sm'>
          + Add Staff
        </button>
      </div>

      {/* Filters and Search */}
      <div className='mb-4 flex gap-4 flex-wrap'>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className='border px-3 py-2 rounded'>
          <option value='all'>All Staff</option>
          <option value='admin'>Admin</option>
          <option value='staff'>Staff</option>
        </select>
        
        <div className='flex-1 min-w-[200px]'>
          <input
            type='text'
            placeholder='Search by User ID...'
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className='w-full border px-3 py-2 rounded'
          />
        </div>
      </div>

      {loading ? (
        <div className='text-center py-10 text-gray-500'>⏳ Loading users...</div>
      ) : (
        <div className='bg-white border rounded text-sm overflow-y-auto max-h-[60vh]'>
          <div className='grid grid-cols-6 gap-4 font-medium text-gray-600 p-4 border-b'>
            <p>ID</p>
            <p>Name</p>
            <p>Email</p>
            <p>Role</p>
            <p>Phone</p>
            <p>Action</p>
          </div>
          {filteredUsers.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>No users found</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user._id} className='grid grid-cols-6 gap-4 p-4 border-b items-center text-gray-700'>
                <p className='text-xs font-mono truncate' title={user._id}>
                  {user._id.substring(0, 8)}...
                </p>
                <p>{user.fullName}</p>
                <p className='truncate'>{user.email}</p>
                <p className='capitalize'>{user.userType}</p>
                <p>{user.phoneNumber}</p>
                <div className='flex gap-2'>
                  <button onClick={() => handleEdit(user)} className='bg-yellow-400 text-white px-2 py-1 rounded text-xs hover:bg-yellow-500'>Edit</button>
                  {user.userType !== 'admin' && (
                    <button onClick={() => confirmDelete(user._id)} className='bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600'>Delete</button>
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
            <h3 className='text-lg font-semibold mb-4'>{selectedUser ? 'Edit User' : 'Add Staff / User'}</h3>
            
            {/* User ID Display for Editing */}
            {selectedUser && (
              <div className='mb-4 p-3 bg-gray-50 rounded'>
                <label className='text-sm font-medium'>User ID:</label>
                <p className='text-xs font-mono text-gray-600 mt-1'>{selectedUser._id}</p>
                <label className='text-sm font-medium mt-2 block'>Current Role:</label>
                <p className='text-sm capitalize text-gray-600'>{selectedUser.userType}</p>
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
                <label className='text-sm'>Role</label>
                <select className='w-full border px-3 py-2 rounded mt-1' value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value='staff'>Staff</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>
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

            {/* Change Password Section for Existing Users */}
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
                        ⚠️ This will immediately change the user's password. They will need to use this new password to login.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className='flex justify-end mt-6 gap-3'>
              <button type='submit' className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90'>
                {selectedUser ? 'Update User' : 'Add User'}
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
            <h3 className='text-lg font-semibold text-red-600 mb-3'>Confirm Deletion</h3>
            <p className='text-sm text-gray-700 mb-4'>Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className='flex justify-center gap-4'>
              <button 
                onClick={handleDelete} 
                className='bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors'
              >
                Yes, Delete
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

export default ManageUsers;