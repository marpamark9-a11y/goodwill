import header_img from './header_img.png';
import profile_pic from './profile_pic.png';
import contact_image from './contact_image.png';
import about_image from './about_image.png';
import logo from './logo.svg';
import dropdown_icon from './dropdown_icon.svg';
import menu_icon from './menu_icon.svg';
import cross_icon from './cross_icon.png';
import chats_icon from './chats_icon.svg';
import verified_icon from './verified_icon.svg';
import arrow_icon from './arrow_icon.svg';
import info_icon from './info_icon.svg';
import upload_icon from './upload_icon.png';
import stripe_logo from './stripe_logo.png';
import razorpay_logo from './razorpay_logo.png';
import fac1 from './tennispic.png';
import fac2 from './Basketballpic.png';
import fac3 from './volleyballpic.png';
import fac4 from './badminton.png';
import fac5 from './pickle.png';
import volleyp from './volley.png';
import tennisp from './tennisball1.png';
import basketp from './basketball1.png';
import picklep from './pickle1.png';
import badminp from './badminton1.png';

import add_icon from './add_icon.svg'
import admin_logo from './admin_logo.svg'
import reservation_icon from './appointment_icon.svg'
import cancel_icon from './cancel_icon.svg'
import facilities_icon from './doctor_icon.svg'
import home_icon from './home_icon.svg'
import people_icon from './people_icon.svg'
import upload_area from './upload_area.svg'
import list_icon from './list_icon.svg'
import tick_icon from './tick_icon.svg'
import earning_icon from './earning_icon.svg'
import user_icon from './patients_icon.svg'


export const assets = {
    header_img,
    logo,
    chats_icon,
    verified_icon,
    info_icon,
    profile_pic,
    arrow_icon,
    contact_image,
    about_image,
    menu_icon,
    cross_icon,
    dropdown_icon,
    upload_icon,
    stripe_logo,
    razorpay_logo,
    add_icon,
    admin_logo,
    reservation_icon,
    cancel_icon,
    facilities_icon,
    upload_area,
    home_icon,
    user_icon,
    people_icon,
    list_icon,
    tick_icon,
    reservation_icon,
    earning_icon
};

export const categoryData = [
    {
        category: 'Tennis',
        image: tennisp
    },
    {
        category: 'Basketball',
        image: basketp
    },
    {
        category: 'VolleyBall',
        image: volleyp
    },
    {
        category: 'Badminton',
        image: badminp
    },
    {
        category: 'Pickleball',
        image: picklep
    },
];

export const facilities = [ 
    {
        _id: 'fac1',
        name: 'Tennis Facility',
        image: fac1,
        category: 'Tennis',
        about: 'A top-tier facility designed for tennis enthusiasts, featuring high-quality courts and professional training services.',
        openTime: '06:00', // Open at 6 AM
        closeTime: '19:00', // Close at 7 PM
        minBookingHours: 4, // Minimum 4 hours booking required
        pricingPackages: [
            { name: 'With Lights', description: 'Court rental with lighting for evening play', feePerHour: 15 },
            { name: 'Without Lights', description: 'Daytime court rental without lighting', feePerHour: 10 },
        ],
    },
    {
        _id: 'fac2',
        name: 'Basketball Facility',
        image: fac2,
        category: 'Basketball',
        about: 'A fully equipped indoor and outdoor basketball facility with coaching and competitive leagues available.',
        openTime: '08:00', // Open at 8 AM
        closeTime: '24:00', // Close at 10 PM
        minBookingHours: 1, // Minimum 2 hours booking required
        pricingPackages: [
            { name: 'Full Court', description: 'Rent the entire court for team games', feePerHour: 50 },
            { name: 'Half Court', description: 'Rent half of the court for smaller groups', feePerHour: 30 },
            { name: 'Training Session', description: 'Coaching and skill development', feePerHour: 40 },
        ],
    },
    {
        _id: 'fac3',
        name: 'Volleyball Facility',
        image: fac3,
        category: 'Volleyball',
        about: 'A modern volleyball facility with professional-grade courts for both recreational and competitive play.',
        openTime: '10:00', // Open at 10 AM
        closeTime: '21:00', // Close at 9 PM
        minBookingHours: 3, // Minimum 3 hours booking required
        pricingPackages: [
            { name: 'With Lights', description: 'Night game with lighting', feePerHour: 20 },
            { name: 'Without Lights', description: 'Daytime use without lighting', feePerHour: 15 },
            { name: 'VIP Court', description: 'Exclusive access with premium amenities', feePerHour: 35 },
            { name: 'Training Program', description: 'Coach-led volleyball training', feePerHour: 25 },
        ],
    },
    {
        _id: 'fac4',
        name: 'Badminton Facility',
        image: fac4,
        category: 'Badminton',
        about: 'A dedicated badminton space with high-quality courts and coaching services for players of all levels.',
        openTime: '07:00', // Open at 7 AM
        closeTime: '20:00', // Close at 8 PM
        minBookingHours: 1, // Minimum 1-hour booking required
        pricingPackages: [
            { name: 'Single Court', description: 'One court rental for singles or doubles play', feePerHour: 25 },
            { name: 'Multiple Courts', description: 'Discounted rate for booking two or more courts', feePerHour: 40 },
        ],
    },
    {
        _id: 'fac5',
        name: 'Pickleball Facility',
        image: fac5,
        category: 'Pickleball',
        about: 'A premier pickleball facility with dedicated courts and a community-focused environment.',
        openTime: '09:00', // Open at 9 AM
        closeTime: '18:00', // Close at 6 PM
        minBookingHours: 2, // Minimum 2 hours booking required
        pricingPackages: [
            { name: 'Standard', description: 'Court rental with standard amenities', feePerHour: 20 },
            { name: 'Premium', description: 'Includes training and advanced equipment', feePerHour: 35 },
            { name: 'Group Session', description: 'Booking for multiple players with coaching', feePerHour: 30 },
        ],
    },
];


