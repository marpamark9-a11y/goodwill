import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom ID (e.g., R001)
  facilityId: { type: String, required: true },
  facilityName: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },

  packageName: { type: String, required: true },
  packageFee: { type: Number, required: true },

  totalPrice: { type: Number, required: true },
  totalHours: { type: Number, required: true },

  date: { type: String, required: true }, // YYYY-MM-DD
  startTime: { type: String, required: true }, // HH:mm
  endTime: { type: String, required: true },

  userId: { type: String, required: true },
  userName: { type: String, required: true },
  // Include 'guest' so guest reservations (no authenticated user) are allowed
  userType: { type: String, enum: ['user', 'admin', 'customer', 'staff', 'guest'], default: 'user' },

  // Optional contact email for guest reservations
  email: { type: String, required: false },

  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled', 'Completed','Cancelling'],
    default: 'Pending'
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed','Refund Pending','Refunded'],
    default: 'Pending'
  },

  paymentType: {
    type: String,
    enum: ['Online', 'Cash', 'PayMongo', 'GCash', 'PayMaya', 'GoTyme'],
    default: 'Online'
  },

  paymentReference: { type: String, default: null }, // Payment reference (for custom payments)

  handledBy: { type: String, default: null }, // User ID of staff who handled the reservation (for walk-ins)

  isCompleted: { type: Boolean, default: false },
  notes: { type: String, default: '' },

  datePaid: { type: String, default: null },
  dateCancelled: { type: String, default: null },
  cancellationReason: { type: String, default: null },

}, { timestamps: true });

const reservationModel = mongoose.models.reservations || mongoose.model("reservations", reservationSchema);

export default reservationModel;
