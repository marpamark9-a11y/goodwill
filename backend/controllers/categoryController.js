
import categoryModel from '../models/categoryModel.js';
import { v2 as cloudinary } from 'cloudinary';

// ✅ Add Category (Image Required - Doctor Style)
export const addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    const imageFile = req.file;

    if (!category || !imageFile) {
      return res.json({ success: false, message: 'Category name and image are required' });
    }

    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'categories',
      resource_type: 'image'
    });

    const imageUrl = imageUpload.secure_url;

    const newCategory = new categoryModel({
      category,
      image: imageUrl
    });

    await newCategory.save();

    return res.json({ success: true, message: 'Category added successfully', category: newCategory });

  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
};

// ✅ Get All Categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find().sort({ category: 1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve categories', error: err.message });
  }
};

// ✅ Edit Category (Image Optional)
export const editCategory = async (req, res) => {
  try {
    const { categoryId, category } = req.body;

    if (!categoryId || !category || category.trim() === '') {
      return res.json({ success: false, message: 'Category ID and name are required' });
    }

    const updateData = { category };

    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, {
        folder: 'categories',
        resource_type: 'image'
      });
      updateData.image = imageUpload.secure_url;
    }

    const updated = await categoryModel.findByIdAndUpdate(categoryId, updateData, { new: true });
    if (!updated) return res.json({ success: false, message: 'Category not found' });

    return res.json({ success: true, message: 'Category updated successfully', category: updated });

  } catch (err) {
    return res.json({ success: false, message: 'Failed to update category', error: err.message });
  }
};

// ✅ Delete Category (ID Required - Facility Style)
export const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: 'Category ID is required' });
    }

    const category = await categoryModel.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete category', error: err.message });
  }
};
