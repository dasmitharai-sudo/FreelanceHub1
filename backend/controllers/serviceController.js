const Service = require('../models/Service');
const FreelancerProfile = require('../models/FreelancerProfile');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Get all services with filtering & search
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      deliveryDays,
      sort
    } = req.query;

    let query = { isActive: true };

    // Category filter
    if (category && category !== 'All') {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Delivery days filter
    if (deliveryDays) {
      query['packages.basic.deliveryDays'] = { $lte: Number(deliveryDays) };
    }

    // Price range filter (checks basic package price)
    if (minPrice || maxPrice) {
      query['packages.basic.price'] = {};
      if (minPrice) query['packages.basic.price'].$gte = Number(minPrice);
      if (maxPrice) query['packages.basic.price'].$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    let serviceQuery = Service.find(query).populate({
      path: 'freelancer',
      select: 'name avatar location isVerified'
    });

    // Sorting
    if (sort === 'price_asc') {
      serviceQuery = serviceQuery.sort({ 'packages.basic.price': 1 });
    } else if (sort === 'price_desc') {
      serviceQuery = serviceQuery.sort({ 'packages.basic.price': -1 });
    } else if (sort === 'rating') {
      serviceQuery = serviceQuery.sort({ rating: -1 });
    } else {
      serviceQuery = serviceQuery.sort({ createdAt: -1 });
    }

    const services = await serviceQuery;

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate({
      path: 'freelancer',
      select: 'name email avatar phone location isVerified createdAt'
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Fetch freelancer profile
    const freelancerProfile = await FreelancerProfile.findOne({
      user: service.freelancer._id
    });

    // Fetch reviews for this service
    const reviews = await Review.find({ reviewee: service.freelancer._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    // Fetch related services
    const relatedServices = await Service.find({
      category: service.category,
      _id: { $ne: service._id },
      isActive: true
    })
      .populate('freelancer', 'name avatar isVerified')
      .limit(4);

    res.status(200).json({
      success: true,
      data: service,
      freelancerProfile,
      reviews,
      relatedServices
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new service listing
// @route   POST /api/services
// @access  Private (Freelancer)
exports.createService = async (req, res, next) => {
  try {
    let {
      title,
      category,
      description,
      deliveryDays,
      requiredInfo,
      packages
    } = req.body;

    if (typeof packages === 'string') {
      packages = JSON.parse(packages);
    }

    let images = ['/assets/images/service-default.jpg'];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      images = [`/uploads/${req.file.filename}`];
    }

    const service = await Service.create({
      freelancer: req.user.id,
      title,
      category,
      description,
      deliveryDays: Number(deliveryDays) || 3,
      requiredInfo,
      packages,
      images
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update service listing
// @route   PUT /api/services/:id
// @access  Private (Freelancer or Admin)
exports.updateService = async (req, res, next) => {
  try {
    let service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Make sure user owns service or is admin
    if (service.freelancer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this service listing'
      });
    }

    let updateData = { ...req.body };
    if (typeof updateData.packages === 'string') {
      updateData.packages = JSON.parse(updateData.packages);
    }

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map(f => `/uploads/${f.filename}`);
    }

    service = await Service.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: service
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Freelancer or Admin)
exports.deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.freelancer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this service listing'
      });
    }

    await service.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get services by a specific freelancer
// @route   GET /api/services/freelancer/:userId
// @access  Public
exports.getFreelancerServices = async (req, res, next) => {
  try {
    const services = await Service.find({
      freelancer: req.params.userId,
      isActive: true
    });

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Compare multiple services (Unique Feature: Service Comparison)
// @route   GET /api/services/compare
// @access  Public
exports.compareServices = async (req, res, next) => {
  try {
    const { ids } = req.query;
    if (!ids) {
      return res.status(400).json({ success: false, message: 'Please provide service IDs to compare' });
    }

    const idList = ids.split(',').filter(id => id.trim().length > 0);
    const services = await Service.find({ _id: { $in: idList } })
      .populate('freelancer', 'name avatar location isVerified');

    res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (err) {
    next(err);
  }
};
