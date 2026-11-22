const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  getWallet,
  requestWithdrawal,
  getMyTransactions,
  getCommissionRate
} = require('../controllers/paymentController');

const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/wallet', protect, authorize('freelancer'), getWallet);
router.post('/withdraw', protect, authorize('freelancer'), requestWithdrawal);
router.get('/transactions', protect, getMyTransactions);
router.get('/commission-rate', getCommissionRate);

module.exports = router;
