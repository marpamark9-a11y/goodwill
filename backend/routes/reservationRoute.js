import express from 'express';
import {
  addReservation,
  getAllReservations,
  editReservation,
  deleteReservation,
  getAvailableSlots,
  addReservationSecurely,
  getReservationById,
  cancelReservation
} from '../controllers/reservationController.js';

import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Existing Routes
router.post('/add', verifyToken, addReservation);
router.get('/list', verifyToken, getAllReservations);
router.post('/edit', editReservation); // Removed auth for email link access
router.post('/delete', verifyToken, deleteReservation);

// ✅ Newly Added Routes
router.post('/available-slots', verifyToken, getAvailableSlots);
router.post('/add-secure', verifyToken, addReservationSecurely);

// Public endpoints for guest users (no token required)
// These allow viewing available slots and creating reservations without authentication.
router.post('/available-slots-public', getAvailableSlots);
router.post('/add-guest', addReservationSecurely);

// Endpoints accessible via email links (no auth required)
router.get('/:id', getReservationById);
router.post('/cancel', cancelReservation);

export default router;
