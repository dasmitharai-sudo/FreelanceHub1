const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const Payment = require('../models/Payment');

// @desc    Get all projects with filters & search
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minBudget,
      maxBudget,
      paymentType,
      status
    } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    } else {
      // By default show open/pending projects for browsing
      query.status = { $in: ['Pending', 'In Progress'] };
    }

    if (category && category !== 'All') {
      query.category = new RegExp(`^${category}$`, 'i');
    }

    if (paymentType && paymentType !== 'All') {
      query.paymentType = paymentType;
    }

    if (minBudget || maxBudget) {
      query.budget = {};
      if (minBudget) query.budget.$gte = Number(minBudget);
      if (maxBudget) query.budget.$lte = Number(maxBudget);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const projects = await Project.find(query)
      .populate('client', 'name avatar location isVerified')
      .populate('hiredFreelancer', 'name avatar isVerified')
      .sort({ createdAt: -1 });

    // Attach proposal count for each project
    const projectsWithCount = await Promise.all(
      projects.map(async p => {
        const proposalCount = await Proposal.countDocuments({ project: p._id });
        return {
          ...p.toObject(),
          proposalCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: projectsWithCount.length,
      data: projectsWithCount
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email avatar phone location isVerified')
      .populate('hiredFreelancer', 'name email avatar phone location isVerified')
      .populate('acceptedProposal');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const proposalCount = await Proposal.countDocuments({ project: project._id });

    let myProposal = null;
    let allProposals = [];

    if (req.user) {
      if (req.user.role === 'freelancer') {
        myProposal = await Proposal.findOne({
          project: project._id,
          freelancer: req.user.id
        });
      } else if (
        req.user.id === project.client._id.toString() ||
        req.user.role === 'admin'
      ) {
        allProposals = await Proposal.find({ project: project._id })
          .populate('freelancer', 'name avatar location isVerified')
          .sort({ createdAt: -1 });
      }
    }

    res.status(200).json({
      success: true,
      data: project,
      proposalCount,
      myProposal,
      allProposals
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Client)
exports.createProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      skills,
      budget,
      deadline,
      paymentType,
      milestones
    } = req.body;

    const parsedSkills = Array.isArray(skills)
      ? skills
      : (skills ? skills.split(',').map(s => s.trim()) : []);

    let parsedMilestones = [];
    if (milestones) {
      parsedMilestones = typeof milestones === 'string' ? JSON.parse(milestones) : milestones;
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(f => `/uploads/${f.filename}`);
    } else if (req.file) {
      attachments = [`/uploads/${req.file.filename}`];
    }

    const project = await Project.create({
      client: req.user.id,
      title,
      description,
      category,
      skills: parsedSkills,
      budget: Number(budget),
      deadline: new Date(deadline),
      paymentType: paymentType || 'fixed',
      milestones: parsedMilestones,
      attachments
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Client)
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this project' });
    }

    if (project.status !== 'Pending' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit project after work has started or freelancer has been hired.'
      });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit completed work for project (Freelancer)
// @route   POST /api/projects/:id/submit-work
// @access  Private (Freelancer)
exports.submitWork = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.hiredFreelancer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the assigned freelancer can submit work.' });
    }

    const { workDescription } = req.body;
    let fileUrl = '';
    let fileName = '';

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
    }

    project.submission = {
      workDescription,
      fileUrl,
      fileName,
      submittedAt: new Date()
    };
    project.status = 'Submitted';
    await project.save();

    // Notify client
    await Notification.create({
      user: project.client,
      title: 'Work Submitted for Review',
      message: `${req.user.name} submitted completed work for "${project.title}". Please review and approve or request revisions.`,
      type: 'order',
      link: `/workspace/${project._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Work submitted successfully for client review.',
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Review submission (Approve or Request Revision)
// @route   POST /api/projects/:id/review-submission
// @access  Private (Client)
exports.reviewSubmission = async (req, res, next) => {
  try {
    const { action, revisionNotes } = req.body; // action: 'approve' | 'revision'
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only the client can review submitted work.' });
    }

    if (action === 'revision') {
      project.status = 'Revision Requested';
      project.revisionNotes = revisionNotes || 'Please make the suggested revisions.';
      await project.save();

      // Notify freelancer
      await Notification.create({
        user: project.hiredFreelancer,
        title: 'Revision Requested',
        message: `The client requested changes on project "${project.title}": ${project.revisionNotes}`,
        type: 'order',
        link: `/workspace/${project._id}`
      });

      return res.status(200).json({
        success: true,
        message: 'Revision request sent to freelancer.',
        data: project
      });
    }

    if (action === 'approve') {
      project.status = 'Completed';
      await project.save();

      // Get platform commission rate
      const commSetting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
      const commPercent = commSetting ? Number(commSetting.value) : 10;

      const totalAmount = project.budget;
      const commission = (totalAmount * commPercent) / 100;
      const freelancerEarnings = totalAmount - commission;

      // Update Freelancer Wallet
      let wallet = await Wallet.findOne({ user: project.hiredFreelancer });
      if (!wallet) {
        wallet = await Wallet.create({ user: project.hiredFreelancer });
      }

      // Deduct from pending (if was held) and credit available
      wallet.pendingBalance = Math.max(0, wallet.pendingBalance - totalAmount);
      wallet.availableBalance += freelancerEarnings;
      wallet.totalEarnings += freelancerEarnings;
      await wallet.save();

      // Update payment record if exists
      await Payment.findOneAndUpdate(
        { project: project._id, status: 'held_in_escrow' },
        { status: 'released', platformFee: commission }
      );

      // Record transaction
      await Transaction.create({
        wallet: wallet._id,
        user: project.hiredFreelancer,
        type: 'escrow_release',
        amount: freelancerEarnings,
        description: `Payment released for completed project: ${project.title} (Fee: ₹${commission})`,
        referenceId: project._id.toString(),
        status: 'success'
      });

      // Notify freelancer
      await Notification.create({
        user: project.hiredFreelancer,
        title: 'Project Approved & Payment Released!',
        message: `Congratulations! Your work for "${project.title}" has been approved. ₹${freelancerEarnings} credited to your wallet.`,
        type: 'payment',
        link: '/freelancer-dashboard'
      });

      return res.status(200).json({
        success: true,
        message: 'Project approved! Payment released to freelancer.',
        data: project
      });
    }

    res.status(400).json({ success: false, message: 'Invalid action specified' });
  } catch (err) {
    next(err);
  }
};

// @desc    Add milestone to project
// @route   POST /api/projects/:id/milestones
// @access  Private (Client)
exports.addMilestone = async (req, res, next) => {
  try {
    const { title, amount, dueDate } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only project owner can add milestones' });
    }

    project.milestones.push({
      title,
      amount: Number(amount),
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'Pending'
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: project.milestones
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Release Milestone Payment
// @route   PUT /api/projects/:id/milestones/:milestoneId/release
// @access  Private (Client)
exports.releaseMilestone = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    if (project.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    milestone.status = 'Released';
    await project.save();

    // Release funds to freelancer wallet
    const commSetting = await SystemSetting.findOne({ key: 'platform_commission_percent' });
    const commPercent = commSetting ? Number(commSetting.value) : 10;
    const comm = (milestone.amount * commPercent) / 100;
    const net = milestone.amount - comm;

    const wallet = await Wallet.findOne({ user: project.hiredFreelancer });
    if (wallet) {
      wallet.availableBalance += net;
      wallet.totalEarnings += net;
      await wallet.save();

      await Transaction.create({
        wallet: wallet._id,
        user: project.hiredFreelancer,
        type: 'escrow_release',
        amount: net,
        description: `Milestone "${milestone.title}" released for project "${project.title}"`,
        referenceId: milestone._id.toString(),
        status: 'success'
      });
    }

    await Notification.create({
      user: project.hiredFreelancer,
      title: 'Milestone Payment Released',
      message: `Milestone "${milestone.title}" (₹${net}) has been approved and released to your wallet.`,
      type: 'payment',
      link: `/workspace/${project._id}`
    });

    res.status(200).json({
      success: true,
      message: 'Milestone payment released successfully',
      milestone
    });
  } catch (err) {
    next(err);
  }
};
