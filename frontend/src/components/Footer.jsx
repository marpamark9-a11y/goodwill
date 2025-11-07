import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className='md:mx-10'>
      <div className='flex flex-col sm:grid grid-cols-1 md:grid-cols-4 gap-14 my-10 mt-40 text-sm'>

        <div>
          <img className='mb-5 w-40' src={assets.logo} alt="Goodwill Logo" />
          <p className='w-full md:w-2/3 text-gray-600 leading-6'>
            Goodwill is your go-to platform for reserving top-quality sports facilities. 
            Whether you're planning a friendly match or organizing a tournament, 
            we make it easy to find, book, and enjoy your favorite sports venues.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GOODWILL</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li><a href='/'>Home</a></li>
            <li><a href='/about'>About Us</a></li>
            <li><a href='/facilities'>Facilities</a></li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+63 941 750 07926</li>
            <li>+63 951 539 9549</li>
            <li>support@goodwillsports.com</li>
          </ul>
        </div>

        {/* Map Column */}
        <div>
          <p className='text-xl font-medium mb-5'>OUR LOCATION</p>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3951.938783019825!2d125.10017737476737!3d7.901464692121578!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32ff1952a314b9e9%3A0x19e4d9913c92a043!2sVALENCIA%20GOODWILL%20GIANTS%20SPORTS%20TOWN!5e0!3m2!1sen!2sph!4v1743436744624!5m2!1sen!2sph"
            width="200"
            height="200"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Goodwill Map"
          ></iframe>
        </div>
      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>© 2025 Goodwill Sports Reservation — All Rights Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
