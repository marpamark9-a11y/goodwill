import React from 'react'
import { assets } from '../assets/assets'

const About = () => {
  return (
    <div>

      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>ABOUT <span className='text-gray-700 font-semibold'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.about_image} alt="About Goodwill" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <b className='text-gray-800'>Our Mission</b>
          <p>
            At Goodwill, our mission is to make sports facility booking simple, fast, and accessible. 
            We help sports enthusiasts, teams, and event organizers find and reserve top-quality venues 
            with just a few clicks. Whether it’s a basketball court, football field, badminton gym, or 
            any other facility — we make it easier to play your game.
          </p>

          <p>
            We aim to support local communities by connecting them with facility providers, ensuring 
            that every game, training, or event gets the space it needs to succeed.
          </p>

          <b className='text-gray-800'>Our Vision</b>
          <p>
            Our vision at Goodwill is to become the leading platform for sports facility reservations in 
            the region. We strive to create a future where booking a court or field is as seamless as 
            ordering food online — empowering people to stay active, social, and healthy.
          </p>
        </div>
      </div>

      <div className='text-xl my-4'>
        <p>WHY <span className='text-gray-700 font-semibold'>CHOOSE US</span></p>
      </div>

      <div className='flex flex-col md:flex-row mb-20'>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>EFFICIENCY:</b>
          <p>Book your preferred sports facility in seconds with our intuitive system.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>CONVENIENCE:</b>
          <p>Reserve anywhere, anytime — no need to call or visit the facility in person.</p>
        </div>
        <div className='border px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer'>
          <b>PERSONALIZATION:</b>
          <p>Receive booking reminders, special offers, and venue suggestions based on your activity.</p>
        </div>
      </div>

    </div>
  )
}

export default About
