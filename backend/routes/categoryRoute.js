
import express from 'express';
import {
  addCategory,
  getAllCategories,
  editCategory,
  deleteCategory
} from '../controllers/categoryController.js';

import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// ✅ Add Category (image required)
router.post('/add', verifyToken, upload.single('image'), addCategory);

// ✅ Get All Categories
router.get('/list', getAllCategories);

// ✅ Edit Category (image optional)
router.post('/edit', verifyToken, upload.single('image'), editCategory);

// ✅ Delete Category
router.post('/delete', verifyToken, deleteCategory);

export default router;
