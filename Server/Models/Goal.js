const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a goal name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  target: {
    type: Number,
    required: [true, 'Please provide a target amount'],
    min: 0
  },
  progress: {
    type: Number,
    default: 0,
    min: 0
  },
  deadline: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field on save
goalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate completion percentage virtual field
goalSchema.virtual('completionPercent').get(function() {
  return (this.progress / this.target) * 100;
});

// Enable virtuals in JSON
goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

// Index for faster queries
goalSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Goal', goalSchema);