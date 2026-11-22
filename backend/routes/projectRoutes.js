const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  submitWork,
  reviewSubmission,
  addMilestone,
  releaseMilestone
} = require('../controllers/projectController');

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getProjects);
router.get('/:id', protect, getProjectById);
router.post('/', protect, authorize('client'), upload.array('attachments', 5), createProject);
router.put('/:id', protect, authorize('client', 'admin'), updateProject);

// Project Workspace & Work Actions
router.post('/:id/submit-work', protect, authorize('freelancer'), upload.single('workFile'), submitWork);
router.post('/:id/review-submission', protect, authorize('client', 'admin'), reviewSubmission);
router.post('/:id/milestones', protect, authorize('client'), addMilestone);
router.put('/:id/milestones/:milestoneId/release', protect, authorize('client', 'admin'), releaseMilestone);

module.exports = router;
