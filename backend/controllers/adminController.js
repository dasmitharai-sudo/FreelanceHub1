const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const Project = require('../models/Project');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Dispute = require('../models/Dispute');
const SystemSetting = require('../models/SystemSetting');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Notification');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalProjects = await Project.countDocuments();
    const totalOrders = await Order.countDocuments();
    const completedProjects = await Project.countDocuments({ status: 'Completed' });
    const completedOrders = await Order.countDocuments({ status: 'Completed' });

    // Calculate total platform commission from completed orders & projects
    const completedOrdersList = await Order.find({ status: 'Completed' });
    const totalCommission = completedOrdersList.reduce((acc, curr) => acc + (curr.platformCommission || 0), 0);

    const allTransactions = await Transaction.find();
    const totalVolume = allTransactions.reduce((acc, curr) => acc + (curr.amount || 0), 0);

    const pendingWithdrawalsCount = await WithdrawalRequest.countDocuments({ status: 'pending' });
    const openDisputesCount = await Dispute.countDocuments({ status: { $in: ['open', 'under_review'] } });

    // Current commission setting
    const commSetting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
    const commissionPercent = commSetting ? Number(commSetting.value) : 10;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalFreelancers,
        totalClients,
        totalProjects,
        totalOrders,
        completedProjects,
        completedOrders,
        totalCommission,
        totalVolume,
        pendingWithdrawalsCount,
        openDisputesCount,
        commissionPercent
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users with search & filters
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, status } = req.query;
    let query = {};

    if (role && role !== 'all') query.role = role;
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user status (Active / Suspended)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.status = user.status === 'active' ? 'suspended' : 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.status}.`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle Freelancer Verification Badge
// @route   PUT /api/admin/users/:id/verify
// @access  Private (Admin)
exports.toggleVerifyFreelancer = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isVerified = !user.isVerified;
    await user.save();

    await Notification.create({
      user: user._id,
      title: user.isVerified ? 'Profile Verified!' : 'Verification Status Updated',
      message: user.isVerified
        ? 'Congratulations! You have received the official FreelanceHub Verified Freelancer badge.'
        : 'Your verified status has been modified by the administrator.',
      type: 'system',
      link: '/freelancer-dashboard'
    });

    res.status(200).json({
      success: true,
      message: `User verified badge is now: ${user.isVerified ? 'Verified' : 'Unverified'}`,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all platform transactions
// @route   GET /api/admin/transactions
// @access  Private (Admin)
exports.getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all withdrawal requests
// @route   GET /api/admin/withdrawals
// @access  Private (Admin)
exports.getWithdrawalRequests = async (req, res, next) => {
  try {
    const withdrawals = await WithdrawalRequest.find()
      .populate('freelancer', 'name email phone avatar isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: withdrawals.length,
      data: withdrawals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve or reject withdrawal request
// @route   PUT /api/admin/withdrawals/:id
// @access  Private (Admin)
exports.updateWithdrawalStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body; // 'approved' | 'rejected'
    const withdrawal = await WithdrawalRequest.findById(req.params.id);

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This withdrawal request has already been ${withdrawal.status}.`
      });
    }

    const wallet = await Wallet.findOne({ user: withdrawal.freelancer });

    if (status === 'approved') {
      withdrawal.status = 'approved';
      withdrawal.adminRemarks = remarks || 'Payout processed successfully via simulated payment gateway.';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      if (wallet) {
        wallet.withdrawnAmount += withdrawal.amount;
        await wallet.save();
      }

      await Notification.create({
        user: withdrawal.freelancer,
        title: 'Withdrawal Approved!',
        message: `Your withdrawal of ₹${withdrawal.amount} via ${withdrawal.method} has been processed: ${withdrawal.adminRemarks}`,
        type: 'withdrawal',
        link: '/freelancer-dashboard'
      });
    } else if (status === 'rejected') {
      withdrawal.status = 'rejected';
      withdrawal.adminRemarks = remarks || 'Withdrawal rejected. Funds reverted to available balance.';
      withdrawal.processedAt = new Date();
      await withdrawal.save();

      // Return funds to available balance
      if (wallet) {
        wallet.availableBalance += withdrawal.amount;
        await wallet.save();
      }

      await Notification.create({
        user: withdrawal.freelancer,
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal of ₹${withdrawal.amount} was rejected: ${withdrawal.adminRemarks}. The funds have been refunded to your wallet.`,
        type: 'withdrawal',
        link: '/freelancer-dashboard'
      });
    }

    res.status(200).json({
      success: true,
      message: `Withdrawal request ${status}.`,
      data: withdrawal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update platform commission percentage
// @route   PUT /api/admin/commission
// @access  Private (Admin)
exports.updateCommission = async (req, res, next) => {
  try {
    const { percent } = req.body;
    const rate = Number(percent);

    if (isNaN(rate) || rate < 0 || rate > 50) {
      return res.status(400).json({
        success: false,
        message: 'Platform commission must be between 0% and 50%.'
      });
    }

    let setting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
    if (!setting) {
      setting = new SystemSetting({
        key: 'platform_commission_percent',
        value: rate,
        description: 'Global platform commission percentage deducted upon project/order completion'
      });
    } else {
      setting.value = rate;
    }

    await setting.save();

    res.status(200).json({
      success: true,
      message: `Platform commission updated to ${rate}%.`,
      commissionPercent: rate
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all disputes
// @route   GET /api/admin/disputes
// @access  Private (Admin)
exports.getDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find()
      .populate('raisedBy', 'name email role')
      .populate('againstUser', 'name email role')
      .populate('order')
      .populate('project')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: disputes.length,
      data: disputes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create a dispute (Client or Freelancer)
// @route   POST /api/disputes
// @access  Private
exports.createDispute = async (req, res, next) => {
  try {
    const { orderId, projectId, againstUserId, reason, description } = req.body;

    const dispute = await Dispute.create({
      order: orderId || null,
      project: projectId || null,
      raisedBy: req.user.id,
      againstUser: againstUserId,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Dispute submitted. Admin will review and arbitrate.',
      data: dispute
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Resolve dispute (Admin)
// @route   PUT /api/admin/disputes/:id/resolve
// @access  Private (Admin)
exports.resolveDispute = async (req, res, next) => {
  try {
    const { status, resolutionNotes } = req.body; // 'resolved' | 'rejected'
    const dispute = await Dispute.findById(req.params.id);

    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    dispute.status = status || 'resolved';
    dispute.resolutionNotes = resolutionNotes || 'Resolved by administrator.';
    dispute.resolvedBy = req.user.id;
    await dispute.save();

    // Notify both users
    await Notification.create({
      user: dispute.raisedBy,
      title: 'Dispute Decision Issued',
      message: `Your dispute has been marked as ${dispute.status}: ${dispute.resolutionNotes}`,
      type: 'dispute',
      link: '/disputes'
    });

    await Notification.create({
      user: dispute.againstUser,
      title: 'Dispute Status Updated',
      message: `The dispute against you has been marked as ${dispute.status}: ${dispute.resolutionNotes}`,
      type: 'dispute',
      link: '/disputes'
    });

    res.status(200).json({
      success: true,
      message: 'Dispute resolved successfully',
      data: dispute
    });
  } catch (err) {
    next(err);
  }
};
