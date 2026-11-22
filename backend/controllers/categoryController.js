const Category = require('../models/Category');
const Service = require('../models/Service');
const FreelancerProfile = require('../models/FreelancerProfile');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort('name');

    // Aggregate counts for services and freelancers
    const categoriesWithCounts = await Promise.all(
      categories.map(async cat => {
        const serviceCount = await Service.countDocuments({
          category: cat.name,
          isActive: true
        });
        const freelancerCount = await FreelancerProfile.countDocuments({
          categories: cat.name
        });
        return {
          ...cat.toObject(),
          serviceCount,
          freelancerCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: categoriesWithCounts.length,
      data: categoriesWithCounts
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
// @access  Public
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const services = await Service.find({ category: category.name, isActive: true })
      .populate('freelancer', 'name avatar isVerified location');

    const freelancers = await FreelancerProfile.find({ categories: category.name })
      .populate('user', 'name avatar isVerified location');

    res.status(200).json({
      success: true,
      category,
      services,
      freelancers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Category
// @route   POST /api/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, description } = req.body;
    const category = await Category.create({ name, icon, description });
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private (Admin)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private (Admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category removed successfully' });
  } catch (err) {
    next(err);
  }
};
