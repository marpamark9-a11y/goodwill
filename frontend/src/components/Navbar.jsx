import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
      <img onClick={() => navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="Logo" />

      <ul className='md:flex items-start gap-5 font-medium hidden'>
        <NavLink to='/' className={({ isActive }) => isActive && location.pathname !== '/login' ? 'text-primary' : ''}><li className='py-1'>HOME</li></NavLink>
        <NavLink to='/facilities'><li className='py-1'>ALL FACILITIES</li></NavLink>
        <NavLink to='/about'><li className='py-1'>ABOUT</li></NavLink>
        <NavLink to='/contact'><li className='py-1'>CONTACT</li></NavLink>
      </ul>

      <div className='flex items-center gap-4'>
        {user ? (
          <div className='flex items-center gap-2 cursor-pointer group relative'>
            <img className='w-8 h-8 object-cover rounded-full' src={user.image ? user.image : assets.profile_pic} alt="User" />
            <img className='w-2.5' src={assets.dropdown_icon} alt="Dropdown Icon" />
            <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
              <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                <p onClick={() => navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                <p onClick={() => navigate('/my-reservations')} className='hover:text-black cursor-pointer'>My Reservations</p>
                <hr className="border-t border-gray-300" />
                <p onClick={() => { logout(); navigate('/'); }} className='hover:text-black cursor-pointer'>Logout</p>
              </div>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>
            Login
          </button>
        )}

        <img onClick={() => setShowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="Menu Icon" />

        {/* ---- Mobile Menu ---- */}
        <div className={`md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all ${showMenu ? 'fixed w-full' : 'h-0 w-0'}`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img src={assets.logo} className='w-36' alt="Logo" />
            <img onClick={() => setShowMenu(false)} src={assets.cross_icon} className='w-7' alt="Close Icon" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={() => setShowMenu(false)} to='/' className={({ isActive }) => isActive && location.pathname !== '/login' ? 'text-primary' : ''}><p className='px-4 py-2 rounded full inline-block'>HOME</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/facilities'><p className='px-4 py-2 rounded full inline-block'>ALL FACILITIES</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/about'><p className='px-4 py-2 rounded full inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={() => setShowMenu(false)} to='/contact'><p className='px-4 py-2 rounded full inline-block'>CONTACT</p></NavLink>

            {!user && (
              <p
                className='px-4 py-2 rounded-full bg-primary text-white text-center w-full mt-3 cursor-pointer'
                onClick={() => { setShowMenu(false); navigate('/login'); }}
              >
                Login
              </p>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;