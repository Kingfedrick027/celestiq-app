const express = require('express');
const router = express.Router();
const { Broker, BrokerConnection } = require('C:/Users/Admin/celestiq-app/Server/Models/Broker');
const Investment = require('C:/Users/Admin/celestiq-app/Server/Models/Investment');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');
const { syncBrokerInvestments } = require('C:/Users/Admin/celestiq-app/Server/Services/brokerService');
const { getCurrentDateTime, emitToUser } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers.js');

// ==================== MANUAL BROKER ACCOUNTS ====================

// @route   GET /api/brokers
// @desc    Get all manual broker accounts for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const brokers = await Broker.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Calculate value for each broker
    const brokersWithValue = await Promise.all(
      brokers.map(async (broker) => {
        const investments = await Investment.find({
          user: req.user._id,
          broker: broker._id,
          synced: false // Only manual investments
        });

        const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

        return {
          ...broker.toObject(),
          totalValue,
          investmentCount: investments.length
        };
      })
    );

    res.status(200).json({
      success: true,
      count: brokersWithValue.length,
      data: { brokers: brokersWithValue }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/brokers/:id
// @desc    Get single broker account
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const broker = await Broker.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    // Get investments for this broker
    const investments = await Investment.find({
      user: req.user._id,
      broker: broker._id
    }).sort({ date: -1 });

    const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        broker: {
          ...broker.toObject(),
          totalValue,
          investmentCount: investments.length
        },
        investments
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/brokers
// @desc    Create new manual broker account
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, platform, accountNumber, notes } = req.body;

    // Validation
    if (!name || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and platform'
      });
    }

    const validPlatforms = [
      'Robinhood', 'Alpaca', 'TD Ameritrade', 'Interactive Brokers',
      'E*TRADE', 'Webull', 'Coinbase', 'Binance', 'Zerodha (Kite)',
      'Upstox', 'Manual Entry'
    ];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid platform'
      });
    }

    const broker = await Broker.create({
      user: req.user._id,
      name,
      platform,
      accountNumber: accountNumber || null,
      notes: notes || ''
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'broker-added', { broker });

    res.status(201).json({
      success: true,
      message: 'Broker account created successfully',
      data: { broker }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/brokers/:id
// @desc    Update broker account
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let broker = await Broker.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    const { name, platform, accountNumber, notes } = req.body;

    // Update fields
    if (name) broker.name = name;
    if (platform) {
      const validPlatforms = [
        'Robinhood', 'Alpaca', 'TD Ameritrade', 'Interactive Brokers',
        'E*TRADE', 'Webull', 'Coinbase', 'Binance', 'Zerodha (Kite)',
        'Upstox', 'Manual Entry'
      ];

      if (!validPlatforms.includes(platform)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid platform'
        });
      }

      broker.platform = platform;
    }
    if (accountNumber !== undefined) broker.accountNumber = accountNumber;
    if (notes !== undefined) broker.notes = notes;

    broker.updatedAt = Date.now();
    await broker.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'broker-updated', { broker });

    res.status(200).json({
      success: true,
      message: 'Broker account updated successfully',
      data: { broker }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/brokers/:id
// @desc    Delete broker account
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const broker = await Broker.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!broker) {
      return res.status(404).json({
        success: false,
        message: 'Broker not found'
      });
    }

    // Check if there are investments linked to this broker
    const linkedInvestments = await Investment.countDocuments({
      user: req.user._id,
      broker: broker._id
    });

    if (linkedInvestments > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete broker with ${linkedInvestments} linked investment(s). Please remove or reassign investments first.`
      });
    }

    await broker.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'broker-deleted', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Broker account deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// ==================== API BROKER CONNECTIONS ====================

// @route   GET /api/brokers/connections/all
// @desc    Get all broker API connections
// @access  Private
router.get('/connections/all', protect, async (req, res, next) => {
  try {
    const connections = await BrokerConnection.find({ user: req.user._id })
      .populate('broker', 'name platform')
      .sort({ connectedAt: -1 });

    // Calculate value for each connection
    const connectionsWithValue = await Promise.all(
      connections.map(async (connection) => {
        const investments = await Investment.find({
          user: req.user._id,
          brokerConnection: connection._id,
          synced: true
        });

        const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

        return {
          ...connection.toObject(),
          totalValue,
          investmentCount: investments.length
        };
      })
    );

    res.status(200).json({
      success: true,
      count: connectionsWithValue.length,
      data: { connections: connectionsWithValue }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/brokers/connections/:id
// @desc    Get single broker connection
// @access  Private
router.get('/connections/:id', protect, async (req, res, next) => {
  try {
    const connection = await BrokerConnection.findOne({
      _id: req.params.id,
      user: req.user._id
    })
      .populate('broker', 'name platform')
      .select('+apiKey +apiSecret +accessToken');

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Broker connection not found'
      });
    }

    // Get synced investments
    const investments = await Investment.find({
      user: req.user._id,
      brokerConnection: connection._id,
      synced: true
    }).sort({ lastSync: -1 });

    const totalValue = investments.reduce((sum, inv) => sum + inv.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        connection: {
          ...connection.toObject(),
          totalValue,
          investmentCount: investments.length
        },
        investments
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/brokers/connections/connect
// @desc    Connect broker via API
// @access  Private
router.post('/connections/connect', protect, async (req, res, next) => {
  try {
    const { name, platform, apiKey, apiSecret, accessToken, brokerId } = req.body;

    // Validation
    if (!name || !platform || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, platform, and API credentials'
      });
    }

    const validPlatforms = ['Alpaca', 'Coinbase', 'Zerodha (Kite)'];

    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Platform not supported for API integration'
      });
    }

    // Test the connection
    const credentials = {
      apiKey,
      apiSecret: apiSecret || null,
      accessToken: accessToken || null
    };

    const testResult = await syncBrokerInvestments(platform, credentials);

    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to connect to broker: ' + testResult.error
      });
    }

    // Create connection
    const connection = await BrokerConnection.create({
      user: req.user._id,
      broker: brokerId || null,
      name,
      platform,
      apiKey,
      apiSecret: apiSecret || null,
      accessToken: accessToken || null,
      connected: true,
      lastSync: null
    });

    // Sync investments immediately
    await syncConnectionInvestments(connection, req.user._id, req.app.get('io'));

    // Get connection without sensitive data
    const safeConnection = await BrokerConnection.findById(connection._id)
      .populate('broker', 'name platform');

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'broker-connected', { connection: safeConnection });

    res.status(201).json({
      success: true,
      message: 'Broker connected successfully',
      data: { connection: safeConnection }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/brokers/connections/:id/sync
// @desc    Sync investments from broker
// @access  Private
router.post('/connections/:id/sync', protect, async (req, res, next) => {
  try {
    const connection = await BrokerConnection.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('+apiKey +apiSecret +accessToken');

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Broker connection not found'
      });
    }

    if (!connection.connected) {
      return res.status(400).json({
        success: false,
        message: 'Broker is not connected'
      });
    }

    // Perform sync
    const result = await syncConnectionInvestments(connection, req.user._id, req.app.get('io'));

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Sync failed: ' + result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sync completed successfully',
      data: {
        syncedCount: result.syncedCount,
        lastSync: connection.lastSync
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/brokers/connections/:id
// @desc    Disconnect broker API
// @access  Private
router.delete('/connections/:id', protect, async (req, res, next) => {
  try {
    const connection = await BrokerConnection.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Broker connection not found'
      });
    }

    // Delete all synced investments from this connection
    await Investment.deleteMany({
      user: req.user._id,
      brokerConnection: connection._id,
      synced: true
    });

    await connection.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'broker-disconnected', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Broker disconnected successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/brokers/connections/sync-all
// @desc    Sync all connected brokers
// @access  Private
router.post('/connections/sync-all', protect, async (req, res, next) => {
  try {
    const connections = await BrokerConnection.find({
      user: req.user._id,
      connected: true
    }).select('+apiKey +apiSecret +accessToken');

    if (connections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No connected brokers found'
      });
    }

    const results = [];
    const io = req.app.get('io');

    for (const connection of connections) {
      const result = await syncConnectionInvestments(connection, req.user._id, io);
      results.push({
        connectionId: connection._id,
        name: connection.name,
        success: result.success,
        syncedCount: result.syncedCount || 0,
        error: result.error || null
      });
    }

    const successCount = results.filter(r => r.success).length;

    res.status(200).json({
      success: true,
      message: `Synced ${successCount} of ${connections.length} broker(s)`,
      data: { results }
    });

  } catch (error) {
    next(error);
  }
});

// ==================== HELPER FUNCTION ====================

async function syncConnectionInvestments(connection, userId, io) {
  try {
    const credentials = {
      apiKey: connection.apiKey,
      apiSecret: connection.apiSecret,
      accessToken: connection.accessToken
    };

    const result = await syncBrokerInvestments(connection.platform, credentials);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Delete old synced investments from this connection
    await Investment.deleteMany({
      user: userId,
      brokerConnection: connection._id,
      synced: true
    });

    // Get current date/time
    const currentDateTime = getCurrentDateTime();

    // Create new synced investments
    const investments = await Investment.insertMany(
      result.data.map(inv => ({
        user: userId,
        name: inv.name,
        type: inv.type,
        amount: inv.amount,
        quantity: inv.quantity,
        purchasePrice: inv.purchasePrice,
        currentPrice: inv.currentPrice,
        broker: connection.broker,
        brokerConnection: connection._id,
        synced: true,
        lastSync: new Date(),
        date: currentDateTime.date,
        time: currentDateTime.time
      }))
    );

    // Update connection last sync time
    connection.lastSync = new Date();
    await connection.save();

    // Emit real-time update
    if (io) {
      emitToUser(io, userId, 'investments-synced', {
        connectionId: connection._id,
        connectionName: connection.name,
        investments
      });
    }

    return {
      success: true,
      syncedCount: investments.length
    };

  } catch (error) {
    console.error('Sync helper error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = router;