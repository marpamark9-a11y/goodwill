import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String, // URL (or path) to the category image
    required: true
  }
});

const categoryModel = mongoose.models.categories || mongoose.model('categories', categorySchema);

export default categoryModel;
