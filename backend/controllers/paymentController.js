import reservationModel from '../models/reservationModel.js';
import userModel from '../models/userModel.js';
import { sendPaymentSuccessEmail } from '../config/email.js';

export const createPayment = async (req, res) => {
    try {
        const { reservationId, amount } = req.body;
        console.log('Creating payment for:', { reservationId, amount });

        if (!reservationId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required payment details',
                details: {
                    reservationId: !reservationId ? 'Reservation ID is required' : null,
                    amount: !amount ? 'Payment amount is required' : null
                }
            });
        }

        // Find the reservation
        const reservation = await reservationModel.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Create payment reference
        const paymentReference = `PAY${Date.now()}`;
        console.log('Generated payment reference:', paymentReference);

        // If guest provided email, persist it on the reservation
        if (req.body.guestEmail && typeof req.body.guestEmail === 'string' && req.body.guestEmail.includes('@')) {
            try {
                reservation.email = req.body.guestEmail;
                await reservation.save();
            } catch (saveErr) {
                console.warn('Could not save guestEmail on reservation:', saveErr.message);
            }
        }

        // Update reservation with payment details
        try {
            const updatedReservation = await reservationModel.findByIdAndUpdate(
                reservationId,
                {
                    paymentStatus: 'Pending',
                    paymentReference: paymentReference,
                    paymentType: 'PayMongo',
                    handledBy: 'SYSTEM' // Mark as system-handled for online payments
                },
                { new: true, runValidators: true }
            );

            if (!updatedReservation) {
                console.error('Failed to update reservation with payment details');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update reservation'
                });
            }

            console.log('Successfully created payment');
            return res.status(200).json({
                success: true,
                message: 'Payment initiated successfully',
                paymentReference,
                paymentDetails: {
                    amount,
                    reservationId,
                    status: 'Processing'
                }
            });

        } catch (saveError) {
            console.error('Error updating reservation:', saveError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update reservation payment status',
                error: saveError.message
            });
        }
    } catch (error) {
        console.error('Payment creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create payment',
            error: error.message
        });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { paymentReference } = req.body;
        console.log('Verifying payment for reference:', paymentReference);

        if (!paymentReference) {
            return res.status(400).json({
                success: false,
                message: 'Payment reference is required'
            });
        }

        // Find the reservation with this payment reference
        const reservation = await reservationModel.findOne({ paymentReference });
        
        if (!reservation) {
            console.log('No reservation found for reference:', paymentReference);
            return res.status(404).json({
                success: false,
                message: 'No reservation found with this payment reference'
            });
        }

        console.log('Found reservation:', reservation._id);

        try {
            // Update the reservation
            const updatedReservation = await reservationModel.findByIdAndUpdate(
                reservation._id,
                {
                    paymentStatus: 'Paid',
                    status: 'Paid',
                    datePaid: new Date().toISOString().split('T')[0],
                    handledBy: reservation.handledBy || 'SYSTEM' // Preserve existing handler or mark as system-handled
                },
                { new: true, runValidators: true }
            );

            if (!updatedReservation) {
                console.error('Failed to update reservation status');
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update reservation status'
                });
            }

            console.log('Successfully updated reservation payment status');

            // Send payment success email if we have an email
            try {
                let recipientEmail = updatedReservation.email || null;
                if (!recipientEmail && updatedReservation.userId) {
                    const user = await userModel.findById(updatedReservation.userId);
                    if (user && user.email) recipientEmail = user.email;
                }
                const isValidEmail = (e) => typeof e === 'string' && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(e);
                if (recipientEmail && isValidEmail(recipientEmail)) {
                    await sendPaymentSuccessEmail({
                        to: recipientEmail,
                        reservationId: updatedReservation._id,
                        facilityName: updatedReservation.facilityName,
                        date: updatedReservation.date,
                        startTime: updatedReservation.startTime,
                        endTime: updatedReservation.endTime,
                        totalPrice: updatedReservation.totalPrice,
                        userName: updatedReservation.userName
                    });
                    console.log('✉️ Payment success email sent via verifyPayment to', recipientEmail);
                }
            } catch (emailErr) {
                console.error('Error sending payment success email in verifyPayment:', emailErr);
            }
            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                reservation: updatedReservation
            });

        } catch (updateError) {
            console.error('Error updating reservation status:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Failed to update reservation status',
                error: updateError.message
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: error.message
        });
    }
};