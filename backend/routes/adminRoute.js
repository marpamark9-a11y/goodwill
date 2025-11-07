import express from 'express';
import {
  getAdminDashboardSummary,
  
} from '../controllers/adminController.js';

import { verifyToken, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Dashboard Summary Route
router.post('/dashboard/summary', verifyToken, isAdmin, getAdminDashboardSummary);


export default router;