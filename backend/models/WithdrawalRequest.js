const mongoose = require('mongoose');

const WithdrawalRequestSchema = new mongoose.Schema(
  {
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 100
    },
    method: {
      type: String,
      enum: ['UPI', 'Bank Transfer', 'IMPS'],
      default: 'UPI'
    },
    accountDetails: {
      upiId: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    adminRemarks: {
      type: String,
      default: ''
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('WithdrawalRequest', WithdrawalRequestSchema);
