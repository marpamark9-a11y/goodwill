import express from 'express';
import {
  getTodaySalesHandledByStaff,
  getTodayTotalReservationsByStaff,
  getTodayTotalCustomersByStaff,
  getAllPendingAndOwnReservations
} from '../controllers/staffController.js';

import { verifyToken, isStaff } from '../middleware/authMiddleware.js';

const router = express.Router();

// Staff Dashboard endpoints
router.post('/sales/today', verifyToken, isStaff, getTodaySalesHandledByStaff);
router.post('/reservations/today', verifyToken, isStaff, getTodayTotalReservationsByStaff);
router.post('/customers/today', verifyToken, isStaff, getTodayTotalCustomersByStaff);
router.get('/reservations/all', verifyToken, isStaff, getAllPendingAndOwnReservations);

export default router;
