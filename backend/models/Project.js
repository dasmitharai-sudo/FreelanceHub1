const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Pending', 'Funded', 'Completed', 'Released'],
      default: 'Pending'
    }
  },
  { timestamps: true }
);

const ProjectSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide project details']
    },
    category: {
      type: String,
      required: [true, 'Please specify category']
    },
    skills: {
      type: [String],
      default: []
    },
    budget: {
      type: Number,
      required: [true, 'Please specify project budget']
    },
    deadline: {
      type: Date,
      required: [true, 'Please specify deadline']
    },
    paymentType: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed'
    },
    status: {
      type: String,
      enum: [
        'Pending',
        'Accepted',
        'In Progress',
        'Submitted',
        'Revision Requested',
        'Completed',
        'Cancelled'
      ],
      default: 'Pending'
    },
    hiredFreelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    acceptedProposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proposal'
    },
    attachments: {
      type: [String],
      default: []
    },
    milestones: [MilestoneSchema],
    submission: {
      workDescription: String,
      attachmentUrl: String,
      attachmentName: String,
      submittedAt: Date
    },
    revisionNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

ProjectSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Project', ProjectSchema);
