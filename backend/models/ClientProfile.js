const mongoose = require('mongoose');

const ClientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    companyName: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    savedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ClientProfile', ClientProfileSchema);
