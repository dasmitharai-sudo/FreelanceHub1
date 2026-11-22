const express = require('express');
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getFreelancerServices,
  compareServices
} = require('../controllers/serviceController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getServices);
router.get('/compare', compareServices);
router.get('/freelancer/:userId', getFreelancerServices);
router.get('/:id', getServiceById);

router.post('/', protect, authorize('freelancer'), upload.array('images', 5), createService);
router.put('/:id', protect, upload.array('images', 5), updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