// 🔹 Static Array of User Reservations
export const myReservations = [  
    {
        _id: 'res1',
        facilityId: 'fac1',
        facilityName: 'Tennis Facility',
        image: fac1,
        packageName: 'With Lights',
        packageFee: 15,
        totalPrice: 60, // 4-hour booking (15 * 4)
        totalHours: 4, // Total duration in hours
        date: '25, July, 2025',
        startTime: '06:00 AM',
        endTime: '10:00 PM',
        userId: 'user1',
        user: 'John Doe',
        status: 'Paid',
        datePaid: '24, July, 2024', // Date when payment was made
        dateCancelled: null,
        cancellationReason: null,
    },
    {
        _id: 'res2',
        facilityId: 'fac2',
        facilityName: 'Basketball Facility',
        image: fac2,
        packageName: 'Full Court',
        packageFee: 50,
        totalPrice: 100, // 2-hour booking (50 * 2)
        totalHours: 2,
        date: '30, July, 2024',
        startTime: '8:00 PM',
        endTime: '12:00 PM',
        userId: 'user2',
        user: 'Jane Smith',
        status: 'Pending', // Yet to be paid
        datePaid: null, // No payment yet
        dateCancelled: null,
        cancellationReason: null,
    },
    {
        _id: 'res3',
        facilityId: 'fac3',
        facilityName: 'Volleyball Facility',
        image: fac3,
        packageName: 'VIP Court',
        packageFee: 35,
        totalPrice: 105, // 3-hour session (35 * 3)
        totalHours: 3,
        date: '1, August, 2024',
        startTime: '4:00 PM',
        endTime: '7:00 PM',
        userId: 'user3',
        user: 'Alice Johnson',
        status: 'Cancelled', // User cancelled the booking
        datePaid: null, // Was never paid
        dateCancelled: '31, July, 2024', // Cancellation date
        cancellationReason: 'Personal reasons',
    },
    {
        _id: 'res4',
        facilityId: 'fac4',
        facilityName: 'Badminton Facility',
        image: fac4,
        packageName: 'Multiple Courts',
        packageFee: 40,
        totalPrice: 80, // 2-hour session (40 * 2)
        totalHours: 2,
        date: '5, August, 2024',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        userId: 'user4',
        user: 'Michael Brown',
        status: 'Paid',
        datePaid: '4, August, 2024', // Date of payment
        dateCancelled: null,
        cancellationReason: null,
    },
    {
        _id: 'res5',
        facilityId: 'fac5',
        facilityName: 'Pickleball Facility',
        image: fac5,
        packageName: 'Standard',
        packageFee: 20,
        totalPrice: 60, // 3-hour session (20 * 3)
        totalHours: 3,
        date: '10, August, 2024',
        startTime: '3:00 PM',
        endTime: '6:00 PM',
        userId: 'user1',
        user: 'Emily Davis',
        status: 'Pending', // Payment not completed
        datePaid: null, // No payment yet
        dateCancelled: null,
        cancellationReason: null,
    },
    {
        _id: 'res6',
        facilityId: 'fac1',
        facilityName: 'Tennis Facility',
        image: fac1,
        packageName: 'Without Lights',
        packageFee: 10,
        totalPrice: 40, // 4-hour booking (10 * 4)
        totalHours: 4,
        date: '12, August, 2024',
        startTime: '6:30 PM',
        endTime: '10:30 PM',
        userId: 'user1',
        user: 'Sophia Martinez',
        status: 'Cancelled', // Booking cancelled
        datePaid: null, // Was never paid
        dateCancelled: '10, August, 2024', // Cancellation date
        cancellationReason: 'Facility maintenance issue',
    }
];

export const users = [ 
    {
        _id: 'user1',
        fullName: 'John Doe',
        email: 'user@gmail.com',
        password: 'user', // Hashed password (Use proper hashing in production)
        phoneNumber: '09123456789',
        address: '123 Main Street, Cityville, Country',
        isAdmin: false, // Regular User
    },
    {
        _id: 'user2',
        fullName: 'Jane Smith',
        email: 'admin@gmail.com',
        password: 'admin', // Hashed password
        phoneNumber: '09223334455',
        address: '456 Elm Street, Townsville, Country',
        isAdmin: true, // Admin User
    },
];
