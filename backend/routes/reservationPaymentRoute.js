import express from 'express';
import { createInvoiceForReservation, xenditWebhookHandler } from '../controllers/reservationPaymentController.js';

const router = express.Router();

router.post('/create-invoice', createInvoiceForReservation);
router.post('/xendit-webhook', xenditWebhookHandler);

export default router;
