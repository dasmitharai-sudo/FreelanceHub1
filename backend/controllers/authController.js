const crypto = require('crypto');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');

// Helper to send token response
const sendTokenResponse = async (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  let freelancerProfile = null;
  let clientProfile = null;
  let wallet = null;

  if (user.role === 'freelancer') {
    freelancerProfile = await FreelancerProfile.findOne({ user: user._id });
    wallet = await Wallet.findOne({ user: user._id });
  } else if (user.role === 'client') {
    clientProfile = await ClientProfile.findOne({ user: user._id });
  }

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
      isVerified: user.isVerified,
      status: user.status
    },
    freelancerProfile,
    clientProfile,
    wallet
  });
};

// @desc    Register user (Client or Freelancer)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      location,
      title,
      categories,
      skills,
      hourlyRate,
      experience,
      companyName
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Create user
    const userRole = role === 'freelancer' ? 'freelancer' : (role === 'admin' ? 'admin' : 'client');
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone: phone || '',
      location: location || 'India',
      avatar: req.file ? `/uploads/${req.file.filename}` : '/assets/images/default-avatar.png'
    });

    // Create corresponding profile & wallet
    if (userRole === 'freelancer') {
      const parsedCategories = Array.isArray(categories)
        ? categories
        : (categories ? categories.split(',').map(s => s.trim()) : []);
      const parsedSkills = Array.isArray(skills)
        ? skills
        : (skills ? skills.split(',').map(s => s.trim()) : []);

      const profile = new FreelancerProfile({
        user: user._id,
        title: title || 'Professional Freelancer',
        categories: parsedCategories,
        skills: parsedSkills,
        hourlyRate: Number(hourlyRate) || 500,
        experience: Number(experience) || 1
      });
      profile.calculateCompletion();
      await profile.save();

      await Wallet.create({ user: user._id });
    } else if (userRole === 'client') {
      await ClientProfile.create({
        user: user._id,
        companyName: companyName || ''
      });
    }

    // Create Welcome Notification
    await Notification.create({
      user: user._id,
      title: 'Welcome to FreelanceHub!',
      message: `Hi ${user.name}, your ${user.role} account has been successfully created. Explore opportunities and connect with top talent!`,
      type: 'system',
      link: userRole === 'freelancer' ? '/freelancer-dashboard' : '/client-dashboard'
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Please contact administrator.'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let freelancerProfile = null;
    let clientProfile = null;
    let wallet = null;

    if (user.role === 'freelancer') {
      freelancerProfile = await FreelancerProfile.findOne({ user: user._id });
      wallet = await Wallet.findOne({ user: user._id });
      if (!wallet) {
        wallet = await Wallet.create({ user: user._id });
      }
    } else if (user.role === 'client') {
      clientProfile = await ClientProfile.findOne({ user: user._id }).populate('savedFreelancers', 'name avatar role isVerified location');
    }

    res.status(200).json({
      success: true,
      user,
      freelancerProfile,
      clientProfile,
      wallet
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update basic user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Name update
    if (req.body.name !== undefined && req.body.name.trim() !== '') {
      user.name = req.body.name.trim();
    }

    // Email update with validation
    if (req.body.email !== undefined && req.body.email.trim() !== '') {
      const email = req.body.email.trim().toLowerCase();
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      }
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'This email address is already in use by another account.' });
      }
      user.email = email;
    }

    // Phone & Location
    if (req.body.phone !== undefined) {
      user.phone = req.body.phone;
    }

    if (req.body.location !== undefined) {
      user.location = req.body.location;
    }

    // Avatar upload or removal
    if (req.file) {
      user.avatar = `/uploads/${req.file.filename}`;
    } else if (req.body.removeAvatar === 'true' || req.body.removeAvatar === true) {
      user.avatar = '/assets/images/default-avatar.png';
    }

    await user.save();

    // If freelancer or client role, update profile fields if provided
    if (user.role === 'freelancer') {
      const fProfile = await FreelancerProfile.findOne({ user: user._id });
      if (fProfile) {
        if (req.body.title !== undefined) fProfile.title = req.body.title;
        if (req.body.bio !== undefined) fProfile.bio = req.body.bio;
        if (req.body.hourlyRate !== undefined) fProfile.hourlyRate = Number(req.body.hourlyRate) || fProfile.hourlyRate;
        await fProfile.save();
      }
    } else if (user.role === 'client') {
      const cProfile = await ClientProfile.findOne({ user: user._id });
      if (cProfile) {
        if (req.body.companyName !== undefined) cProfile.companyName = req.body.companyName;
        if (req.body.website !== undefined) cProfile.website = req.body.website;
        await cProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile details updated successfully.',
      user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update Password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new passwords.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'The current password you entered is incorrect.'
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Update Freelancer profile
// @route   PUT /api/auth/freelancer-profile
// @access  Private (Freelancer)
exports.updateFreelancerProfile = async (req, res, next) => {
  try {
    let profile = await FreelancerProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new FreelancerProfile({ user: req.user.id });
    }

    const {
      title,
      categories,
      skills,
      experience,
      hourlyRate,
      availability,
      bio,
      languages,
      education,
      portfolio
    } = req.body;

    if (title !== undefined) profile.title = title;
    if (categories !== undefined) {
      profile.categories = Array.isArray(categories)
        ? categories
        : categories.split(',').map(s => s.trim());
    }
    if (skills !== undefined) {
      profile.skills = Array.isArray(skills)
        ? skills
        : skills.split(',').map(s => s.trim());
    }
    if (languages !== undefined) {
      profile.languages = Array.isArray(languages)
        ? languages
        : languages.split(',').map(s => s.trim());
    }
    if (experience !== undefined) profile.experience = Number(experience);
    if (hourlyRate !== undefined) profile.hourlyRate = Number(hourlyRate);
    if (availability !== undefined) profile.availability = availability;
    if (bio !== undefined) profile.bio = bio;
    if (education !== undefined) profile.education = education;
    if (portfolio !== undefined) profile.portfolio = portfolio;

    profile.calculateCompletion();
    await profile.save();

    res.status(200).json({
      success: true,
      freelancerProfile: profile
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add / Update Portfolio item
// @route   POST /api/auth/portfolio
// @access  Private (Freelancer)
exports.addPortfolioItem = async (req, res, next) => {
  try {
    const profile = await FreelancerProfile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const { title, description, link } = req.body;
    let image = req.file ? `/uploads/${req.file.filename}` : '/assets/images/portfolio-default.jpg';

    profile.portfolio.push({ title, description, link, image });
    profile.calculateCompletion();
    await profile.save();

    res.status(200).json({
      success: true,
      portfolio: profile.portfolio,
      completion: profile.profileCompletion
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle bookmark/save freelancer (Client feature)
// @route   POST /api/auth/save-freelancer/:id
// @access  Private (Client)
exports.toggleSaveFreelancer = async (req, res, next) => {
  try {
    const freelancerId = req.params.id;
    let profile = await ClientProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = await ClientProfile.create({ user: req.user.id, savedFreelancers: [] });
    }

    const index = profile.savedFreelancers.indexOf(freelancerId);
    let isSaved = false;

    if (index > -1) {
      profile.savedFreelancers.splice(index, 1);
      isSaved = false;
    } else {
      profile.savedFreelancers.push(freelancerId);
      isSaved = true;
    }

    await profile.save();

    res.status(200).json({
      success: true,
      isSaved,
      savedFreelancers: profile.savedFreelancers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken // Returned directly for easy test/academic demonstration
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};
