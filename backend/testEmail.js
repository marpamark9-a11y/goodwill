import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // use TLS
  auth: {
    user: process.env.EMAIL_USER.trim(), // trim any whitespace
    pass: process.env.EMAIL_PASS.trim(), // trim any whitespace
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

const testEmail = async () => {
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
  console.log('EMAIL_USER type:', typeof process.env.EMAIL_USER);
  console.log('EMAIL_USER length:', process.env.EMAIL_USER?.length);
  console.log('EMAIL_PASS type:', typeof process.env.EMAIL_PASS);
  console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

  // Test sending an email directly with the transporter
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'marpa.stephen@gmail.com',
    subject: 'Test Email',
    text: 'This is a test email from the reservation system.'
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
  } catch (error) {
    console.log('Failed to send email:', error.message);
  }
};

testEmail();
