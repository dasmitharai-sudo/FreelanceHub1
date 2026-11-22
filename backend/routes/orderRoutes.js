const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  deliverOrder,
  requestRevision,
  approveOrder
} = require('../controllers/orderController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, authorize('client'), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);

// Order actions
router.post('/:id/deliver', protect, authorize('freelancer'), upload.single('deliveryFile'), deliverOrder);
router.post('/:id/revision', protect, authorize('client', 'admin'), requestRevision);
router.post('/:id/approve', protect, authorize('client', 'admin'), approveOrder);

module.exports = router;
