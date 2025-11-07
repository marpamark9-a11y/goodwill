import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className='flex justify-between items-center px-4 sm:px-10 py-3 border-b bg-white'>
      <div className='flex items-center gap-2 text-xs'>
        <img 
          onClick={() => navigate(user ? (user.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard') : '/')} 
          className='w-36 sm:w-40 cursor-pointer' 
          src={assets.logo} 
          alt="Logo" 
        />
        {user && (
          <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600'>
            {user.role === 'admin' ? 'Admin' : 'Staff'}
          </p>
        )}
      </div>
      {user && (
        <button 
          onClick={handleLogout} 
          className='bg-primary text-white text-sm px-10 py-2 rounded-full'
        >
          Logout
        </button>
      )}
    </div>
  )
}

export default Navbar