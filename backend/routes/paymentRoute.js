import express from 'express';
import { createPayment, verifyPayment } from '../controllers/paymentController.js';

const router = express.Router();

// Create a new payment
router.post('/create', createPayment);

// Verify a payment
router.post('/verify', verifyPayment);

export default router;