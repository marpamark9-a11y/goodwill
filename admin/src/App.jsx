import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider, useAuth } from './context/AuthContext'

// Components
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

// Admin Pages
import Dashboard from './pages/Admin/Dashboard'
import AllAppointments from './pages/Admin/ManageReservation'
import AddDoctor from './pages/Admin/ManageUsers'
import DoctorsList from './pages/Admin/ManageFacility'
import AddFacility from './pages/Admin/AddFacility'
import AddAdminReservation from './pages/Admin/AddReservation'
import Reports from './pages/Admin/Reports'
import ManageClients from './pages/Admin/ManageClients'

// Staff Pages
import DoctorAppointments from './pages/Staff/StaffReservation'
import DoctorDashboard from './pages/Staff/StaffDashboard'
import DoctorProfile from './pages/Staff/StaffProfile'
import AddStaffReservation from './pages/Staff/AddReservation'

// Auth/Login
import Login from './pages/Login'
import UserLogs from './pages/Admin/UserLogs';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

const MainLayout = ({ children }) => {
  return (
    <div className='bg-[#F8F9FD]'>
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        {children}
      </div>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <ToastContainer />
      <Routes>
        {/* PUBLIC ROUTE */}
        <Route path="/" element={<Login />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />






<Route
  path="/reports"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <MainLayout>
        <Reports />
      </MainLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/user-logs"
  element={
    <ProtectedRoute allowedRoles={['admin', 'staff']}>
      <MainLayout>
        <UserLogs />
      </MainLayout>
    </ProtectedRoute>
  }
/>

        
        <Route path="/manage-reservations" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AllAppointments />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/manage-users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AddDoctor />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/manage-facilities" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <DoctorsList />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/manage-clients" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <ManageClients />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* ✅ ADD + EDIT FACILITY ROUTES */}
        <Route path="/add-facility" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AddFacility />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/add-facility/:id" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AddFacility />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/create-admin-reservation" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AddAdminReservation />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* STAFF ROUTES */}
        <Route path="/staff-dashboard" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <MainLayout>
              <DoctorDashboard />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/staff-reservations" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <MainLayout>
              <DoctorAppointments />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/staff-profile" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <MainLayout>
              <DoctorProfile />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/create-staff-reservation" element={
          <ProtectedRoute allowedRoles={['staff']}>
            <MainLayout>
              <AddStaffReservation />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App
