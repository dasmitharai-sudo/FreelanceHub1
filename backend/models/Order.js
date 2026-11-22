const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    packageType: {
      type: String,
      enum: ['basic', 'standard', 'premium'],
      default: 'basic'
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    platformCommission: {
      type: Number,
      default: 0
    },
    freelancerEarnings: {
      type: Number,
      default: 0
    },
    requirements: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'In Progress',
        'Submitted',
        'Revision Requested',
        'Completed',
        'Cancelled'
      ],
      default: 'In Progress'
    },
    deliveryWork: {
      message: String,
      fileUrl: String,
      fileName: String,
      submittedAt: Date
    },
    revisionNotes: {
      type: String,
      default: ''
    },
    paymentStatus: {
      type: String,
      enum: ['escrow_held', 'released', 'refunded'],
      default: 'escrow_held'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', OrderSchema);
