const mongoose = require('mongoose');

const FreelancerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    title: {
      type: String,
      default: 'Professional Freelancer'
    },
    categories: {
      type: [String],
      default: []
    },
    skills: {
      type: [String],
      default: []
    },
    experience: {
      type: Number,
      default: 1
    },
    education: [
      {
        degree: String,
        institution: String,
        year: String
      }
    ],
    languages: {
      type: [String],
      default: ['English']
    },
    hourlyRate: {
      type: Number,
      default: 500
    },
    availability: {
      type: String,
      enum: ['Available', 'Busy', 'Unavailable'],
      default: 'Available'
    },
    bio: {
      type: String,
      default: ''
    },
    portfolio: [
      {
        title: String,
        description: String,
        image: String,
        link: String
      }
    ],
    rating: {
      type: Number,
      default: 5.0
    },
    numReviews: {
      type: Number,
      default: 0
    },
    profileCompletion: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

// Method to calculate profile completion percentage
FreelancerProfileSchema.methods.calculateCompletion = function () {
  let score = 0;
  if (this.title && this.title.trim().length > 3) score += 15;
  if (this.bio && this.bio.trim().length > 20) score += 15;
  if (this.categories && this.categories.length > 0) score += 15;
  if (this.skills && this.skills.length > 0) score += 15;
  if (this.hourlyRate && this.hourlyRate > 0) score += 10;
  if (this.experience && this.experience > 0) score += 10;
  if (this.education && this.education.length > 0) score += 10;
  if (this.portfolio && this.portfolio.length > 0) score += 15;
  
  this.profileCompletion = Math.min(score, 100);
  return this.profileCompletion;
};

FreelancerProfileSchema.pre('save', function () {
  this.calculateCompletion();
});

module.exports = mongoose.model('FreelancerProfile', FreelancerProfileSchema);
