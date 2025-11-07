import axios from 'axios';
import Reservation from '../models/reservationModel.js';
import userModel from '../models/userModel.js';
import { sendPaymentSuccessEmail } from '../config/email.js';

/**
 * Create an invoice in Xendit for an existing reservation
 */
export const createInvoiceForReservation = async (req, res) => {
  try {
    const { reservationId, guestEmail } = req.body;

    if (!reservationId) {
      return res.status(400).json({ message: 'Reservation ID is required' });
    }

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // If guest provided an email during payment, persist it so webhook can use it
    if (guestEmail && typeof guestEmail === 'string' && guestEmail.includes('@')) {
      reservation.email = guestEmail;
      try {
        await reservation.save();
      } catch (saveErr) {
        console.warn('Could not save guestEmail to reservation:', saveErr.message);
      }
    }

    const apiKey = process.env.XENDIT_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Xendit API key not configured' });
    }

    // Prepare payload for Xendit
    const payload = {
      external_id: reservation._id.toString(),
      amount: reservation.totalPrice,
      description: `Payment for reservation #${reservation._id}`,
      currency: 'PHP',
      customer: {
        given_names: reservation.userName || 'Customer',
        email: reservation.email || guestEmail || 'noemail@example.com'
      },
      success_redirect_url: 'http://localhost:5173/my-reservations',
      failure_redirect_url: 'http://localhost:5173/my-reservations'
    };

    // Call Xendit API
    const xenditRes = await axios.post(
      'https://api.xendit.co/v2/invoices',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64')
        }
      }
    );

    // Save invoice ID in reservation
    reservation.paymentReference = xenditRes.data.id;
    reservation.paymentStatus = 'Pending';
    await reservation.save();

    res.json({ invoice_url: xenditRes.data.invoice_url });

  } catch (error) {
    console.error('Create invoice error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to create invoice',
      details: error.response?.data || error.message
    });
  }
};

/**
 * Webhook from Xendit to update payment status
 */
export const xenditWebhookHandler = async (req, res) => {
  try {
    const event = req.body; // express.json() already parsed this

    console.log('Xendit Webhook Event:', event);

    // Only mark as paid if status is PAID
    if (event.status === 'PAID') {
      const reservation = await Reservation.findOne({
        paymentReference: event.id
      });

      if (reservation) {
        reservation.paymentStatus = 'Paid';
        reservation.status = 'Paid';
        reservation.datePaid = new Date().toISOString();
        await reservation.save();
        console.log(`✅ Reservation ${reservation._id} marked as PAID`);
        try {
          // Determine a valid email address: prefer reservation.email, else try to look up the user
          let recipientEmail = null;
          if (reservation.email) recipientEmail = reservation.email;
          else if (reservation.userId) {
            try {
              const user = await userModel.findById(reservation.userId);
              if (user && user.email) recipientEmail = user.email;
            } catch (uErr) {
              console.warn('Could not look up user for email fallback:', uErr.message);
            }
          }

          // Basic validation of email format
          const isValidEmail = (email) => typeof email === 'string' && /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

          if (recipientEmail && isValidEmail(recipientEmail)) {
            const sent = await sendPaymentSuccessEmail({
              to: recipientEmail,
              reservationId: reservation._id,
              facilityName: reservation.facilityName,
              date: reservation.date,
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              totalPrice: reservation.totalPrice,
              userName: reservation.userName
            });
            if (sent) console.log(`✉️ Payment success email sent to ${recipientEmail}`);
            else console.error(`Failed to send payment success email (send returned false) to ${recipientEmail}`);
          } else {
            console.log('ℹ️ No valid guest email available to send payment success email. reservation.email=', reservation.email, 'reservation.userId=', reservation.userId);
          }
        } catch (emailErr) {
          console.error('Failed to send payment success email:', emailErr);
        }
      } else {
        console.warn(`⚠ No reservation found for invoice ID ${event.id}`);
      }
    }

    // Respond quickly to avoid Xendit retries
    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send('Webhook processing failed');
  }
};
