import reservationModel from '../models/reservationModel.js';
import facilityModel from '../models/facilityModel.js';
import { sendReservationEmail } from '../config/email.js';

// ✅ Secure Add Reservation with accurate error messages
export const addReservationSecurely = async (req, res) => {
  try {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    console.log('Guest email in request:', req.body.guestEmail);

    const {
      facilityId, facilityName, image, category,
      packageName, packageFee, totalPrice, totalHours,
      date, startTime, endTime,
      userId, userName, userType,
      status, paymentStatus, paymentType,
      isCompleted, notes, paymentReference, handledBy
    } = req.body;

    // Validate required fields
    if (
      !facilityId || !facilityName || !image || !category ||
      !packageName || !packageFee || !totalPrice || !totalHours ||
      !date || !startTime || !endTime || !userId || !userName
    ) {
      return res.status(400).json({ message: 'Please provide all required reservation details.' });
    }

    // Fetch facility details to confirm valid time
    const facility = await facilityModel.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'The selected facility does not exist.' });
    }

    const facilityOpenHour = parseInt(facility.openTime.split(':')[0], 10);
    const facilityCloseHour = parseInt(facility.closeTime.split(':')[0], 10);

    const reqStartHour = parseInt(startTime.split(':')[0], 10);
    const reqEndHour = parseInt(endTime.split(':')[0], 10);

    // Check if requested time is within facility operating hours
    if (reqStartHour < facilityOpenHour || reqEndHour > facilityCloseHour || reqStartHour >= reqEndHour) {
      return res.status(400).json({ message: `The requested time (${startTime} - ${endTime}) is outside the facility's operating hours (${facility.openTime} - ${facility.closeTime}).` });
    }

    // Fetch existing reservations for date and facility
    const existingReservations = await reservationModel.find({
      facilityId,
      date,
      status: { $in: ['Pending', 'Paid'] }
    });

    // Check for overlapping reservations
    const overlap = existingReservations.some(reservation => {
      const existingStart = parseInt(reservation.startTime.split(':')[0], 10);
      const existingEnd = parseInt(reservation.endTime.split(':')[0], 10);
      return (reqStartHour < existingEnd && reqEndHour > existingStart);
    });

    if (overlap) {
      return res.status(409).json({ message: 'Sorry, the selected time slot is already booked. Please choose a different time.' });
    }

    // Create reservation if no conflicts
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
      paymentReference,
      handledBy,
      email: req.body.guestEmail || null
    });

    await newReservation.save();

    // Send confirmation email if guest email is provided
    console.log('Checking for guest email in request body...');
    console.log('req.body.guestEmail:', req.body.guestEmail);
    console.log('req.body keys:', Object.keys(req.body));

    if (req.body.guestEmail) {
      console.log('✅ Guest email found, sending confirmation email to:', req.body.guestEmail);
      console.log('Reservation details:', {
        reservationId: newReservation._id,
        facilityName: newReservation.facilityName,
        date: newReservation.date,
        startTime: newReservation.startTime,
        endTime: newReservation.endTime,
        totalPrice: newReservation.totalPrice,
        userName: newReservation.userName
      });
      try {
        const emailResult = await sendReservationEmail({
          to: req.body.guestEmail,
          reservationId: newReservation._id,
          facilityName: newReservation.facilityName,
          date: newReservation.date,
          startTime: newReservation.startTime,
          endTime: newReservation.endTime,
          totalPrice: newReservation.totalPrice,
          userName: newReservation.userName
        });
        console.log('✅ Email sent successfully:', emailResult);
      } catch (emailError) {
        console.error('❌ Error sending confirmation email:', emailError);
        // Continue with the response even if email fails
      }
    } else {
      console.log('❌ No guest email provided in req.body.guestEmail, skipping email send');
      console.log('Full request body for debugging:', JSON.stringify(req.body, null, 2));
    }

    res.status(201).json({ message: 'Your reservation has been successfully added.', reservation: newReservation });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An unexpected server error occurred while adding your reservation. Please try again later.' });
  }
};
