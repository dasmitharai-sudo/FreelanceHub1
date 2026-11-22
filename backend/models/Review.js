const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments']
    },
    role: {
      type: String,
      enum: ['client_to_freelancer', 'freelancer_to_client'],
      default: 'client_to_freelancer'
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate review for the same order by the same reviewer
ReviewSchema.index({ order: 1, reviewer: 1 }, { unique: true, sparse: true });
ReviewSchema.index({ project: 1, reviewer: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', ReviewSchema);
