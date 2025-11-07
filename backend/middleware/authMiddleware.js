// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';

// Verify Token (Authentication Middleware)
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, userType }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Check if User is Admin
export const isAdmin = async (req, res, next) => {
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin only' });
  }
  next();
};

// Check if User is Staff
export const isStaff = async (req, res, next) => {
  if (req.user?.userType !== 'staff') {
    return res.status(403).json({ message: 'Access denied: Staff only' });
  }
  next();
};

// Check if User is Regular User
export const isUser = async (req, res, next) => {
  if (req.user?.userType !== 'user') {
    return res.status(403).json({ message: 'Access denied: Regular user only' });
  }
  next();
};
