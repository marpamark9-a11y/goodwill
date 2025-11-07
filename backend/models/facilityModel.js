import mongoose from 'mongoose';

const pricingPackageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  feePerHour: { type: Number, required: true },
});

const facilitySchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Custom ID (e.g., F001)
  name: { type: String, required: true },
  image: { type: String, required: true }, // Stored as Cloudinary URL
  category: { type: String, required: true },
  about: { type: String, required: true },
  openTime: { type: String, required: true }, // HH:mm format
  closeTime: { type: String, required: true },
  minBookingHours: { type: Number, required: true },
  pricingPackages: { type: [pricingPackageSchema], required: true },
  available: { type: Boolean, default: true }
});

const facilityModel = mongoose.models.facilities || mongoose.model("facilities", facilitySchema);

export default facilityModel;
