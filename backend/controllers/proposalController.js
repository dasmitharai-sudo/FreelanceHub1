const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const Wallet = require('../models/Wallet');

// @desc    Submit proposal for project
// @route   POST /api/proposals
// @access  Private (Freelancer)
exports.applyForProject = async (req, res, next) => {
  try {
    const { projectId, bidAmount, deliveryDays, coverLetter } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'This project is no longer accepting new proposals.'
      });
    }

    if (project.client.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a proposal to your own project.'
      });
    }

    // Check if freelancer already applied
    const existing = await Proposal.findOne({
      project: projectId,
      freelancer: req.user.id
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a proposal for this project.'
      });
    }

    const proposal = await Proposal.create({
      project: projectId,
      freelancer: req.user.id,
      bidAmount: Number(bidAmount),
      deliveryDays: Number(deliveryDays),
      coverLetter
    });

    // Notify Client
    await Notification.create({
      user: project.client,
      title: 'New Proposal Received',
      message: `${req.user.name} submitted a bid of ₹${bidAmount} for "${project.title}".`,
      type: 'proposal',
      link: `/workspace/${project._id}`
    });

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: proposal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all proposals for a specific project
// @route   GET /api/proposals/project/:projectId
// @access  Private (Client of project or Admin)
exports.getProjectProposals = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const proposals = await Proposal.find({ project: req.params.projectId })
      .populate('freelancer', 'name email avatar phone location isVerified')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current freelancer's submitted proposals
// @route   GET /api/proposals/my-proposals
// @access  Private (Freelancer)
exports.getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user.id })
      .populate({
        path: 'project',
        select: 'title category budget deadline status client paymentType',
        populate: { path: 'client', select: 'name avatar location' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Accept proposal and hire freelancer
// @route   POST /api/proposals/:id/accept
// @access  Private (Client)
exports.acceptProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const project = await Project.findById(proposal.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to accept proposals for this project' });
    }

    // Update proposal statuses
    proposal.status = 'accepted';
    await proposal.save();

    // Reject other proposals
    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposal._id } },
      { status: 'rejected' }
    );

    // Update project
    project.hiredFreelancer = proposal.freelancer;
    project.acceptedProposal = proposal._id;
    project.budget = proposal.bidAmount; // Agreed bid
    project.status = 'In Progress';
    await project.save();

    // Create payment escrow record
    await Payment.create({
      project: project._id,
      payer: project.client,
      payee: proposal.freelancer,
      amount: proposal.bidAmount,
      status: 'held_in_escrow'
    });

    // Update freelancer pending balance in wallet
    let wallet = await Wallet.findOne({ user: proposal.freelancer });
    if (!wallet) {
      wallet = await Wallet.create({ user: proposal.freelancer });
    }
    wallet.pendingBalance += proposal.bidAmount;
    await wallet.save();

    // Notify Freelancer
    await Notification.create({
      user: proposal.freelancer,
      title: 'Proposal Accepted! You are Hired!',
      message: `Great news! Your proposal for "${project.title}" has been accepted. Funds are placed in escrow. You can now start working in the Project Workspace.`,
      type: 'proposal',
      link: `/workspace/${project._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Proposal accepted and freelancer hired successfully.',
      project,
      proposal
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject proposal
// @route   POST /api/proposals/:id/reject
// @access  Private (Client)
exports.rejectProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    const project = await Project.findById(proposal.project);
    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    proposal.status = 'rejected';
    await proposal.save();

    await Notification.create({
      user: proposal.freelancer,
      title: 'Proposal Status Update',
      message: `Your proposal for "${project.title}" was not selected.`,
      type: 'proposal',
      link: `/projects/${project._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Proposal rejected'
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Withdraw proposal
// @route   DELETE /api/proposals/:id
// @access  Private (Freelancer)
exports.withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Proposal not found' });
    }

    if (proposal.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (proposal.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Cannot withdraw an accepted proposal' });
    }

    proposal.status = 'withdrawn';
    await proposal.save();

    res.status(200).json({
      success: true,
      message: 'Proposal withdrawn successfully'
    });
  } catch (err) {
    next(err);
  }
};
