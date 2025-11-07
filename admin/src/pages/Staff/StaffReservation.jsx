import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import html2canvas from 'html2canvas';

const StaffReservation = () => {
  const navigate = useNavigate();
  const currency = '₱';
  const baseUrl = import.meta.env.VITE_BACKEND_URL;
  const token = localStorage.getItem('token');
  const { user } = useAuth();
  const currentStaffId = user?._id;

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const reservationsPerPage = 10;

  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredReservations.length / reservationsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * reservationsPerPage,
    currentPage * reservationsPerPage
  );
  // Helper to check if reservation is expired (only for Pending)
  const isExpired = (reservation) => {
    if (!reservation.date || reservation.status !== 'Pending') return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const resDate = new Date(reservation.date);
    resDate.setHours(0,0,0,0);
    return resDate < today;
  };
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState(null);
  const [paymentType, setPaymentType] = useState('Cash');
  const [reference, setReference] = useState('');

  // New states for cancellation review
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Receipt modal states
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseUrl}/api/staff/reservations/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Store all reservations without filtering
      setReservations(res.data.reservations);
      setFilteredReservations(res.data.reservations);
      
      console.log('Fetched reservations:', res.data.reservations); // Debug log
    } catch (err) {
      console.error('Error fetching staff reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [token, baseUrl, currentStaffId]);

  // Search functionality - reset to page 1 when searching
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReservations(reservations);
    } else {
      const filtered = reservations.filter(reservation =>
        reservation._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.facilityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (reservation.paymentReference && reservation.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredReservations(filtered);
    }
    setCurrentPage(1); // Reset to page 1 when searching
  }, [searchTerm, reservations]);

  const openPaidDialog = (id) => {
    setSelectedReservationId(id);
    setPaymentType('Cash');
    setReference('');
    setShowPaidDialog(true);
  };

  const openReviewDialog = (reservation) => {
    setSelectedReservation(reservation);
    setShowReviewDialog(true);
  };

  const handleConfirmMarkPaid = async () => {
    // ✅ Validate reference number for non-cash payments
    if (paymentType !== 'Cash' && !reference.trim()) {
      alert('Please enter a payment reference number');
      return;
    }

    try {
      await axios.post(
        `${baseUrl}/api/reservation/edit`,
        {
          reservationId: selectedReservationId,
          status: 'Paid',
          paymentStatus: 'Paid',
          paymentType,
          paymentReference: paymentType === 'Cash' ? null : reference.trim(),
          handledBy: currentStaffId,
          datePaid: new Date().toISOString().split('T')[0]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Reservation marked as Paid successfully!');
      setShowPaidDialog(false);
      setShowSuccessDialog(true);
      fetchReservations();
    } catch (err) {
      console.error('Error marking as paid:', err);
    }
  };



  // New function to confirm cancellation
  const handleConfirmCancellation = async () => {
    try {
      await axios.post(
        `${baseUrl}/api/reservation/edit`,
        {
          reservationId: selectedReservation._id,
          status: 'Cancelled',
          paymentStatus: 'Refunded',
          cancellationReason: selectedReservation.cancellationReason,
          handledBy: currentStaffId,
          dateCancelled: new Date().toISOString().split('T')[0]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Reservation cancelled and refund processed!');
      setShowReviewDialog(false);
      setShowSuccessDialog(true);
      fetchReservations();
    } catch (err) {
      console.error('Error confirming cancellation:', err);
    }
  };

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
  };

  // Get payment status color
  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'Paid': return 'text-green-500';
      case 'Refunded': return 'text-blue-500';
      case 'Refund Pending': return 'text-orange-500';
      case 'Failed': return 'text-red-400';
      case 'Pending': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  // Format transaction ID (show first 8 characters for brevity)
  const formatTransactionId = (id) => {
    return id ? `${id.substring(0, 8)}...` : '—';
  };

  // Save receipt as image
  const saveAsImage = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current);
    const link = document.createElement('a');
    link.download = `receipt-${receiptData.paymentReference || 'N/A'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Print receipt
  const printReceipt = () => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt-container { border: 1px solid #ccc; padding: 20px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (loading) {
    return <div className='p-5 text-gray-600'>Loading reservations...</div>;
  }

  return (
    <div className='w-full max-w-[95%] mx-auto my-5 px-8'>
      <div className='flex justify-between items-center mb-3'>
        <p className='text-lg font-medium'>My Handled Reservations</p>
        <button
          onClick={() => navigate('/create-staff-reservation')}
          className='bg-primary text-white px-5 py-2 rounded-full text-sm hover:bg-opacity-90 transition-all duration-300'
        >
          + Create Reservation
        </button>
      </div>

      {/* Search Bar */}
      <div className='mb-4'>
        <div className='relative max-w-md'>
          <input
            type='text'
            placeholder='Search by Transaction ID, User, Facility, or Payment Reference...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full border border-gray-300 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
          />
          <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
            🔍
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
            >
              ✕
            </button>
          )}
        </div>
        {searchTerm && (
          <p className='text-sm text-gray-500 mt-2'>
            Showing {filteredReservations.length} of {reservations.length} reservations
          </p>
        )}
      </div>

      <div className='bg-white border rounded text-sm max-h-[calc(100vh-200px)] overflow-y-auto shadow-md w-full'>
        {/* Updated Header with Transaction ID and Payment Status */}
        <div className='hidden sm:grid grid-cols-[0.3fr_1fr_1fr_1.2fr_1.5fr_1.2fr_0.8fr_0.8fr_1fr_1fr_1.2fr_1.2fr_1fr_1fr] py-4 px-8 border-b bg-gray-50 font-medium'>
          <p className="text-gray-700">#</p>
          <p className="text-gray-700">Transaction ID</p>
          <p className="text-gray-700">User</p>
          <p className="text-gray-700">Facility</p>
          <p className="text-gray-700">Date & Time</p>
          <p className="text-gray-700">Package</p>
          <p className="text-gray-700">Fee/Hour</p>
          <p className="text-gray-700">Total Fee</p>
          <p className="text-gray-700">Status</p>
          <p className="text-gray-700">Payment Status</p>
          <p className="text-gray-700">Payment Ref.</p>
          <p className="text-gray-700">Handled By</p>
          <p className="text-gray-700">Date Paid/Cancelled</p>
          <p className="text-gray-700">Action</p>
        </div>

        {filteredReservations.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No reservations found matching your criteria
          </div>
        ) : (
          paginatedReservations.map((item, index) => (
            <div
              key={item._id}
              className={`flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.3fr_1fr_1fr_1.2fr_1.5fr_1.2fr_0.8fr_0.8fr_1fr_1fr_1.2fr_1.2fr_1fr_1fr] items-center py-4 px-8 border-b hover:bg-gray-50 text-gray-700 ${isExpired(item) ? 'bg-red-50' : ''}`}
            >
              <p className='max-sm:hidden'>{(currentPage - 1) * reservationsPerPage + index + 1}</p>
              <p
                className='text-xs font-mono text-gray-600 cursor-help'
                title={`Full ID: ${item._id}`}
              >
                {formatTransactionId(item._id)}
              </p>
              <div className='flex items-center gap-2'>
                <img src={item.userImage || 'https://via.placeholder.com/40'} className='w-8 rounded-full' alt='' />
                <p>{item.userName}</p>
              </div>
              <div className='flex items-center gap-2'>
                <img src={item.image || 'https://via.placeholder.com/40'} className='w-8 rounded-full bg-gray-200' alt='' />
                <p>{item.facilityName}</p>
              </div>
              <p>{item.date}, {item.startTime} - {item.endTime}</p>
              <p>{item.packageName}</p>
              <p>{currency}{item.packageFee}/hr</p>
              <p>{currency}{item.totalPrice}</p>
              <p className={`font-medium text-sm ${getStatusColor(isExpired(item) ? 'Expired' : item.status)}`}>{isExpired(item) ? 'Expired' : item.status === 'Cancelled' ? 'Cancel' : item.status}</p>
              <p className={`font-medium text-sm ${getPaymentStatusColor(item.paymentStatus)}`}>{item.paymentStatus}</p>
              <p className='text-sm'>{item.paymentReference || (item.paymentType === 'Cash' ? 'Cash' : '—')}</p>
              <p className='text-sm'>{item.handledBy || '—'}</p>
              <p className='text-sm'>{item.datePaid || item.dateCancelled || '—'}</p>
              <div className='flex gap-1 flex-wrap'>
                {isExpired(item) && (
                  <span className='bg-red-500 text-white px-2 py-1 rounded text-xs'>Expired</span>
                )}
                {!isExpired(item) && item.status === 'Pending' && (
                  <button type="button" onClick={() => openPaidDialog(item._id)} className='bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600'>Mark as Paid</button>
                )}
                {!isExpired(item) && item.status === 'Paid' && (
                  <button type="button" onClick={() => setReceiptData(item)} className='bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600'>Show Receipt</button>
                )}
                {!isExpired(item) && item.status === 'Cancelling' && (
                  <button type="button" onClick={() => openReviewDialog(item)} className='bg-orange-500 text-white px-2 py-1 rounded text-xs hover:bg-orange-600'>Review</button>
                )}
                {item.status !== 'Cancelled' && (
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        await axios.post(
                          `${baseUrl}/api/reservation/edit`,
                          {
                            reservationId: item._id,
                            status: 'Cancelled',
                            paymentStatus: '-',
                            cancellationReason: 'Cancelled by staff',
                            handledBy: currentStaffId,
                            dateCancelled: new Date().toISOString().split('T')[0]
                          },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        
                        setSuccessMessage('Reservation has been cancelled successfully.');
                        setShowSuccessDialog(true);
                        fetchReservations();
                      } catch (err) {
                        console.error('Error cancelling reservation:', err);
                        alert('Failed to cancel reservation. Please try again.');
                      }
                    }}
                    className='bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 flex items-center gap-1'
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4">
            <button
              className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-opacity-90'}`}
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span className="px-2">Page {currentPage} of {totalPages}</span>
            <button
              className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-opacity-90'}`}
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Paid dialog */}
      {showPaidDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl w-[90%] max-w-md shadow-xl'>
            <h2 className='text-lg font-semibold mb-4'>Mark as Paid</h2>
            
            <label className='block mb-2 font-medium'>Payment Type *</label>
            <select 
              value={paymentType} 
              onChange={(e) => {
                setPaymentType(e.target.value);
                setReference('');
              }} 
              className='w-full border px-3 py-2 rounded mb-4'
              required
            >
              <option value="Cash">Cash</option>
              <option value="GCash">GCash</option>
              <option value="PayMaya">PayMaya</option>
              <option value="GoTyme">GoTyme</option>
            </select>

            {paymentType !== 'Cash' && (
              <div>
                <label className='block mb-1 font-medium'>
                  Reference Number *
                  <span className='text-xs text-gray-500 ml-1'>
                    (Required for {paymentType} payments)
                  </span>
                </label>
                <input 
                  value={reference} 
                  onChange={(e) => setReference(e.target.value)} 
                  placeholder={`Enter ${paymentType} reference number`} 
                  className='w-full border px-3 py-2 rounded mb-4' 
                  required
                />
              </div>
            )}

            <div className='text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded'>
              <p><strong>Note:</strong></p>
              <p>• Cash payments don't require a reference number</p>
              <p>• Digital payments require a valid reference number</p>
            </div>

            <div className='flex justify-end gap-2'>
              <button 
                className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400' 
                onClick={() => setShowPaidDialog(false)}
              >
                Cancel
              </button>
              <button 
                className='bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90' 
                onClick={handleConfirmMarkPaid}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Review Cancellation Dialog */}
      {showReviewDialog && selectedReservation && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl w-[90%] max-w-2xl shadow-xl'>
            <h2 className='text-lg font-semibold mb-4'>Review Cancellation Request</h2>
            
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              <div>
                <h3 className='font-medium mb-2'>Reservation Details</h3>
                <div className='space-y-2 text-sm'>
                  <p><strong>Transaction ID:</strong> 
                    <span className='font-mono text-xs ml-2'>{selectedReservation._id}</span>
                  </p>
                  <p><strong>User:</strong> {selectedReservation.userName}</p>
                  <p><strong>Facility:</strong> {selectedReservation.facilityName}</p>
                  <p><strong>Package:</strong> {selectedReservation.packageName}</p>
                  <p><strong>Date:</strong> {selectedReservation.date}</p>
                  <p><strong>Time:</strong> {selectedReservation.startTime} - {selectedReservation.endTime}</p>
                  <p><strong>Total Amount:</strong> {currency}{selectedReservation.totalPrice}</p>
                </div>
              </div>
              
              <div>
                <h3 className='font-medium mb-2'>Cancellation Details</h3>
                <div className='space-y-2 text-sm'>
                  <p><strong>Cancellation Reason:</strong></p>
                  <div className='p-3 bg-gray-50 rounded border'>
                    {selectedReservation.cancellationReason || 'No reason provided'}
                  </div>
                  <p><strong>Date Requested:</strong> {selectedReservation.dateCancelled || '—'}</p>
                  <p><strong>Current Status:</strong> 
                    <span className={`ml-2 ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status}
                    </span>
                  </p>
                  <p><strong>Payment Status:</strong> 
                    <span className={`ml-2 ${getPaymentStatusColor(selectedReservation.paymentStatus)}`}>
                      {selectedReservation.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className='bg-yellow-50 border border-yellow-200 rounded p-4 mb-6'>
              <p className='text-sm text-yellow-800'>
                <strong>Note:</strong> Confirming cancellation will change the status to "Cancelled" 
                and mark the payment as "Refunded". This action cannot be undone.
              </p>
            </div>

            <div className='flex justify-end gap-2'>
              <button 
                className='bg-gray-300 px-4 py-2 rounded hover:bg-gray-400' 
                onClick={() => setShowReviewDialog(false)}
              >
                Close
              </button>
              <button 
                className='bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600' 
                onClick={handleConfirmCancellation}
              >
                Confirm Cancellation & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success dialog */}
      {showSuccessDialog && (
        <div className='fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl text-center w-[90%] max-w-sm shadow-xl'>
            <div className='text-green-500 text-4xl mb-3'>✅</div>
            <h2 className='text-xl font-semibold text-green-600 mb-2'>Success</h2>
            <p className='text-gray-600 mb-4'>{successMessage}</p>
            <button 
              onClick={() => setShowSuccessDialog(false)} 
              className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90'
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Receipt modal - Updated with Transaction ID */}
      {receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div ref={receiptRef} className="receipt-container">
              <h2 className="text-lg font-bold text-center mb-4">
                Goodwill Payment Receipt
              </h2>
              <div className="space-y-2">
                <p><strong>Transaction ID:</strong> 
                  <span className="font-mono text-xs ml-2">{receiptData._id}</span>
                </p>
                <p><strong>Reference:</strong> {receiptData.paymentReference || 'N/A'}</p>
                <p><strong>Facility:</strong> {receiptData.facilityName}</p>
                <p><strong>Package:</strong> {receiptData.packageName}</p>
                <p><strong>Date:</strong> {receiptData.date}</p>
                <p><strong>Time:</strong> {receiptData.startTime} - {receiptData.endTime}</p>
                <p><strong>Hours:</strong> {receiptData.totalHours || 'N/A'} hrs</p>
                <p><strong>Fee/Hour:</strong> ₱{receiptData.packageFee}</p>
                <p><strong>Total Amount:</strong> ₱{receiptData.totalPrice}</p>
                <p><strong>Payment Type:</strong> {receiptData.paymentType}</p>
                <p><strong>Status:</strong> {receiptData.paymentStatus}</p>
                <p><strong>Date Paid:</strong> {receiptData.datePaid || 'N/A'}</p>
              </div>
            </div>
            <div className="flex justify-between mt-4">
              <button onClick={saveAsImage} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Save as Image
              </button>
              <button onClick={printReceipt} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
                Print
              </button>
              <button onClick={() => setReceiptData(null)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default StaffReservation;
