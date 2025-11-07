// ✅ Updated AddReservation with customer name field, paid status, and confirmation preview
import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { assets } from '../../assets/assets'

const AddReservation = () => {
  const { user } = useAuth()
  const backendURL = import.meta.env.VITE_BACKEND_URL
  const token = localStorage.getItem('token')

  const [facilities, setFacilities] = useState([])
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [selectedPackage, setSelectedPackage] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentType, setPaymentType] = useState('Cash')
  const [paymentReference, setPaymentReference] = useState('')
  const [customerName, setCustomerName] = useState('') // New customer name field
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false) // New confirmation modal
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchFacilities = async () => {
      const res = await fetch(`${backendURL}/api/facility/list`)
      const data = await res.json()
      if (Array.isArray(data.facilities)) {
        setFacilities(data.facilities)
      } else {
        console.error('Invalid facility response:', data)
      }
    }
    fetchFacilities()
  }, [])

  useEffect(() => {
    if (selectedFacility && date) {
      fetchAvailableSlots()
    }
  }, [selectedFacility, date])

  const fetchAvailableSlots = async () => {
    const res = await fetch(`${backendURL}/api/reservation/available-slots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        facilityId: selectedFacility._id,
        date
      })
    })
    const data = await res.json()
    if (data.availableSlots) {
      const slots = data.availableSlots.filter(s => !s.includes('booked'))
      setAvailableSlots(slots)
    }
  }

  const selectedPackageObj = selectedFacility?.pricingPackages.find(pkg => pkg.name === selectedPackage)

  const parseTime = (time) => {
    const [t, p] = time.split(' ')
    let [h, m] = t.split(':').map(Number)
    if (p === 'PM' && h < 12) h += 12
    if (p === 'AM' && h === 12) h = 0
    return h + m / 60
  }

  const calculateHours = () => {
    if (!startTime || !endTime) return 0
    return parseTime(endTime) - parseTime(startTime)
  }

  const totalHours = calculateHours()
  const totalPrice = totalHours * (selectedPackageObj?.feePerHour || 0)

  const handlePaymentTypeChange = (e) => {
    const newPaymentType = e.target.value
    setPaymentType(newPaymentType)
    
    if (newPaymentType === 'Cash') {
      setPaymentReference('')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!customerName.trim()) {
      alert('Please enter customer name')
      return
    }
    
    if (paymentType !== 'Cash' && !paymentReference.trim()) {
      alert(`Please enter payment reference for ${paymentType}`)
      return
    }
    
    // Show confirmation modal instead of directly submitting
    setShowConfirmModal(true)
  }

  const submitReservation = async () => {
    setLoading(true)
    setShowConfirmModal(false)

    const payload = {
      facilityId: selectedFacility._id,
      facilityName: selectedFacility.name,
      image: selectedFacility.image,
      category: selectedFacility.category,
      packageName: selectedPackage,
      packageFee: selectedPackageObj?.feePerHour,
      totalHours,
      totalPrice,
      date,
      startTime,
      endTime,
      userId: user._id,
      userName: customerName, // Use customer name instead of staff name
      userType: 'customer', // Set as customer since it's for a customer
      status: 'Paid', // Set as Paid by default for staff reservations
      paymentStatus: 'Paid', // Set as Paid by default
      paymentType,
      paymentReference: paymentType === 'Cash' ? '' : paymentReference,
      handledBy: user._id, // Staff who created the reservation
      notes,
      datePaid: new Date().toISOString().split('T')[0] // Set current date as payment date
    }

    try {
      const res = await fetch(`${backendURL}/api/reservation/add-secure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setShowSuccessModal(true)
        // Reset form
        setSelectedFacility(null)
        setSelectedPackage('')
        setStartTime('')
        setEndTime('')
        setDate('')
        setPaymentType('Cash')
        setPaymentReference('')
        setCustomerName('')
        setNotes('')
        setAvailableSlots([])
      } else {
        alert(data.message || 'Failed to create reservation.')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className='m-5 w-full'>
        <p className='mb-3 text-lg font-medium'>Add Reservation</p>
        <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll text-gray-700'>

          {/* Customer Name Field */}
          <div className='mb-4'>
            <p>Customer Name *</p>
            <input 
              type='text' 
              className='border rounded px-3 py-2 w-full' 
              placeholder='Enter customer name'
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              required 
            />
          </div>

          <div className='mb-4'>
            <p>Facility *</p>
            <select
              className='border rounded px-3 py-2 w-full'
              required
              value={selectedFacility?._id || ''}
              onChange={e => {
                const fac = facilities.find(f => f._id === e.target.value)
                setSelectedFacility(fac)
                setSelectedPackage('')
              }}>
              <option value='' disabled>Select facility</option>
              {facilities.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </div>

          {selectedFacility && (
            <div className='mb-4'>
              <p>Package *</p>
              <select
                className='border rounded px-3 py-2 w-full'
                required
                value={selectedPackage}
                onChange={e => setSelectedPackage(e.target.value)}>
                <option value='' disabled>Select package</option>
                {selectedFacility.pricingPackages.map((pkg, idx) => (
                  <option key={idx} value={pkg.name}>{pkg.name} — {pkg.description} (₱{pkg.feePerHour}/hr)</option>
                ))}
              </select>
            </div>
          )}

          <div className='mb-4'>
            <p>Reservation Date *</p>
            <input 
              type='date' 
              className='border rounded px-3 py-2 w-full' 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]}
              required 
            />
          </div>

          <div className='flex gap-4 mb-4'>
            <div className='flex-1'>
              <p>Start Time *</p>
              <select className='border rounded px-3 py-2 w-full' value={startTime} onChange={e => setStartTime(e.target.value)} required>
                <option value=''>Select</option>
                {availableSlots.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            <div className='flex-1'>
              <p>End Time *</p>
              <select className='border rounded px-3 py-2 w-full' value={endTime} onChange={e => setEndTime(e.target.value)} required>
                <option value=''>Select</option>
                {availableSlots.filter((t, i) => i > availableSlots.indexOf(startTime)).map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {selectedPackage && startTime && endTime && totalHours > 0 && (
            <div className='mb-4 p-3 bg-gray-50 rounded'>
              <p className='font-medium'>Total Hours: <span className='text-primary'>{totalHours.toFixed(1)} hours</span></p>
              <p className='font-medium'>Total Price: <span className='text-primary'>₱{totalPrice.toFixed(2)}</span></p>
            </div>
          )}

          <div className='mb-4'>
            <p>Payment Type *</p>
            <select 
              className='border rounded px-3 py-2 w-full' 
              value={paymentType} 
              onChange={handlePaymentTypeChange}
              required
            >
              <option value='Cash'>Cash</option>
              <option value='GCash'>GCash</option>
              <option value='PayMaya'>PayMaya</option>
              <option value='GoTyme'>GoTyme</option>
            </select>
          </div>

          {paymentType !== 'Cash' && (
            <div className='mb-4'>
              <p>Payment Reference *</p>
              <input 
                type='text' 
                className='border rounded px-3 py-2 w-full' 
                placeholder={`Enter ${paymentType} reference number`}
                value={paymentReference} 
                onChange={e => setPaymentReference(e.target.value)} 
                required 
              />
            </div>
          )}

          <div className='mb-4 p-3 bg-blue-50 rounded'>
            <p className='text-sm text-gray-600'>
              <strong>Handled by:</strong> {user?.fullName || 'Staff User'}
            </p>
            <p className='text-sm text-gray-600 mt-1'>
              <strong>Status:</strong> <span className='text-green-600'>Paid</span>
            </p>
            <p className='text-sm text-gray-600 mt-1'>
              <strong>Payment Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className='mb-4'>
            <p>Notes (optional)</p>
            <textarea 
              rows={3} 
              className='border rounded px-3 py-2 w-full' 
              placeholder='Additional notes...'
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <button 
            type='submit' 
            className='bg-primary text-white px-6 py-3 mt-4 rounded-full hover:bg-opacity-90 disabled:opacity-50'
            disabled={loading}
          >
            {loading ? 'Creating Reservation...' : 'Create Reservation'}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50'>
          <div className='bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4'>
            <h2 className='text-xl font-semibold text-gray-800 mb-4'>Confirm Reservation</h2>
            
            <div className='bg-gray-50 p-4 rounded-lg mb-4'>
              <h3 className='font-medium text-gray-700 mb-2'>Reservation Details:</h3>
              <div className='space-y-2 text-sm'>
                <p><strong>Customer:</strong> {customerName}</p>
                <p><strong>Facility:</strong> {selectedFacility?.name}</p>
                <p><strong>Package:</strong> {selectedPackage}</p>
                <p><strong>Date:</strong> {date}</p>
                <p><strong>Time:</strong> {startTime} - {endTime}</p>
                <p><strong>Duration:</strong> {totalHours.toFixed(1)} hours</p>
                <p><strong>Total Price:</strong> ₱{totalPrice.toFixed(2)}</p>
                <p><strong>Payment Type:</strong> {paymentType}</p>
                {paymentType !== 'Cash' && <p><strong>Reference:</strong> {paymentReference}</p>}
                <p><strong>Status:</strong> <span className='text-green-600'>Paid</span></p>
                <p><strong>Handled by:</strong> {user?.fullName || 'Staff User'}</p>
                {notes && <p><strong>Notes:</strong> {notes}</p>}
              </div>
            </div>

            <div className='flex gap-3 justify-end'>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className='bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400'
              >
                Cancel
              </button>
              <button 
                onClick={submitReservation}
                className='bg-primary text-white px-4 py-2 rounded-full hover:bg-opacity-90'
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50'>
          <div className='bg-white rounded-2xl shadow-xl p-6 max-w-sm text-center'>
            <img src={assets.success_icon} className='w-16 mx-auto mb-3' alt='success' />
            <h2 className='text-xl font-semibold text-green-600 mb-2'>Success!</h2>
            <p className='text-gray-600 mb-4'>Reservation created successfully.</p>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className='bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90'
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default AddReservation