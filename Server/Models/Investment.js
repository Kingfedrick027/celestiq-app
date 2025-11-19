const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide an investment name'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Stocks', 'Mutual Funds', 'Bonds', 'Gold', 'Real Estate', 'Crypto', 'Other']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: 0
  },
  quantity: {
    type: Number,
    default: null
  },
  purchasePrice: {
    type: Number,
    default: null
  },
  currentPrice: {
    type: Number,
    default: null
  },
  broker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    default: null
  },
  brokerConnection: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BrokerConnection',
    default: null
  },
  synced: {
    type: Boolean,
    default: false
  },
  lastSync: {
    type: Date,
    default: null
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
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
investmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate gain/loss virtual field
investmentSchema.virtual('gainLoss').get(function() {
  if (this.purchasePrice && this.currentPrice && this.quantity) {
    const invested = this.purchasePrice * this.quantity;
    const current = this.currentPrice * this.quantity;
    return current - invested;
  }
  return null;
});

// Calculate gain/loss percentage virtual field
investmentSchema.virtual('gainLossPercent').get(function() {
  if (this.purchasePrice && this.currentPrice && this.quantity) {
    const invested = this.purchasePrice * this.quantity;
    const current = this.currentPrice * this.quantity;
    return ((current - invested) / invested) * 100;
  }
  return null;
});

// Enable virtuals in JSON
investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

// Index for faster queries
investmentSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Investment', investmentSchema);