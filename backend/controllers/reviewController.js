const Review = require('../models/Review');
const Order = require('../models/Order');
const Project = require('../models/Project');
const FreelancerProfile = require('../models/FreelancerProfile');
const Service = require('../models/Service');
const Notification = require('../models/Notification');

// @desc    Submit review and rating
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { orderId, projectId, rating, comment } = req.body;
    const reviewerId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Please provide rating between 1 and 5 stars' });
    }

    let revieweeId = null;
    let order = null;
    let project = null;

    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
      if (order.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Reviews can only be submitted after order completion' });
      }

      // Determine who is reviewing whom
      if (order.client.toString() === reviewerId) {
        revieweeId = order.freelancer;
      } else if (order.freelancer.toString() === reviewerId) {
        revieweeId = order.client;
      } else {
        return res.status(403).json({ success: false, message: 'Not involved in this order' });
      }

      // Check for duplicate review
      const existing = await Review.findOne({ order: orderId, reviewer: reviewerId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already submitted a review for this order' });
      }
    } else if (projectId) {
      project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      if (project.status !== 'Completed') {
        return res.status(400).json({ success: false, message: 'Reviews can only be submitted after project completion' });
      }

      if (project.client.toString() === reviewerId) {
        revieweeId = project.hiredFreelancer;
      } else if (project.hiredFreelancer && project.hiredFreelancer.toString() === reviewerId) {
        revieweeId = project.client;
      } else {
        return res.status(403).json({ success: false, message: 'Not involved in this project' });
      }

      const existing = await Review.findOne({ project: projectId, reviewer: reviewerId });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already submitted a review for this project' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Either orderId or projectId must be provided' });
    }

    const review = await Review.create({
      order: orderId || null,
      project: projectId || null,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: Number(rating),
      comment,
      role: req.user.role === 'client' ? 'client_to_freelancer' : 'freelancer_to_client'
    });

    // Update Freelancer Profile average rating if reviewee is a freelancer
    const profile = await FreelancerProfile.findOne({ user: revieweeId });
    if (profile) {
      const allReviews = await Review.find({ reviewee: revieweeId });
      const totalScore = allReviews.reduce((acc, item) => acc + item.rating, 0);
      profile.rating = Number((totalScore / allReviews.length).toFixed(1));
      profile.numReviews = allReviews.length;
      await profile.save();

      // Also update service rating if order
      if (order && order.service) {
        await Service.findByIdAndUpdate(order.service, {
          rating: profile.rating,
          numReviews: profile.numReviews
        });
      }
    }

    // Notify reviewee
    await Notification.create({
      user: revieweeId,
      title: 'New Rating & Review Received!',
      message: `${req.user.name} gave you a ${rating}-star rating: "${comment.substring(0, 50)}..."`,
      type: 'order',
      link: '/reviews'
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get reviews for a freelancer
// @route   GET /api/reviews/freelancer/:id
// @access  Public
exports.getFreelancerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    next(err);
  }
};
