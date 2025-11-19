const mongoose = require('mongoose');

const brokerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a broker name'],
    trim: true
  },
  platform: {
    type: String,
    required: [true, 'Please provide a platform name'],
    enum: [
      'Robinhood', 'Alpaca', 'TD Ameritrade', 'Interactive Brokers',
      'E*TRADE', 'Webull', 'Coinbase', 'Binance', 'Zerodha (Kite)',
      'Upstox', 'Manual Entry'
    ]
  },
  accountNumber: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true
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
brokerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
brokerSchema.index({ user: 1, createdAt: -1 });

const brokerConnectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  broker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    default: null
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  platform: {
    type: String,
    required: true
  },
  apiKey: {
    type: String,
    required: true,
    select: false
  },
  apiSecret: {
    type: String,
    select: false
  },
  accessToken: {
    type: String,
    select: false
  },
  connected: {
    type: Boolean,
    default: true
  },
  lastSync: {
    type: Date,
    default: null
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
brokerConnectionSchema.index({ user: 1, platform: 1 });

const Broker = mongoose.model('Broker', brokerSchema);
const BrokerConnection = mongoose.model('BrokerConnection', brokerConnectionSchema);

module.exports = { Broker, BrokerConnection };