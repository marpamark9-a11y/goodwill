import facilityModel from '../models/facilityModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



// ✅ Fixed: Add Facility (Image Required)
export const addFacility = async (req, res) => {
  try {
    const {
      name,
      category,
      about,
      openTime,
      closeTime,
      minBookingHours,
      pricingPackages,
      available // ✅ ADD THIS: Get available from request body
    } = req.body;

    // Check if image is provided
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    // Validate required fields
    if (!name || !category || !about || !openTime || !closeTime || !minBookingHours || !pricingPackages) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Upload image to Cloudinary
    let uploadRes;
    try {
      uploadRes = await cloudinary.uploader.upload(req.file.path, { folder: 'facilities' });
      fs.unlinkSync(req.file.path); // Remove file after upload
    } catch (uploadError) {
      return res.status(500).json({ message: 'Failed to upload image to Cloudinary', error: uploadError.message });
    }

    // Parse pricingPackages and minBookingHours
    let parsedPricingPackages;
    try {
      parsedPricingPackages = JSON.parse(pricingPackages);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid pricing packages format' });
    }

    const parsedMinBookingHours = parseInt(minBookingHours);
    if (isNaN(parsedMinBookingHours)) {
      return res.status(400).json({ message: 'minBookingHours must be a number' });
    }

    // ✅ FIXED: Convert available string to boolean and use it
    const isAvailable = available === 'true'; // Convert string 'true'/'false' to boolean

    const newFacility = new facilityModel({
      _id: `F${Date.now()}`, // Custom string ID format
      name,
      image: uploadRes.secure_url,
      category,
      about,
      openTime,
      closeTime,
      minBookingHours: parsedMinBookingHours,
      pricingPackages: parsedPricingPackages,
      available: isAvailable // ✅ USE THE VALUE FROM REQUEST
    });

    await newFacility.save();
    res.status(201).json({ 
      message: 'Facility added successfully', 
      facility: newFacility 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to add facility', 
      error: err.message 
    });
  }
};



// ✅ Edit Facility (Image Optional)
export const editFacility = async (req, res) => {
  try {
    console.log('🔧 EDIT FACILITY - Request body keys:', Object.keys(req.body));
    console.log('🔧 EDIT FACILITY - Full request body:', req.body);
    
    const {
      facilityId,
      name,
      category,
      about,
      openTime,
      closeTime,
      minBookingHours,
      pricingPackages,
      available // ✅ Get available from request body
    } = req.body;

    // ✅ DEBUG: Log the received available value
    console.log('🔧 EDIT FACILITY - Received available:', available, 'Type:', typeof available);

    // Validate facilityId
    if (!facilityId) {
      return res.status(400).json({ message: 'Facility ID is required' });
    }

    // Find the facility
    const facility = await facilityModel.findById(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    console.log('🔧 EDIT FACILITY - Current facility availability:', facility.available);

    // Prepare update data
    const updateData = {
      name,
      category,
      about,
      openTime,
      closeTime,
      minBookingHours: parseInt(minBookingHours),
      pricingPackages: JSON.parse(pricingPackages),
      available: available === 'true' // ✅ Convert string to boolean
    };

    // ✅ DEBUG: Log the update data
    console.log('🔧 EDIT FACILITY - Update data with availability:', updateData);

    // Handle image upload if a new image is provided
    if (req.file) {
      try {
        const uploadRes = await cloudinary.uploader.upload(req.file.path, { folder: 'facilities' });
        updateData.image = uploadRes.secure_url;
        // Delete the file from the server after upload
        fs.unlinkSync(req.file.path);
      } catch (uploadError) {
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary', error: uploadError.message });
      }
    }

    // Update the facility
    console.log('🔧 EDIT FACILITY - Updating facility with ID:', facilityId);
    const updatedFacility = await facilityModel.findByIdAndUpdate(
      facilityId, 
      updateData, 
      { new: true, runValidators: true }
    );

    // ✅ DEBUG: Verify the update worked
    console.log('🔧 EDIT FACILITY - Updated facility:', updatedFacility);
    
    // Double-check by fetching the facility again
    const verifiedFacility = await facilityModel.findById(facilityId);
    console.log('🔧 EDIT FACILITY - Verified facility availability:', verifiedFacility.available);

    res.status(200).json({ 
      message: 'Facility updated successfully', 
      facility: updatedFacility 
    });
  } catch (err) {
    console.error('❌ EDIT FACILITY - Error:', err);
    res.status(500).json({ 
      message: 'Failed to update facility', 
      error: err.message 
    });
  }
};
// ✅ Delete Facility (ID Required)
export const deleteFacility = async (req, res) => {
  try {
    const { facilityId } = req.body;

    // Validate facilityId
    if (!facilityId) {
      return res.status(400).json({ message: 'Facility ID is required' });
    }

    // Find and delete the facility
    const facility = await facilityModel.findByIdAndDelete(facilityId);
    if (!facility) {
      return res.status(404).json({ message: 'Facility not found' });
    }

    res.status(200).json({ message: 'Facility deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete facility', error: err.message });
  }
};

// ✅ Get All Facilities
export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await facilityModel.find().collation({ locale: 'en', strength: 2 }).sort({ name: 1 });
    res.status(200).json({ facilities });
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve facilities', error: err.message });
  }
};