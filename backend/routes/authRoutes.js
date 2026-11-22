const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  updateFreelancerProfile,
  addPortfolioItem,
  toggleSaveFreelancer,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, upload.single('avatar'), updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/freelancer-profile', protect, authorize('freelancer'), updateFreelancerProfile);
router.post('/portfolio', protect, authorize('freelancer'), upload.single('image'), addPortfolioItem);
router.post('/save-freelancer/:id', protect, authorize('client'), toggleSaveFreelancer);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

module.exports = router;
