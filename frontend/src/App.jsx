import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Facilities from './pages/Facilities';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import Reservation from './pages/Reservation';
import MyReservation from './pages/MyReservation';
import MyProfile from './pages/MyProfile';
import Payment from './pages/Payment';
import ProcessPayment from './pages/ProcessPayment';
import PaymentSuccess from './pages/PaymentSuccess';
import EditReservation from './pages/EditReservation';
import CancelReservation from './pages/CancelReservation';
import Footer from './components/Footer';
import AuthProvider from './context/AuthContext';
import ToastProvider from './components/ToastProvider'; // ✅ Import ToastProvider

const App = () => {
  return (
    <AuthProvider>
      {/* ✅ ToastProvider goes outside layout but inside AuthProvider */}
      <ToastProvider />
      <div className='mx-4 sm:mx-[10%]'>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path='/' element={<Home />} />
          <Route path='/facilities' element={<Facilities />} />
          <Route path='/facilities/:category' element={<Facilities />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/reservation/:facId' element={<Reservation />} />
          <Route path='/my-reservations' element={<MyReservation />} />
          <Route path='/my-profile' element={<MyProfile />} />
          <Route path='/payment/:id' element={<Payment />} />
          <Route path='/process-payment/:reference' element={<ProcessPayment />} />
          <Route path='/payment-success' element={<PaymentSuccess />} />
          <Route path='/edit-reservation/:id' element={<EditReservation />} />
          <Route path='/cancel-reservation/:id' element={<CancelReservation />} />
          
        </Routes>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;
