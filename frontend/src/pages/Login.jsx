import React, { useState, useContext } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline' // 👁 Heroicons

const Login = () => {
  const [state, setState] = useState('Login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('') // confirm password
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const BASE_URL = import.meta.env.VITE_BACKEND_URL

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (state === 'Sign Up' && password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (state === 'Login') {
      try {
        const res = await axios.post(`${BASE_URL}/api/user/login`, { email, password })
        const { user, token } = res.data
        login(user, token)
        setSuccess('Login successful!')

        setTimeout(() => {
          if (user.userType === 'admin') navigate('/my-reservations')
          else if (user.userType === 'staff') navigate('/my-reservations')
          else navigate('/my-reservations')
        }, 1500)
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed.')
      }
    } else {
      try {
        await axios.post(`${BASE_URL}/api/user/register`, {
          _id: `U${Date.now()}`,
          fullName,
          email,
          password,
          phoneNumber: '',
          address: '',
          userType: 'user'
        })
        setSuccess('Account created successfully. Please log in.')
        setState('Login')
      } catch (err) {
        setError(err.response?.data?.message || 'Sign-up failed.')
      }
    }
  }

  const loginAsGuest = () => {
    const guestUser = {
      _id: `GUEST_${Date.now()}`,
      fullName: 'Guest User',
      email: 'guest@local',
      userType: 'guest'
    };
    // Use empty string for token so AuthContext saves a consistent value
    login(guestUser, '');
    setSuccess('Logged in as guest');
    setTimeout(() => navigate('/my-reservations'), 500);
  };

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? 'Create Account' : 'Login'}</p>
        <p>Please {state === 'Sign Up' ? 'sign up' : 'log in'} to book a reservation</p>

        {error && <p className='text-red-600'>{error}</p>}
        {success && <p className='text-green-600'>{success}</p>}

        {state === 'Sign Up' && (
          <div className='w-full'>
            <p>Full Name</p>
            <input
              type='text'
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className='border border-zinc-300 rounded w-full p-2 mt-1'
            />
          </div>
        )}

        <div className='w-full'>
          <p>Email</p>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className='border border-zinc-300 rounded w-full p-2 mt-1'
          />
        </div>

        {/* Password */}
        <div className='w-full relative'>
          <p>Password</p>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className='border border-zinc-300 rounded w-full p-2 mt-1 pr-10'
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

        {/* Confirm Password - Only for Sign Up */}
        {state === 'Sign Up' && (
          <div className='w-full relative'>
            <p>Confirm Password</p>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className='border border-zinc-300 rounded w-full p-2 mt-1 pr-10'
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className='absolute right-3 top-9 cursor-pointer text-gray-500'
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className='h-5 w-5' />
              ) : (
                <EyeIcon className='h-5 w-5' />
              )}
            </span>
          </div>
        )}

        {/* Forgot Password link */}
        {state === 'Login' && (
          <div className='w-full text-right'>
            <span
              onClick={() => navigate('/forgot-password')}
              className='text-primary underline cursor-pointer text-sm'
            >
              Forgot Password?
            </span>
          </div>
        )}

        <button className='bg-primary text-white w-full py-2 rounded-md text-base'>
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>

        {/* Guest login button */}
        {state === 'Login' && (
          <button type='button' onClick={loginAsGuest} className='w-full mt-2 py-2 border rounded-md text-base'>
            Continue as Guest
          </button>
        )}

        {state === 'Sign Up' ? (
          <p>
            Already have an account?{' '}
            <span onClick={() => setState('Login')} className='text-primary underline cursor-pointer'>
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create a new account?{' '}
            <span onClick={() => setState('Sign Up')} className='text-primary underline cursor-pointer'>
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  )
}

export default Login
