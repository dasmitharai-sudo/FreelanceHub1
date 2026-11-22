const express = require('express');
const router = express.Router();
const {
  applyForProject,
  getProjectProposals,
  getMyProposals,
  acceptProposal,
  rejectProposal,
  withdrawProposal
} = require('../controllers/proposalController');

const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('freelancer'), applyForProject);
router.get('/my-proposals', protect, authorize('freelancer'), getMyProposals);
router.get('/project/:projectId', protect, authorize('client', 'admin'), getProjectProposals);
router.post('/:id/accept', protect, authorize('client', 'admin'), acceptProposal);
router.post('/:id/reject', protect, authorize('client', 'admin'), rejectProposal);
router.delete('/:id', protect, authorize('freelancer'), withdrawProposal);

module.exports = router;
