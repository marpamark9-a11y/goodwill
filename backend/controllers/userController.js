import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { v2 as cloudinary } from 'cloudinary';
import userLogModel from "../models/userLogModel.js";

// REGISTER USER (Auto-generated ID)
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, address, userType } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      _id: `U${Date.now()}`,
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      address,
      userType
    });

    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
        userType: newUser.userType,
        image: newUser.image
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    
    // Check if the account is active
    if (user.userType === 'user' && user.active === false) {
      return res.status(403).json({ message: "This account has been deactivated. Please contact support for assistance." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Log the successful login
    await userLogModel.create({
      userId: user._id,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent")
    });

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        userType: user.userType,
        image: user.image
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// UPDATE PROFILE with optional password change
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, phoneNumber, address, password } = req.body;

    // Build update object
    const updateData = { fullName, phoneNumber, address };

    // If password is provided, hash it and add to update
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ 
      message: password ? 'Profile and password updated successfully.' : 'Profile updated successfully.', 
      user 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// UPLOAD AVATAR FROM FILE (Backend via Multer → Cloudinary)
export const uploadAvatarFromFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'user_avatars',
    });

    const userId = req.user.userId;
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { image: result.secure_url },
      { new: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({
      message: 'Avatar uploaded successfully.',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ message: 'Avatar upload failed.', error: err.message });
  }
};

// CHANGE PASSWORD
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await userModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};

// ✅ GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    // Include active status in the response
    const users = await userModel.find()
      .select('-password')
      .sort({ active: -1 }); // Show active users first
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.', error: err.message });
  }
};

// ✅ EDIT USER INFO (Admin or secure edit by ID)
export const editUserById = async (req, res) => {
  try {
    const { userId, fullName, email, phoneNumber, address, userType } = req.body;

    const updated = await userModel.findByIdAndUpdate(
      userId,
      { fullName, email, phoneNumber, address, userType },
      { new: true }
    ).select('-password');

    if (!updated) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ message: 'User info updated successfully.', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update user info.', error: err.message });
  }
};

// controllers/userController.js
export const getUserLogs = async (req, res) => {
  try {
    const { userId } = req.body; // or req.query if you want it in URL params

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required." });
    }

    const logs = await userLogModel
      .find({ userId })
      .sort({ loginTime: -1 });

    if (!logs.length) {
      return res.status(404).json({ success: false, message: "No logs found." });
    }

    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error.", error: err.message });
  }
};

// ✅ DEACTIVATE USER (Admin only)
export const deleteUserById = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Instead of deleting, we'll set the active status to false
    user.active = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User account has been deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to deactivate user.', error: err.message });
  }
};

// ✅ REACTIVATE USER (Admin only)
export const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Set the active status to true
    user.active = true;
    await user.save();

    res.status(200).json({ success: true, message: 'User account has been reactivated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reactivate user.', error: err.message });
  }
};

/// ✅ ADMIN CHANGE USER PASSWORD (Allows admin to change any user's password)
export const adminChangeUserPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    const adminId = req.user.userId;

    // Check if admin exists and is actually an admin
    const admin = await userModel.findById(adminId);
    if (!admin || admin.userType !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    if (!userId || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and new password are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters.' 
      });
    }

    // Find the target user
    const targetUser = await userModel.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    // Hash and update the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(
      userId, 
      { password: hashedPassword },
      { new: true }
    );

    // SUCCESS RESPONSE - Make sure success is always true for successful operations
    res.status(200).json({ 
      success: true, 
      message: `Password for ${targetUser.fullName} has been updated successfully.`,
      user: {
        _id: targetUser._id,
        fullName: targetUser.fullName,
        email: targetUser.email
      }
    });
  } catch (err) {
    console.error('Admin change password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while changing password.', 
      error: err.message 
    });
  }
};