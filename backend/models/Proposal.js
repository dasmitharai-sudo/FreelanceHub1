const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    bidAmount: {
      type: Number,
      required: [true, 'Please provide bid amount']
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Please provide estimated delivery days']
    },
    coverLetter: {
      type: String,
      required: [true, 'Please write a proposal / cover letter']
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

ProposalSchema.index({ project: 1, freelancer: 1 });

module.exports = mongoose.model('Proposal', ProposalSchema);
