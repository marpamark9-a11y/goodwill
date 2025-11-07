import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { assets } from '../../assets/assets';

const StaffDashboard = () => {
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const currency = '₱';

  const [sales, setSales] = useState(0);
  const [reservations, setReservations] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [latestReservations, setLatestReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) {
        setError('No authentication token found');
        setLoading(false);
        return;
      }

      const headers = { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      try {
        setLoading(true);
        setError('');

        const [salesRes, resRes, custRes, allRes] = await Promise.all([
          axios.post(`${baseUrl}/api/staff/sales/today`, {}, { headers }),
          axios.post(`${baseUrl}/api/staff/reservations/today`, {}, { headers }),
          axios.post(`${baseUrl}/api/staff/customers/today`, {}, { headers }),
          // Use the same API as AllReservations and StaffReservation
          axios.get(`${baseUrl}/api/reservation/list`, { headers })
        ]);

        console.log('Sales API Response:', salesRes.data);
        console.log('Reservations API Response:', resRes.data);
        console.log('Customers API Response:', custRes.data);
        console.log('All Reservations API Response:', allRes.data);

        // Handle different possible response structures for sales
        const salesData = salesRes.data;
        let todaySales = 0;
        
        if (typeof salesData === 'number') {
          todaySales = salesData;
        } else if (typeof salesData === 'object') {
          todaySales = salesData.sales || 
                       salesData.totalSales || 
                       salesData.todaySales || 
                       salesData.amount || 
                       salesData.total || 
                       0;
        }
        
        setSales(todaySales);

        // Handle reservations count
        const reservationsData = resRes.data;
        let todayReservations = 0;
        
        if (typeof reservationsData === 'number') {
          todayReservations = reservationsData;
        } else if (typeof reservationsData === 'object') {
          todayReservations = reservationsData.totalReservations || 
                             reservationsData.reservations || 
                             reservationsData.count || 
                             reservationsData.total || 
                             0;
        }
        
        setReservations(todayReservations);

        // Handle customers count
        const customersData = custRes.data;
        let todayCustomers = 0;
        
        if (typeof customersData === 'number') {
          todayCustomers = customersData;
        } else if (typeof customersData === 'object') {
          todayCustomers = customersData.totalCustomers || 
                          customersData.customers || 
                          customersData.count || 
                          customersData.total || 
                          0;
        }
        
        setCustomers(todayCustomers);

        // Handle reservations list - get latest 5 reservations
        const allReservationsData = allRes.data;
        const reservationsList = allReservationsData.reservations || 
                               allReservationsData.data || 
                               allReservationsData || 
                               [];
        
        // Filter reservations handled by current staff or pending
        const currentStaffId = JSON.parse(localStorage.getItem('user'))?._id;
        const filteredReservations = reservationsList.filter((item) => {
          if (item.status === 'Pending' && !item.handledBy) return true;
          if ((item.status === 'Paid' || item.status === 'Cancelled' || item.status === 'Cancelling') && item.handledBy === currentStaffId) return true;
          return false;
        });

        // Get the latest 5 reservations
        const latest = filteredReservations
          .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
          .slice(0, 5);
        
        setLatestReservations(latest);

      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [baseUrl, token]);

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

  if (loading) {
    return (
      <div className="m-5 flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className='m-5'>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className='flex flex-wrap gap-3'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 hover:scale-105 transition-all'>
          <img className='w-14' src={assets.earning_icon} alt="Sales" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{currency}{sales.toLocaleString()}</p>
            <p className='text-gray-400'>Today's Sales</p>
          </div>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 hover:scale-105 transition-all'>
          <img className='w-14' src={assets.appointments_icon} alt="Reservations" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{reservations}</p>
            <p className='text-gray-400'>Today's Reservations</p>
          </div>
        </div>
        {/* <div className='flex items-center gap-2 bg-white p-4 min-w-52 rounded border-2 border-gray-100 hover:scale-105 transition-all'>
          <img className='w-14' src={assets.patients_icon} alt="Customers" />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{customers}</p>
            <p className='text-gray-400'>Today's Customers</p>
          </div>
        </div> */}
      </div>

      {/* Latest Reservations - Updated to match other components */}
      <div className='bg-white mt-8 rounded-lg border'>
        <div className='flex items-center gap-2.5 px-6 py-4 border-b'>
          <img src={assets.list_icon} alt="" className='w-5 h-5' />
          <p className='font-semibold text-lg'>Latest Reservations</p>
        </div>

        <div className='p-4'>
          {latestReservations.map((item, index) => (
            <div className='flex items-center px-4 py-3 gap-4 hover:bg-gray-50 rounded-lg transition-colors mb-2 last:mb-0' key={item._id || index}>
              {/* Facility Image - Same as other components */}
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
  );
};

export default StaffDashboard;