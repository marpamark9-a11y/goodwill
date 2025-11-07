import React, { useContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import html2canvas from "html2canvas";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-hot-toast';

const MyReservation = () => {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const [userReservations, setUserReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [payLoadingId, setPayLoadingId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [reservationsPerPage] = useState(5);
  
  // Get current reservations
  const indexOfLastReservation = currentPage * reservationsPerPage;
  const indexOfFirstReservation = indexOfLastReservation - reservationsPerPage;
  const currentReservations = userReservations.slice(indexOfFirstReservation, indexOfLastReservation);
  const totalPages = Math.ceil(userReservations.length / reservationsPerPage);
  const receiptRef = useRef();
  const navigate = useNavigate();

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  
    

  // Function to fetch reservations
  const fetchUserReservations = async () => {
    try {
      const response = await fetch(
        `${backendURL}/api/reservation/list`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

        const data = await response.json();
        if (data.success && data.reservations) {
          const filtered = data.reservations.filter(
            (res) => res.userId === user._id
          );
          // Sort by latest first (by creation date or date field)
          const sortedReservations = filtered.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
          setUserReservations(sortedReservations);
        }
      } catch (error) {
        console.error("Error fetching reservations:", error.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (user && token) fetchUserReservations();
  }, [user, token, location.key]); // Refetch when returning from edit page

  // UPDATED: Fixed payment function to use backendURL
  const handlePay = async (reservation) => {
    setPayLoadingId(reservation._id);
    try {
      const response = await axios.post(
        `${backendURL}/api/payments/create-invoice`,
        { reservationId: reservation._id },
        { headers: { "Content-Type": "application/json" } }
      );
      const invoiceUrl = response.data.invoice_url;
      if (invoiceUrl) {
        window.open(invoiceUrl, "_blank");
      } else {
        alert("Payment processing is temporarily unavailable. Please try again later.");
      }
    } catch (error) {
      console.error(
        "Error creating payment invoice:",
        error.response?.data || error.message || error
      );
      alert("Failed to initiate payment. Please try again later.");
    } finally {
      setPayLoadingId(null);
    }
  };

  // Calculate total price based on package and hours
  const calculateTotalPrice = (selectedPackage, hours) => {
    if (!selectedPackage) return 0;
    return selectedPackage.price * hours;
  };

  // Function to get package details by name
  const getPackageByName = (packageName) => {
    return packageDetails?.find(pkg => pkg.name === packageName);
  };

  // UPDATED: Fixed markReservation function to handle response properly
  const markReservation = async (payload) => {
    try {
      // If editing time/hours, recalculate total price
      if (payload.totalHours && payload.packageName) {
        const selectedPackage = getPackageByName(payload.packageName);
        if (selectedPackage) {
          const newTotalPrice = calculateTotalPrice(selectedPackage, payload.totalHours);
          payload.totalPrice = newTotalPrice;
        }
      }

      const res = await fetch(`${backendURL}/api/reservation/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          userId: user._id // Ensure user ID is included
        })
      });

      const data = await res.json();
      
      // FIXED: Check if response is successful and contains updated data
      if (res.ok && data.success) {
        // Update the local state with the data from the server
        await fetchUserReservations(); // Refetch to ensure we have latest data
        setSuccessMessage(data.message || 'Update successful!');
        setShowSuccessDialog(true);
        toast.success(data.message || 'Update successful!');
        return true;
      } else {
        console.error('Failed to update reservation:', data.message);
        // FIXED: Show specific error message from backend
        alert(data.message || "Failed to submit cancellation request. Please try again.");
        return false;
      }
    } catch (err) {
      console.error('Error updating reservation:', err.message);
      alert("Network error. Please check your connection and try again.");
      return false;
    }
  };

  // UPDATED: Simplified handleConfirmCancel
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please enter a cancellation reason');
      return;
    }

    setCancellingId(cancelModal);
    try {
      const payload = {
        reservationId: cancelModal,
        status: 'Cancelling',
        paymentStatus: 'Pending Refund',
        cancellationReason: cancelReason,
        dateCancelled: new Date().toISOString().split('T')[0]
      };

      await markReservation(payload);
      // FIXED: Don't show error here since markReservation handles it
      setCancelModal(null);
      setCancelReason("");
    } catch (error) {
      console.error("Error in cancellation process:", error);
      // FIXED: Only show alert if markReservation didn't already handle it
      if (!showSuccessDialog) {
        alert("An unexpected error occurred. Please try again.");
      }
    } finally {
      setCancellingId(null);
    }
  };

  const saveAsImage = async () => {
    if (!receiptRef.current) return;
    const canvas = await html2canvas(receiptRef.current);
    const link = document.createElement("a");
    link.download = `receipt-${receiptData.paymentReference}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const printReceipt = () => {
    if (!receiptRef.current) return;
    const printContents = receiptRef.current.innerHTML;
    const win = window.open("", "_blank");
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

  // FAQ data
  // FAQ data
const faqData = [
  {
    question: "How to cancel my reservation?",
    answer: "You can cancel your reservation by clicking the 'Cancel Reservation' button below or on your booking details. You need to provide a reason for cancellation. Our staff will contact you within 24 hours to confirm the cancellation. For instant approval, call our support team at +63 941 750 0792 or +63 951 539 9549."
  },
  {
    question: "What is the cancellation policy?",
    answer: "Cancellations must be made at least 24 hours before the scheduled time. A convenience fee of 10% will be deducted from your refund for processing. Once approved, your reservation status will be updated to 'Cancelled' and refund will be processed within 5-7 business days."
  },
  {
    question: "How long does cancellation approval take?",
    answer: "Standard cancellation requests are processed within 24 hours. For immediate approval, please call our support team at +63 941 750 0792 or +63 951 539 9549. Our staff will contact you to confirm details and process your request."
  },
  {
    question: "What is the convenience charge for cancellation?",
    answer: "A 10% convenience fee is charged for all cancellations to cover processing costs. This fee is deducted from your refund amount."
  },
  {
    question: "Can I get full refund on cancellation?",
    answer: "No, all cancellations incur a 10% convenience fee. The remaining 90% will be refunded to your original payment method within 5-7 business days after approval."
  },
  {
    question: "What happens after I request cancellation?",
    answer: "1. Status changes to 'Cancelled'. 2. Our staff will contact you to verify. 3. Refund (minus 10% fee) processed in 5-7 days."
  }
];

// Also update the phone numbers in the "Need Immediate Assistance?" section:
// In the Help Modal, update this section:


  // Get first available reservation for cancellation in FAQ
  const getFirstCancellableReservation = () => {
    return userReservations.find(item => 
      item.status === "Paid" && 
      new Date(item.date) > new Date() &&
      item.status !== "Cancelled"
    );
  };

  if (!user) {
    return (
      <p className="text-center text-red-600 mt-10">
        Please log in to view your reservations.
      </p>
    );
  }

  if (loading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        Loading your reservations...
      </p>
    );
  }

  return (
    <div className="pb-8">
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My Reservations
      </p>

      {userReservations.length === 0 ? (
        <p className="text-gray-500 text-center mt-4">
          You have no reservations.
        </p>
      ) : (
        <div>
          {currentReservations.map((item, index) => {
              const isPast = new Date(item.date) < new Date();
              const isPayLoading = payLoadingId === item._id;
              const isCancelling = cancellingId === item._id;
              
              // Cancel button for Paid or Pending reservations that are not past and not already cancelled
              const canCancel = (item.status === "Paid" || item.status === "Pending") && !isPast && item.status !== "Cancelled";

              return (
              <div
                key={index}
                className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
              >
                <div>
                  <img
                    className="w-32 bg-indigo-50 rounded-lg"
                    src={item.image}
                    alt={item.facilityName}
                  />
                </div>
                <div className="flex-1 text-sm text-zinc-600">
                  <p className="text-neutral-800 font-semibold">
                    {item.facilityName}
                  </p>
                  <p className="text-xs">Package: {item.packageName}</p>
                  <p className="text-xs">Hours: {item.totalHours} hrs</p>
                  <p className="text-xs">Price: ₱{item.totalPrice}</p>
                  <p className="text-xs">
                    Time: {item.startTime} - {item.endTime}
                  </p>
                  <p className="text-xs">Date: {item.date}</p>

                  <p
                    className={`text-xs font-semibold mt-1 ${
                      item.status === "Paid"
                        ? "text-green-600"
                        : item.status === "Pending" && isPast
                        ? "text-gray-500"
                        : item.status === "Pending"
                        ? "text-orange-600"
                        : item.status === "Cancelled"
                        ? "text-red-600"
                        : "text-red-600"
                    }`}
                  >
                    Status:{" "}
                    {isPast && item.status === "Pending"
                      ? "Expired"
                      : item.status}
                  </p>

                  {item.status === "Paid" && (
                    <p className="text-xs mt-1">
                      Date Paid: {new Date(item.datePaid).toLocaleString()}
                    </p>
                  )}

                  {item.cancellationReason && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-xs font-semibold text-yellow-800">
                        Cancellation Reason
                      </p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {item.cancellationReason}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Our staff will contact you regarding your refund.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 justify-end">
                  {item.status === "Pending" && !isPast && (
                    <>
                      <button
                        onClick={() => handlePay(item)}
                        disabled={isPayLoading}
                        className={`text-sm sm:min-w-48 py-2 border rounded ${
                          isPayLoading
                            ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                            : "text-stone-500 hover:bg-primary hover:text-white"
                        }`}
                      >
                        {isPayLoading ? "Processing..." : "Pay Online"}
                      </button>

                      {/* Cancel Reservation Button for Pending */}
                      <button
                        onClick={() => {
                          setCancelModal(item._id);
                          toast('Please provide a reason for cancellation', {
                            icon: 'ℹ️',
                            duration: 4000,
                          });
                        }}
                        disabled={isCancelling}
                        className={`text-sm py-3 border-2 rounded-lg flex items-center justify-center gap-2 w-full mt-2 ${
                          isCancelling
                            ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                            : "text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {isCancelling ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          <span className="font-medium">Cancel Reservation</span>
                        )}
                      </button>
                    </>
                  )}
                  
                  {item.status === "Paid" && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReceiptData(item)}
                          className="flex-1 text-sm py-2 border rounded text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Receipt
                        </button>
                        <button
                          onClick={() => setShowHelp(true)}
                          className="px-3 py-2 border border-blue-500 rounded text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                          title="Get Help"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Cancel Reservation Button */}
                      {!isPast && item.status !== "Cancelled" && (
                        <button
                          onClick={() => {
                            setCancelModal(item._id);
                            toast('Please provide a reason for cancellation', {
                              icon: 'ℹ️',
                              duration: 4000,
                            });
                          }}
                          disabled={isCancelling}
                          className={`text-sm py-3 border-2 rounded-lg flex items-center justify-center gap-2 w-full mt-2 ${
                            isCancelling
                              ? "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed"
                              : "text-red-600 border-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          {isCancelling ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                              </svg>
                              Processing...
                            </span>
                          ) : (
                            <span className="font-medium">Cancel Reservation</span>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* No cancel button for Pending reservations */}
                  {item.status === "Pending" && isPast && (
                    <div className="text-xs text-gray-500 text-center py-2">
                      Expired reservation
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Pagination Controls */}
          {userReservations.length > 0 && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-opacity-90'
                }`}
              >
                Previous
              </button>
              
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-opacity-90'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

  
      {/* Cancellation Modal */}
      {cancelModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white p-6 rounded-xl w-[90%] max-w-md shadow-xl'>
            <div className="flex justify-between items-center mb-4">
              <h2 className='text-xl font-bold text-gray-800'>Cancel Order</h2>
              <button
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className='mb-6 bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-semibold">Important Notice</span>
              </div>
              <p className="text-sm text-red-600 mb-2">This action cannot be undone. Please ensure you want to cancel this order.</p>
            </div>

            <label className='block mb-2 font-medium text-gray-700'>Reason for cancellation *</label>
            <textarea 
              rows={4} 
              value={cancelReason} 
              onChange={(e) => setCancelReason(e.target.value)} 
              className='w-full border px-4 py-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
              placeholder='Please provide a detailed reason for cancellation...' 
              required
            />
            
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6'>
              <h3 className='font-semibold text-yellow-800 text-sm mb-3'>Cancellation Policy:</h3>
              <ul className='text-yellow-700 text-sm space-y-2'>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  24-hour advance notice required
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  10% cancellation fee applies
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Refund processed in 5-7 business days
                </li>
              </ul>
              <div className="mt-3 text-sm">
                <p className="text-yellow-700">For immediate assistance:</p>
                <p className="font-semibold text-yellow-800">+63 941 750 0792</p>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <button 
                className='px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50' 
                onClick={() => {
                  setCancelModal(null);
                  setCancelReason("");
                }}
              >
                Keep Order
              </button>
              <button 
                className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                  !cancelReason.trim() 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                } text-white`}
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || cancellingId}
              >
                {cancellingId ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Confirm Cancellation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
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

      {/* Help Modal with Cancel Button */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Help & Support</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {faqData.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Cancel Button in Need Immediate Assistance section */}
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-800 text-lg mb-3">Need Immediate Assistance?</h3>
                <p className="text-blue-700 mb-3">
                  For instant cancellation approval or urgent matters:
                </p>
                <p className="text-blue-800 font-bold text-xl mb-4">+63 941 750 0792</p>
                  <p className="text-blue-800 font-bold text-xl mb-4">+63 951 539 9549</p>
                <p className="text-blue-600 text-sm mb-4">Available 24/7</p>
                
                {/* Cancel Reservation Button in FAQ */}
                {getFirstCancellableReservation() && (
                  <button
                    onClick={() => {
                      const reservation = getFirstCancellableReservation();
                      setCancelModal(reservation._id);
                      setShowHelp(false);
                    }}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Reservation
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <div ref={receiptRef} className="receipt-container">
              <h2 className="text-lg font-bold text-center mb-4">
                Goodwill Payment Receipt
              </h2>
              <p><strong>Transaction ID:</strong> {receiptData._id}</p>
              <p><strong>Reference:</strong> {receiptData.paymentReference}</p>
              <p><strong>Facility:</strong> {receiptData.facilityName}</p>
              <p><strong>Package:</strong> {receiptData.packageName}</p>
              <p><strong>Date:</strong> {receiptData.date}</p>
              <p><strong>Time:</strong> {receiptData.startTime} - {receiptData.endTime}</p>
              <p><strong>Hours:</strong> {receiptData.totalHours} hrs</p>
              <p><strong>Amount Paid:</strong> ₱{receiptData.totalPrice}</p>
              <p><strong>Payment Type:</strong> {receiptData.paymentType}</p>
              <p><strong>Status:</strong> {receiptData.paymentStatus}</p>
              <p><strong>Date Paid:</strong> {new Date(receiptData.datePaid).toLocaleString()}</p>
              {receiptData.cancellationReason && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-semibold text-yellow-800">Cancellation Reason</p>
                  <p className="text-sm text-yellow-700">{receiptData.cancellationReason}</p>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-4">
              <button
                onClick={saveAsImage}
                className="px-3 py-1 bg-blue-500 text-white rounded"
              >
                Save as Image
              </button>
              <button
                onClick={printReceipt}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                Print
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MyReservation;