const express = require('express');
const router = express.Router();
const FreelancerProfile = require('../models/FreelancerProfile');
const User = require('../models/User');
const Service = require('../models/Service');
const Review = require('../models/Review');

// @desc    Get all freelancers with filtering & search
// @route   GET /api/freelancers
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const {
      search,
      category,
      skill,
      minRate,
      maxRate,
      minRating,
      availability,
      experience
    } = req.query;

    let profileQuery = {};

    // Get active freelancers only
    const activeUsers = await User.find({ role: 'freelancer', status: 'active' }).select('_id');
    const activeUserIds = activeUsers.map(u => u._id);
    profileQuery.user = { $in: activeUserIds };

    if (category && category !== 'All') {
      profileQuery.categories = { $in: [new RegExp(category, 'i')] };
    }

    if (skill) {
      profileQuery.skills = { $in: [new RegExp(skill, 'i')] };
    }

    if (availability && availability !== 'All') {
      profileQuery.availability = availability;
    }

    if (minRating) {
      profileQuery.rating = { $gte: Number(minRating) };
    }

    if (experience) {
      profileQuery.experience = { $gte: Number(experience) };
    }

    if (minRate || maxRate) {
      profileQuery.hourlyRate = {};
      if (minRate) profileQuery.hourlyRate.$gte = Number(minRate);
      if (maxRate) profileQuery.hourlyRate.$lte = Number(maxRate);
    }

    let profiles = await FreelancerProfile.find(profileQuery)
      .populate('user', 'name avatar location isVerified createdAt')
      .sort({ rating: -1, profileCompletion: -1 });

    // Text search on name, title, skills
    if (search) {
      const s = search.toLowerCase();
      profiles = profiles.filter(p => {
        const nameMatch = p.user && p.user.name.toLowerCase().includes(s);
        const titleMatch = p.title && p.title.toLowerCase().includes(s);
        const skillMatch = p.skills && p.skills.some(sk => sk.toLowerCase().includes(s));
        const categoryMatch = p.categories && p.categories.some(cat => cat.toLowerCase().includes(s));
        return nameMatch || titleMatch || skillMatch || categoryMatch;
      });
    }

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles
    });
  } catch (err) {
    next(err);
  }
});

// @desc    Get single freelancer public profile
// @route   GET /api/freelancers/:id
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'freelancer') {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    const profile = await FreelancerProfile.findOne({ user: user._id });
    const services = await Service.find({ freelancer: user._id, isActive: true });
    const reviews = await Review.find({ reviewee: user._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      user,
      profile,
      services,
      reviews
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
