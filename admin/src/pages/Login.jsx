import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

const Login = () => {
  const [state, setState] = useState('Admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const BASE_URL = import.meta.env.VITE_BACKEND_URL

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await axios.post(`${BASE_URL}/api/user/login`, {
        email,
        password,
      })

      const { token, user } = response.data
      login(user, token)
      setSuccess('Login successful! Redirecting...')

      setTimeout(() => {
        if (user.userType === 'admin') {
          navigate('/admin-dashboard')
        } else if (user.userType === 'staff') {
          navigate('/staff-dashboard')
        } else {
          navigate('/my-reservations')
        }
      }, 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='text-2xl font-semibold m-auto'>
          <span className='text-primary'>{state}</span> Login
        </p>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <div className='w-full'>
          <p>Email</p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className='border border-[#DADADA] rounded w-full p-2 mt-1'
            type="email"
            required
          />
        </div>

        {/* Password with eye icon */}
        <div className='w-full relative'>
          <p>Password</p>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className='border border-[#DADADA] rounded w-full p-2 mt-1 pr-10'
            type={showPassword ? 'text' : 'password'}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-9 cursor-pointer text-gray-500'
          >
            {showPassword ? (
              <EyeSlashIcon className='h-5 w-5' />
            ) : (
              <EyeIcon className='h-5 w-5' />
            )}
          </span>
        </div>

        <button
          className='bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-50'
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {state === 'Admin' ? (
          <p>
            Staff Login?{' '}
            <span
              onClick={() => setState('Staff')}
              className='text-primary underline cursor-pointer'
            >
              Click here
            </span>
          </p>
        ) : (
          <p>
            Admin Login?{' '}
            <span
              onClick={() => setState('Admin')}
              className='text-primary underline cursor-pointer'
            >
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  )
}

export default Login