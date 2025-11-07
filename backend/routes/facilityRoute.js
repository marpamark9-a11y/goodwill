import express from 'express';
import {
  addFacility,
  editFacility,
  deleteFacility,
  getAllFacilities
} from '../controllers/facilityController.js';

import { verifyToken } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js'; // Multer middleware for image upload

const router = express.Router();

// ✅ Add Facility (Image Required)
router.post('/add', verifyToken, upload.single('image'), addFacility);

// ✅ Edit Facility (Image Optional)
router.post('/edit', verifyToken, upload.single('image'), editFacility);

// ✅ Delete Facility (Facility ID Required in JSON body)
router.post('/delete', verifyToken, express.json(), deleteFacility);

// ✅ Get All Facilities
router.get('/list', getAllFacilities);

// ✅ Get Facility by ID
router.get('/:id', async (req, res) => {
  try {
    const facility = await facilityModel.findById(req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found' });
    }
    res.status(200).json({ success: true, facility });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve facility', error: err.message });
  }
});

export default router;