const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 100
    },
    deliveryDays: {
      type: Number,
      required: true,
      default: 3
    },
    revisions: {
      type: Number,
      default: 1
    },
    features: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const ServiceSchema = new mongoose.Schema(
  {
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a service title'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Please select a category']
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed service description']
    },
    images: {
      type: [String],
      default: ['/assets/images/service-default.jpg']
    },
    deliveryDays: {
      type: Number,
      default: 3
    },
    requiredInfo: {
      type: String,
      default: 'Please share your project specifications, assets, and target delivery requirements.'
    },
    packages: {
      basic: {
        type: PackageSchema,
        required: true
      },
      standard: {
        type: PackageSchema,
        required: true
      },
      premium: {
        type: PackageSchema,
        required: true
      }
    },
    rating: {
      type: Number,
      default: 5.0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

ServiceSchema.index({ title: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);
