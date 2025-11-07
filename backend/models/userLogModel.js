// models/userLogModel.js
import mongoose from "mongoose";

const userLogSchema = new mongoose.Schema({
  userId: { 
    type: String, // matches your String _id in userModel
    required: true 
  },
  loginTime: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  }
}, { timestamps: true });

const userLogModel = mongoose.models.userLog || mongoose.model("userLog", userLogSchema);

export default userLogModel;
