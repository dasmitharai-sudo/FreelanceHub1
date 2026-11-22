const express = require('express');
const router = express.Router();
const {
  createReview,
  getFreelancerReviews
} = require('../controllers/reviewController');

const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/freelancer/:id', getFreelancerReviews);

module.exports = router;
