const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet'
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['escrow_hold', 'escrow_release', 'withdrawal', 'refund', 'commission', 'payment'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    referenceId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['success', 'pending', 'failed'],
      default: 'success'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Transaction', TransactionSchema);
