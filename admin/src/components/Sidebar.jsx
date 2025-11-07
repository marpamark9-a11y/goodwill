import React from 'react'
import { assets } from '../assets/assets'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className='min-h-screen bg-white border-r'>
      <ul className='text-[#515151] mt-5'>
        {user.role === 'admin' ? (
          <>
            {/* Admin Links */}
            <NavLink
              to="/admin-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.home_icon} alt='' />
              <p className='hidden md:block'>Dashboard</p>
            </NavLink>

            <NavLink
              to="/manage-reservations"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.appointment_icon} alt='' />
              <p className='hidden md:block'>Manage Reservations</p>
            </NavLink>

            {/* Manage Users Section */}
            <div>
              <div className="flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72">
                <img className='min-w-5' src={assets.people_icon} alt='' />
                <p className='hidden md:block font-medium'>Manage Users</p>
              </div>
              
              <NavLink
                to="/manage-users"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 px-3 md:px-14 md:min-w-72 cursor-pointer ${
                    isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                  }`
                }
              >
                <img className='min-w-5' src={assets.add_icon} alt='' />
                <p className='hidden md:block'>Manage Staff</p>
              </NavLink>

              <NavLink
                to="/manage-clients"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-2.5 px-3 md:px-14 md:min-w-72 cursor-pointer ${
                    isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                  }`
                }
              >
                <img className='min-w-5' src={assets.people_icon} alt='' />
                <p className='hidden md:block'>Manage Client</p>
              </NavLink>
            </div>

            <NavLink
              to="/manage-facilities"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.people_icon} alt='' />
              <p className='hidden md:block'>Manage Facilities</p>
            </NavLink>

            {/* Reports Link */}
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.list_icon} alt='' />
              <p className='hidden md:block'>Reports</p>
            </NavLink>

            {/* User Logs Link for Admin */}
            <NavLink
              to="/user-logs"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.appointment_icon} alt='' />
              <p className='hidden md:block'>User Logs</p>
            </NavLink>
          </>
        ) : (
          <>
            {/* Staff Links */}
            <NavLink
              to="/staff-dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.home_icon} alt='' />
              <p className='hidden md:block'>Dashboard</p>
            </NavLink>

            <NavLink
              to="/staff-reservations"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.appointment_icon} alt='' />
              <p className='hidden md:block'>Reservations</p>
            </NavLink>

            <NavLink
              to="/staff-profile"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.people_icon} alt='' />
              <p className='hidden md:block'>Profile</p>
            </NavLink>

            {/* New User Logs Link for Staff */}
            <NavLink
              to="/user-logs"
              className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${
                  isActive ? 'bg-[#F2F3FF] border-r-4 border-primary' : ''
                }`
              }
            >
              <img className='min-w-5' src={assets.appointment_icon} alt='' />
              <p className='hidden md:block'>User Logs</p>
            </NavLink>
          </>
        )}
      </ul>
    </div>
  )
}

export default Sidebar
