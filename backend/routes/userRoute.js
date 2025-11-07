import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  uploadAvatarFromFile,
  getAllUsers,
  deleteUserById,
  editUserById,
  getUserLogs,
  adminChangeUserPassword,
  reactivateUser
} from '../controllers/userController.js';

import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js'; // Multer middleware for handling file uploads

const router = express.Router();

/* ---------- Public Routes ---------- */
router.post('/register', registerUser);             // Register User
router.post('/login', loginUser);                   // Login User

/* ---------- Protected Routes (Require Auth Token) ---------- */
router.post('/get-profile', verifyToken, getProfile);                 // Get Profile
router.post('/update-profile', verifyToken, updateProfile);           // Update Profile
router.post('/change-password', verifyToken, changePassword);         // Change Password
router.post('/upload-avatar', verifyToken, upload.single('image'), uploadAvatarFromFile); // Upload Avatar

/* ---------- Admin Routes ---------- */
router.get('/list', verifyToken, getAllUsers);         // Get all users
router.post('/edit', verifyToken, editUserById);       // Edit user info
// Example for userRoute.js (adjust middleware as needed)
router.post('/delete-user', verifyToken, deleteUserById);

router.post('/get-logs', getUserLogs);

// Add this to your admin routes section
router.post('/admin-change-password', verifyToken, adminChangeUserPassword);
router.post('/reactivate-user', verifyToken, reactivateUser);





/* ---------- Test Route ---------- */
router.post('/test-route', (req, res) => {
  res.json({ message: 'Test route working fine!' });
});

export default router;
