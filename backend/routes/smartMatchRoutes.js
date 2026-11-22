const express = require('express');
const router = express.Router();
const {
  matchFreelancers,
  estimateBudget
} = require('../controllers/smartMatchController');
const { createDispute } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

router.post('/smart-match', matchFreelancers);
router.post('/budget-estimator', estimateBudget);
router.post('/disputes', protect, createDispute);

module.exports = router;
