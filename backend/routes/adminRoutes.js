const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  toggleUserStatus,
  toggleVerifyFreelancer,
  getAllTransactions,
  getWithdrawalRequests,
  updateWithdrawalStatus,
  updateCommission,
  getDisputes,
  resolveDispute
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);
router.put('/users/:id/verify', toggleVerifyFreelancer);
router.get('/transactions', getAllTransactions);
router.get('/withdrawals', getWithdrawalRequests);
router.put('/withdrawals/:id', updateWithdrawalStatus);
router.put('/commission', updateCommission);
router.get('/disputes', getDisputes);
router.put('/disputes/:id/resolve', resolveDispute);

module.exports = router;
