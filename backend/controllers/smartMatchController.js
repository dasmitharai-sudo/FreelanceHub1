const FreelancerProfile = require('../models/FreelancerProfile');
const User = require('../models/User');

// @desc    Smart Freelancer Matching (Unique Feature)
// @route   POST /api/smart-match
// @access  Public
exports.matchFreelancers = async (req, res, next) => {
  try {
    const { category, skills, maxBudget, minRating, experienceLevel } = req.body;

    let query = {};

    // Filter active freelancers only
    const activeUsers = await User.find({ role: 'freelancer', status: 'active' }).select('_id');
    const activeUserIds = activeUsers.map(u => u._id);

    query.user = { $in: activeUserIds };

    if (category && category !== 'All') {
      query.categories = { $in: [new RegExp(category, 'i')] };
    }

    if (skills && Array.isArray(skills) && skills.length > 0) {
      const skillRegexes = skills.map(s => new RegExp(s, 'i'));
      query.skills = { $in: skillRegexes };
    }

    if (maxBudget) {
      query.hourlyRate = { $lte: Number(maxBudget) };
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    if (experienceLevel) {
      if (experienceLevel === 'entry') query.experience = { $lte: 2 };
      else if (experienceLevel === 'intermediate') query.experience = { $gt: 2, $lte: 5 };
      else if (experienceLevel === 'expert') query.experience = { $gt: 5 };
    }

    const matchedProfiles = await FreelancerProfile.find(query)
      .populate('user', 'name avatar email phone location isVerified')
      .sort({ rating: -1, profileCompletion: -1 })
      .limit(12);

    // Calculate match score
    const scoredFreelancers = matchedProfiles.map(p => {
      let score = 50; // base score
      if (p.rating >= 4.5) score += 20;
      if (p.user && p.user.isVerified) score += 15;
      if (p.profileCompletion >= 80) score += 15;

      return {
        ...p.toObject(),
        matchScore: Math.min(score, 100)
      };
    });

    res.status(200).json({
      success: true,
      count: scoredFreelancers.length,
      data: scoredFreelancers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Budget Estimator (Unique Feature)
// @route   POST /api/budget-estimator
// @access  Public
exports.estimateBudget = async (req, res, next) => {
  try {
    const { category, complexity, durationDays, experienceRequired } = req.body;

    // Base hourly rates per category
    const categoryBaseRates = {
      'Web Development': 800,
      'App Development': 1000,
      'Graphic Designing': 500,
      'Logo Designing': 400,
      'Content Writing': 400,
      'Photography': 700,
      'Video Editing': 650,
      'Animation': 900,
      'Education and Online Tutoring': 450,
      'Digital Marketing': 600,
      'Accounting and Finance': 750,
      'Business Consulting': 1200
    };

    const baseRate = categoryBaseRates[category] || 500;

    // Complexity multipliers
    const complexityMultipliers = {
      simple: 1.0,
      medium: 1.6,
      complex: 2.5
    };

    // Experience multipliers
    const expMultipliers = {
      entry: 0.8,
      intermediate: 1.2,
      expert: 1.8
    };

    const compMult = complexityMultipliers[complexity] || 1.2;
    const expMult = expMultipliers[experienceRequired] || 1.2;
    const days = Number(durationDays) || 5;

    // Estimated hours per day based on complexity
    const estimatedHours = days * (complexity === 'complex' ? 6 : (complexity === 'medium' ? 4 : 2));

    const estimatedHourlyRate = Math.round(baseRate * expMult);
    const estimatedTotal = Math.round(estimatedHours * estimatedHourlyRate * compMult);

    const minEstimate = Math.round(estimatedTotal * 0.85);
    const maxEstimate = Math.round(estimatedTotal * 1.25);

    res.status(200).json({
      success: true,
      data: {
        category,
        complexity,
        durationDays: days,
        estimatedHours,
        estimatedHourlyRate,
        estimatedTotal,
        range: {
          min: minEstimate,
          max: maxEstimate
        },
        recommendedPackage: estimatedTotal > 15000 ? 'Premium' : (estimatedTotal > 5000 ? 'Standard' : 'Basic')
      }
    });
  } catch (err) {
    next(err);
  }
};
