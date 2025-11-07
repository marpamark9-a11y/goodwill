import React, { useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { useAuth } from '../../context/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const token = localStorage.getItem('token')
  const backendURL = import.meta.env.VITE_BACKEND_URL

  const [dashData, setDashData] = useState(null)
  const [latestReservations, setLatestReservations] = useState([])
  const [currentSales, setCurrentSales] = useState(null)
  const [currentReservations, setCurrentReservations] = useState(null)
  const [error, setError] = useState(null)

  // Fetch dashboard summary data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${backendURL}/api/admin/dashboard/summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json()

        if (!res.ok) {
          console.error('API error:', data)
          setError(data.message || 'Failed to load dashboard')
          return
        }

        setDashData(data)
        setCurrentSales({
          type: "Today's Sales",
          value: data.sales.today,
          color: 'text-green-600'
        })
        setCurrentReservations({
          type: "Today's Reservations",
          value: data.reservations.today,
          color: 'text-green-600'
        })
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Something went wrong while fetching dashboard data')
      }
    }

    if (token && user?.role === 'admin') {
      fetchDashboardData()
    }
  }, [token, user, backendURL])

  // Fetch latest reservations using the same API as AllReservations
  useEffect(() => {
    const fetchLatestReservations = async () => {
      try {
        const res = await fetch(`${backendURL}/api/reservation/list`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()
        if (res.ok && Array.isArray(data.reservations)) {
          // Get the latest 5 reservations
          const latest = data.reservations
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
            .slice(0, 5)
          setLatestReservations(latest)
        }
      } catch (err) {
        console.error('Error fetching latest reservations:', err.message)
      }
    }

    if (token) {
      fetchLatestReservations()
    }
  }, [token, backendURL])

  if (!user || user.role !== 'admin') {
    return <div className="text-red-600 font-semibold p-5">Unauthorized Access</div>
  }

  if (error) {
    return <div className="text-red-500 font-medium p-5">{error}</div>
  }

  if (!dashData || !currentSales || !currentReservations) {
    return <div className="p-5 text-gray-500">Loading dashboard...</div>
  }

  const handleSalesCardClick = () => {
    const options = [
      { type: "Today's Sales", value: dashData.sales.today, color: 'text-green-600' },
      { type: "Yesterday's Sales", value: dashData.sales.yesterday, color: 'text-yellow-600' },
      { type: "Monthly Sales", value: dashData.sales.monthly, color: 'text-purple-600' },
      { type: "Annual Sales", value: dashData.sales.annually, color: 'text-rose-600' }
    ]
    const random = Math.floor(Math.random() * options.length)
    setCurrentSales(options[random])
  }

  const handleReservationCardClick = () => {
    const options = [
      { type: "Today's Reservations", value: dashData.reservations.today, color: 'text-green-600' },
      { type: "Yesterday's Reservations", value: dashData.reservations.yesterday, color: 'text-yellow-600' },
      { type: "Monthly Reservations", value: dashData.reservations.monthly, color: 'text-purple-600' },
      { type: "Annual Reservations", value: dashData.reservations.annually, color: 'text-rose-600' }
    ]
    const random = Math.floor(Math.random() * options.length)
    setCurrentReservations(options[random])
  }

  const slotDateFormat = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateStr).toLocaleDateString(undefined, options)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'text-green-500';
      case 'Pending': return 'text-yellow-500';
      case 'Completed': return 'text-blue-500';
      case 'Cancelling': return 'text-orange-500';
      case 'Cancelled': return 'text-red-400';
      default: return 'text-gray-500';
    }
  }

  return (
    <div className='m-5'>
      <div className='flex flex-wrap gap-3'>
        <DashboardCard icon={assets.doctor_icon} label="Facilities" value={dashData.totalFacilities} />

        <div onClick={handleReservationCardClick} className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-indigo-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="" />
          <div>
            <p className={`text-xl font-semibold ${currentReservations.color}`}>{currentReservations.value}</p>
            <p className='text-gray-400'>{currentReservations.type}</p>
          </div>
        </div>

        {/* <DashboardCard icon={assets.patients_icon} label="Registered Customer" value={dashData.totalCustomers} /> */}

        <div onClick={handleSalesCardClick} className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-green-100 cursor-pointer hover:scale-105 transition-all'>
          <img className='w-14' src={assets.sales_icon || assets.appointments_icon} alt="" />
          <div>
            <p className={`text-xl font-semibold ${currentSales.color}`}>₱{currentSales.value.toLocaleString()}</p>
            <p className='text-gray-400'>{currentSales.type}</p>
          </div>
        </div>

        <DashboardCard icon={assets.sales_icon} label="Total Staff" value={dashData.totalStaff} color="text-orange-600" />
      </div>

      <div className='bg-white mt-8 rounded-lg border'>
        <div className='flex items-center gap-2.5 px-6 py-4 border-b'>
          <img src={assets.list_icon} alt="" className='w-5 h-5' />
          <p className='font-semibold text-lg'>Latest Reservations</p>
        </div>

        <div className='p-4'>
          {latestReservations.map((item, index) => (
            <div className='flex items-center px-4 py-3 gap-4 hover:bg-gray-50 rounded-lg transition-colors mb-2 last:mb-0' key={item._id || index}>
              {/* Facility Image */}
              <div className='flex items-center gap-2 flex-shrink-0'>
                <img 
                  src={item.image || 'https://via.placeholder.com/40'} 
                  className='w-12 h-12 rounded-full bg-gray-200 object-cover' 
                  alt={item.facilityName}
                />
              </div>
              
              {/* Reservation Details */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <p className='text-gray-800 font-medium text-sm'>{item.facilityName}</p>
                  <span className='text-gray-300'>•</span>
                  <p className='text-gray-600 text-xs'>{item.packageName}</p>
                </div>
                
                <div className='flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                  <span>{slotDateFormat(item.date)}</span>
                  <span className='text-gray-300'>•</span>
                  <span>{item.startTime} - {item.endTime}</span>
                  <span className='text-gray-300'>•</span>
                  <span>{item.userName}</span>
                </div>

                <div className='flex items-center gap-3 mt-1 text-xs text-gray-500'>
                  <span>Total: ₱{item.totalPrice}</span>
                  {item.paymentType && (
                    <>
                      <span className='text-gray-300'>•</span>
                      <span>Payment: {item.paymentType}</span>
                    </>
                  )}
                  {item.paymentReference && item.paymentType !== 'Cash' && (
                    <>
                      <span className='text-gray-300'>•</span>
                      <span>Ref: {item.paymentReference}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status and Actions */}
              <div className='flex-shrink-0 text-right'>
                <p className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </p>
                <p className='text-gray-500 text-xs mt-1'>
                  {item.totalHours || 'N/A'} hrs
                </p>
              </div>
            </div>
          ))}
          
          {latestReservations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recent reservations
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DashboardCard = ({ icon, label, value, color = 'text-gray-600' }) => (
  <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 cursor-pointer hover:scale-105 transition-all'>
    <img className='w-14' src={icon} alt="" />
    <div>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
      <p className='text-gray-400'>{label}</p>
    </div>
  </div>
)

export default Dashboard