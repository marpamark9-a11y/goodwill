import reservationModel from '../models/reservationModel.js';
import facilityModel from '../models/facilityModel.js';
import userModel from '../models/userModel.js';
import { sendReservationEmail, sendCancellationEmail } from '../config/email.js';

// ✅ Get Single Reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const reservationId = req.params.id;
    const reservation = await reservationModel.findById(reservationId);
    
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json({ success: true, reservation });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve reservation', 
      error: error.message 
    });
  }
};

// Utility: Convert 12-hour or 24-hour time format to minutes
const convertToMinutes = (timeStr) => {
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const [hourMin, period] = timeStr.split(' ');
    const [hour, minute] = hourMin.split(':').map(Number);
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + minute;
  } else {
    const [hour, minute] = timeStr.split(':').map(Number);
    return hour * 60 + minute;
  }
};

// ✅ Existing Add Reservation (Auto-generate ID)
export const addReservation = async (req, res) => {
  try {
    const {
      facilityId, facilityName, image, category,
      packageName, packageFee, totalPrice, totalHours,
      date, startTime, endTime,
      userId, userName, userType,
      status, paymentStatus, paymentType,
      isCompleted, notes, datePaid, dateCancelled,
      cancellationReason, paymentReference,
      handledBy
    } = req.body;

    if (
      !facilityId || !facilityName || !image || !category ||
      !packageName || !packageFee || !totalPrice || !totalHours ||
      !date || !startTime || !endTime || !userId || !userName
    ) {
      return res.status(400).json({ message: 'Missing required reservation fields' });
    }

    const newReservation = new reservationModel({
      _id: `R${Date.now()}`,
      facilityId,
      facilityName,
      image,
      category,
      packageName,
      packageFee,
      totalPrice,
      totalHours,
      date,
      startTime,
      endTime,
      userId,
      userName,
      userType,
      status,
      paymentStatus,
      paymentType,
      isCompleted,
      notes,
      datePaid,
      dateCancelled,
      cancellationReason,
      paymentReference,
      handledBy: handledBy || null
    });

    await newReservation.save();
    res.status(201).json({ message: 'Reservation added successfully', reservation: newReservation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add reservation', error: error.message });
  }
};

// ✅ Existing Get All Reservations
export const getAllReservations = async (req, res) => {
  try {
    const reservations = await reservationModel.find().sort({ date: -1, startTime: 1 });
    res.status(200).json({ success: true, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve reservations', error: error.message });
  }
};

// ✅ Existing Edit Reservation
export const editReservation = async (req, res) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    const updateFields = { ...req.body };
    delete updateFields.reservationId;

    const updated = await reservationModel.findByIdAndUpdate(reservationId, updateFields, { new: true });
    if (!updated) return res.status(404).json({ message: 'Reservation not found' });

    return res.status(200).json({ message: 'Reservation updated successfully', reservation: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update reservation', error: error.message });
  }
};

// ✅ Existing Delete Reservation
export const deleteReservation = async (req, res) => {
  try {
    const { reservationId } = req.body;
    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    const deleted = await reservationModel.findByIdAndDelete(reservationId);
    if (!deleted) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    return res.status(200).json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete reservation', error: error.message });
  }
};

// Add cancel reservation endpoint
export const cancelReservation = async (req, res) => {
  try {
    const { reservationId, cancellationReason, status, paymentStatus, handledBy } = req.body;
    
    if (!reservationId || !cancellationReason) {
      return res.status(400).json({ 
        message: 'Reservation ID and cancellation reason are required' 
      });
    }

    const reservation = await reservationModel.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Prevent guests from cancelling a reservation that has already been paid
    if (reservation.paymentStatus === 'Paid' || reservation.status === 'Paid') {
      return res.status(400).json({ message: 'Paid reservations cannot be cancelled.' });
    }
    // Update reservation with cancellation details
    reservation.status = status || 'Cancelling';
    reservation.paymentStatus = paymentStatus || 'Refund Pending';
    reservation.cancellationReason = cancellationReason;
    reservation.dateCancelled = new Date();
    reservation.handledBy = handledBy || 'SYSTEM';
    
    await reservation.save();

    // Send cancellation confirmation email if an email is available
    try {
      let recipient = reservation.email;
      if (!recipient) {
        const user = await userModel.findById(reservation.userId);
        recipient = user?.email;
      }

      if (recipient) {
        await sendCancellationEmail({
          to: recipient,
          reservationId: reservation._id,
          facilityName: reservation.facilityName,
          date: reservation.date,
          startTime: reservation.startTime,
          endTime: reservation.endTime,
          totalPrice: reservation.totalPrice || 0,
          userName: reservation.userName || 'Guest',
          cancellationReason: cancellationReason
        });
      }
    } catch (emailErr) {
      console.error('Error sending cancellation email:', emailErr);
      // continue even if email sending fails
    }

    return res.status(200).json({ 
      message: 'Reservation cancellation processed successfully',
      reservation 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to process cancellation', 
      error: error.message 
    });
  }
};

// ✅ Get Available Slots Controller
export const getAvailableSlots = async (req, res) => {
  try {
    const { facilityId, date } = req.body;

    if (!facilityId || !date) {
      return res.status(400).json({ message: 'Facility ID and Date are required.' });
    }

    const facility = await facilityModel.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found.' });
    }

    const openTime = parseInt(facility.openTime.split(':')[0], 10);
    const closeTime = parseInt(facility.closeTime.split(':')[0], 10);

    const existingReservations = await reservationModel.find({
      facilityId,
      date,
      status: { $in: ['Pending', 'Paid'] }
    });

    let allSlots = [];
    for (let hour = openTime; hour < closeTime; hour++) {
      allSlots.push(hour);
    }

    let bookedSlots = [];
    existingReservations.forEach(reservation => {
      const start = parseInt(reservation.startTime.split(':')[0], 10);
      const end = parseInt(reservation.endTime.split(':')[0], 10);
      for (let hour = start; hour < end; hour++) {
        bookedSlots.push(hour);
      }
    });

    const formattedSlots = allSlots.map(slot => {
      const period = slot >= 12 ? 'PM' : 'AM';
      const hour = slot % 12 === 0 ? 12 : slot % 12;
      const timeLabel = `${hour}:00 ${period}`;
      return bookedSlots.includes(slot) ? `${timeLabel} (booked)` : timeLabel;
    });

    res.status(200).json({ date, facilityId, availableSlots: formattedSlots });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch available slots.', error: error.message });
  }
};

// ✅ Fixed Secure Add Reservation Controller with datePaid field
export const addReservationSecurely = async (req, res) => {
  try {
    const {
      facilityId, facilityName, image, category, packageName, packageFee, totalPrice,
      totalHours, date, startTime, endTime, userId, userName, userType, status,
      paymentStatus, paymentType, isCompleted, notes, paymentReference, handledBy,
      datePaid // Add datePaid to destructuring
    } = req.body;

    console.log('Received reservation data:', req.body);

    // Check only the truly required fields
    if (
      !facilityId || !facilityName || !packageName || 
      !date || !startTime || !endTime || !userId || !userName
    ) {
      console.log('Missing required fields:', {
        facilityId, facilityName, packageName, date, startTime, endTime, userId, userName
      });
      return res.status(400).json({ 
        message: 'Please provide all required reservation details.',
        missing: {
          facilityId: !facilityId,
          facilityName: !facilityName,
          packageName: !packageName,
          date: !date,
          startTime: !startTime,
          endTime: !endTime,
          userId: !userId,
          userName: !userName
        }
      });
    }

    const facility = await facilityModel.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'The selected facility does not exist.' });
    }

    // Convert times to minutes for comparison
    const facilityOpenMinutes = convertToMinutes(facility.openTime);
    const facilityCloseMinutes = convertToMinutes(facility.closeTime);
    const reqStartMinutes = convertToMinutes(startTime);
    const reqEndMinutes = convertToMinutes(endTime);

    if (reqStartMinutes < facilityOpenMinutes || reqEndMinutes > facilityCloseMinutes) {
      return res.status(400).json({ 
        message: `The requested time (${startTime} - ${endTime}) is outside the facility's operating hours (${facility.openTime} - ${facility.closeTime}).` 
      });
    }

    if (reqStartMinutes >= reqEndMinutes) {
      return res.status(400).json({ 
        message: 'End time must be after start time.' 
      });
    }

    // Check for overlapping reservations
    const existingReservations = await reservationModel.find({ 
      facilityId, 
      date, 
      status: { $in: ['Pending', 'Paid'] } 
    });

    const overlap = existingReservations.some(reservation => {
      const existingStart = convertToMinutes(reservation.startTime);
      const existingEnd = convertToMinutes(reservation.endTime);
      return reqStartMinutes < existingEnd && reqEndMinutes > existingStart;
    });

    if (overlap) {
      return res.status(409).json({ 
        message: 'Sorry, the selected time slot is already booked. Please choose a different time.' 
      });
    }

    // Create reservation with proper defaults
    const reservationData = {
      _id: `R${Date.now()}`,
      facilityId,
      facilityName,
      image: image || facility.image, // Use facility image if not provided
      category: category || facility.category, // Use facility category if not provided
      packageName,
      packageFee: packageFee || 0,
      totalPrice: totalPrice || 0,
      totalHours: totalHours || 0,
      date,
      startTime,
      endTime,
      userId,
      userName,
      userType: userType || 'customer',
      status: status || 'Pending', // Default to Pending if not provided
      paymentStatus: paymentStatus || 'Pending', // Default to Pending if not provided
      paymentType: paymentType || 'Cash',
      paymentReference: paymentType === 'Cash' ? null : paymentReference,
      handledBy: handledBy || null,
      isCompleted: isCompleted || false,
      notes: notes || '',
      datePaid: datePaid || null, // Add datePaid with default null
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating reservation with data:', reservationData);

    const newReservation = new reservationModel(reservationData);
    await newReservation.save();
    
    // Send confirmation email if guest email is provided
    if (req.body.guestEmail) {
      try {
        await sendReservationEmail({
          to: req.body.guestEmail,
          reservationId: newReservation._id,
          facilityName: newReservation.facilityName,
          date: newReservation.date,
          startTime: newReservation.startTime,
          endTime: newReservation.endTime,
          totalPrice: newReservation.totalPrice,
          userName: newReservation.userName
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    res.status(201).json({ 
      message: 'Your reservation has been successfully added.', 
      reservation: newReservation 
    });

  } catch (error) {
    console.error('Server error in addReservationSecurely:', error);
    res.status(500).json({ 
      message: 'An unexpected server error occurred while adding your reservation. Please try again later.', 
      error: error.message 
    });
  }
};