// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Unique user ID
  fullName: { type: String, required: true }, // Full name
  email: { type: String, required: true, unique: true }, // Unique email
  password: { type: String, required: true }, // Hashed password
  phoneNumber: { type: String, default: '' }, // Optional phone
  address: { type: String, default: '' }, // Optional address
  userType: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user'
  }, // User role
  active: {
    type: Boolean,
    default: true
  }, // Account status
  image: {
    type: String,
    default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA... (base64 default avatar)'
  }
}, { minimize: false });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
