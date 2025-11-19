const express = require('express');
const router = express.Router();
const Investment = require('C:/Users/Admin/celestiq-app/Server/Models/Investment');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');
const { getCurrentDateTime, emitToUser } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers');

// @route   GET /api/investments
// @desc    Get all investments for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { type, broker, synced, startDate, endDate } = req.query;

    // Build query
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (broker) {
      query.broker = broker;
    }

    if (synced !== undefined) {
      query.synced = synced === 'true';
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const investments = await Investment.find(query)
      .populate('broker', 'name platform')
      .populate('brokerConnection', 'name platform')
      .sort({ date: -1, createdAt: -1 });

    // Calculate totals
    const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

    const investmentsWithGains = investments.filter(
      inv => inv.purchasePrice && inv.currentPrice && inv.quantity
    );

    let totalGainLoss = 0;
    let totalInvested = 0;

    investmentsWithGains.forEach(inv => {
      const invested = inv.purchasePrice * inv.quantity;
      const current = inv.currentPrice * inv.quantity;
      totalInvested += invested;
      totalGainLoss += (current - invested);
    });

    const totalGainLossPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    res.status(200).json({
      success: true,
      count: investments.length,
      data: {
        investments,
        summary: {
          totalValue,
          totalGainLoss,
          totalGainLossPercent,
          totalInvested
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/investments/:id
// @desc    Get single investment
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('broker', 'name platform')
      .populate('brokerConnection', 'name platform');

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { investment }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/investments
// @desc    Create new investment
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const {
      name,
      type,
      amount,
      quantity,
      purchasePrice,
      currentPrice,
      broker,
      brokerConnection,
      date,
      time
    } = req.body;

    // Validation
    if (!name || !type || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const validTypes = ['Stocks', 'Mutual Funds', 'Bonds', 'Gold', 'Real Estate', 'Crypto', 'Other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investment type'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Get current date/time if not provided
    const currentDateTime = getCurrentDateTime();

    const investment = await Investment.create({
      user: req.user._id,
      name,
      type,
      amount,
      quantity: quantity || null,
      purchasePrice: purchasePrice || null,
      currentPrice: currentPrice || null,
      broker: broker || null,
      brokerConnection: brokerConnection || null,
      synced: false,
      date: date || currentDateTime.date,
      time: time || currentDateTime.time
    });

    // Populate references
    await investment.populate('broker', 'name platform');
    await investment.populate('brokerConnection', 'name platform');

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'investment-added', { investment });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      data: { investment }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/investments/:id
// @desc    Update investment
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    const {
      name,
      type,
      amount,
      quantity,
      purchasePrice,
      currentPrice,
      broker,
      date,
      time
    } = req.body;

    // Update fields
    if (name) investment.name = name;
    if (type) investment.type = type;
    if (amount) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }
      investment.amount = amount;
    }
    if (quantity !== undefined) investment.quantity = quantity;
    if (purchasePrice !== undefined) investment.purchasePrice = purchasePrice;
    if (currentPrice !== undefined) investment.currentPrice = currentPrice;
    if (broker !== undefined) investment.broker = broker;
    if (date) investment.date = date;
    if (time) investment.time = time;

    investment.updatedAt = Date.now();
    await investment.save();

    // Populate references
    await investment.populate('broker', 'name platform');
    await investment.populate('brokerConnection', 'name platform');

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'investment-updated', { investment });

    res.status(200).json({
      success: true,
      message: 'Investment updated successfully',
      data: { investment }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/investments/:id
// @desc    Delete investment
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    await investment.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'investment-deleted', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Investment deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/investments/stats/portfolio
// @desc    Get portfolio statistics
// @access  Private
router.get('/stats/portfolio', protect, async (req, res, next) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .populate('broker', 'name platform');

    // Group by type
    const byType = {};
    investments.forEach(inv => {
      if (!byType[inv.type]) {
        byType[inv.type] = { total: 0, count: 0, investments: [] };
      }
      byType[inv.type].total += inv.amount;
      byType[inv.type].count += 1;
      byType[inv.type].investments.push(inv);
    });

    // Group by broker
    const byBroker = {};
    investments.forEach(inv => {
      const brokerName = inv.broker?.name || 'Unlinked';
      if (!byBroker[brokerName]) {
        byBroker[brokerName] = { total: 0, count: 0, investments: [] };
      }
      byBroker[brokerName].total += inv.amount;
      byBroker[brokerName].count += 1;
      byBroker[brokerName].investments.push(inv);
    });

    // Calculate performance
    const investmentsWithPrices = investments.filter(
      inv => inv.purchasePrice && inv.currentPrice && inv.quantity
    );

    const performance = investmentsWithPrices.map(inv => {
      const invested = inv.purchasePrice * inv.quantity;
      const current = inv.currentPrice * inv.quantity;
      const gainLoss = current - invested;
      const gainLossPercent = (gainLoss / invested) * 100;

      return {
        id: inv._id,
        name: inv.name,
        type: inv.type,
        invested,
        current,
        gainLoss,
        gainLossPercent
      };
    }).sort((a, b) => b.gainLossPercent - a.gainLossPercent);

    const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalGainLoss = performance.reduce((sum, p) => sum + p.gainLoss, 0);
    const totalInvested = performance.reduce((sum, p) => sum + p.invested, 0);

    res.status(200).json({
      success: true,
      data: {
        totalValue,
        totalGainLoss,
        totalGainLossPercent: totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0,
        totalInvested,
        byType,
        byBroker,
        performance: {
          best: performance[0] || null,
          worst: performance[performance.length - 1] || null,
          all: performance
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;