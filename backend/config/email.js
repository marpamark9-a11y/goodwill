import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use TLS
    auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim()
    },
    tls: {
        rejectUnauthorized: false
    }
});

export const sendReservationEmail = async ({ 
    to, 
    reservationId, 
    facilityName, 
    date, 
    startTime, 
    endTime, 
    totalPrice, 
    userName 
}) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const paymentLink = `${baseUrl}/payment/${reservationId}`;
    const cancelLink = `${baseUrl}/cancel-reservation/${reservationId}`;

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Reservation Confirmation</h2>
            <p>Dear ${userName},</p>
            <p>Thank you for booking with us! Here's a summary of your reservation:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Facility:</strong> ${facilityName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
                <p><strong>Total Amount:</strong> ₱${totalPrice.toFixed(2)}</p>
            </div>

            <div style="margin: 30px 0;">
                <p>You can manage your reservation using the following links:</p>
                
                <p style="margin: 15px 0;">
                    <a href="${paymentLink}" 
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Pay Now
                    </a>
                </p>
                
                <p style="margin: 15px 0;">
                    <a href="${cancelLink}"
                       style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Cancel Reservation
                    </a>
                </p>
            </div>

            <p>If you have any questions, please don't hesitate to contact us.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Your Reservation Confirmation',
        html: emailContent
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendPaymentSuccessEmail = async ({
    to,
    reservationId,
    facilityName,
    date,
    startTime,
    endTime,
    totalPrice,
    userName
}) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const receiptLink = `${baseUrl}/my-reservations`; // or a receipt page if available

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Payment Received — Reservation Confirmed</h2>
            <p>Dear ${userName},</p>
            <p>Thank you for your payment. Your reservation is now confirmed and paid. Below are the details:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Facility:</strong> ${facilityName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
                <p><strong>Total Amount Paid:</strong> ₱${totalPrice.toFixed(2)}</p>
            </div>
            <p style="color: #d00;"><strong>Note:</strong> Paid reservations cannot be cancelled via the guest portal. If you need assistance, please contact support.</p>
            <p style="margin-top: 20px;">You can view your reservation and receipt here:</p>
            <p style="margin: 15px 0;">
                <a href="${receiptLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Reservation</a>
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Payment Received — Reservation Confirmed',
        html: emailContent
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending payment success email:', error);
        return false;
    }
};

export const sendCancellationEmail = async ({
    to,
    reservationId,
    facilityName,
    date,
    startTime,
    endTime,
    totalPrice,
    userName,
    cancellationReason
}) => {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const reservationsLink = `${baseUrl}/my-reservations`;

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Reservation Cancellation</h2>
            <p>Dear ${userName},</p>
            <p>Your reservation has been successfully cancelled. Below are the details:</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Facility:</strong> ${facilityName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${startTime} - ${endTime}</p>
                <p><strong>Total Amount:</strong> ₱${totalPrice.toFixed(2)}</p>
                ${cancellationReason ? `<p><strong>Reason:</strong> ${cancellationReason}</p>` : ''}
            </div>
            <p>If you have any questions or need further assistance, please contact our support team.</p>
            <p style="margin-top: 20px;">You can view your reservations here:</p>
            <p style="margin: 15px 0;">
                <a href="${reservationsLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Reservations</a>
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Reservation Cancelled',
        html: emailContent
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        return false;
    }
};