const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const SystemSetting = require('../models/SystemSetting');
const Notification = require('../models/Notification');
const razorpayUtil = require('../config/razorpay');

// @desc    Initiate Razorpay order for checkout
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    const order = await razorpayUtil.createOrder(amount, receipt);

    res.status(200).json({
      success: true,
      keyId: razorpayUtil.key_id,
      order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payments/verify
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const isValid = razorpayUtil.verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed. Invalid signature.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment signature verified successfully.'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get Freelancer Wallet details
// @route   GET /api/payments/wallet
// @access  Private (Freelancer)
exports.getWallet = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user.id });
    }

    const transactions = await Transaction.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    const withdrawals = await WithdrawalRequest.find({ freelancer: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      wallet,
      transactions,
      withdrawals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request withdrawal from wallet
// @route   POST /api/payments/withdraw
// @access  Private (Freelancer)
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, accountDetails } = req.body;
    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is ₹100'
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet || wallet.availableBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available balance in your wallet.'
      });
    }

    // Deduct immediately from available balance to prevent double-spending
    wallet.availableBalance -= withdrawAmount;
    await wallet.save();

    const withdrawal = await WithdrawalRequest.create({
      freelancer: req.user.id,
      amount: withdrawAmount,
      method: method || 'UPI',
      accountDetails: accountDetails || {},
      status: 'pending'
    });

    await Transaction.create({
      wallet: wallet._id,
      user: req.user.id,
      type: 'withdrawal',
      amount: withdrawAmount,
      description: `Withdrawal request submitted via ${method || 'UPI'}`,
      referenceId: withdrawal._id.toString(),
      status: 'pending'
    });

    await Notification.create({
      user: req.user.id,
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal request of ₹${withdrawAmount} via ${method || 'UPI'} is submitted and pending admin approval.`,
      type: 'withdrawal',
      link: '/freelancer-dashboard'
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Processing by administrator.',
      data: withdrawal,
      wallet
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's transactions
// @route   GET /api/payments/transactions
// @access  Private
exports.getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id })
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

// @desc    Get current platform commission percentage
// @route   GET /api/payments/commission-rate
// @access  Public
exports.getCommissionRate = async (req, res, next) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
    const commission = setting ? Number(setting.value) : 10;

    res.status(200).json({
      success: true,
      commissionPercent: commission
    });
  } catch (err) {
    next(err);
  }
};
