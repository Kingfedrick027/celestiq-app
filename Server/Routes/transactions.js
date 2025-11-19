const express = require('express');
const router = express.Router();
const Transaction = require('C:/Users/Admin/celestiq-app/Server/Models/Transaction.js');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');
const { getCurrentDateTime, emitToUser } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers');

// @route   GET /api/transactions
// @desc    Get all transactions for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, limit } = req.query;

    // Build query
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query
    let transactionsQuery = Transaction.find(query).sort({ date: -1, createdAt: -1 });

    if (limit) {
      transactionsQuery = transactionsQuery.limit(parseInt(limit));
    }

    const transactions = await transactionsQuery;

    // Calculate totals
    const totalIncome = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpenses = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: {
        transactions,
        summary: {
          totalIncome: totalIncome[0]?.total || 0,
          totalExpenses: totalExpenses[0]?.total || 0,
          balance: (totalIncome[0]?.total || 0) - (totalExpenses[0]?.total || 0)
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { transaction }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { type, description, amount, category, date, time } = req.body;

    // Validation
    if (!type || !description || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction type'
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

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      description,
      amount,
      category,
      date: date || currentDateTime.date,
      time: time || currentDateTime.time
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'transaction-added', { transaction });

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const { description, amount, category, date, time } = req.body;

    // Update fields
    if (description) transaction.description = description;
    if (amount) {
      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Amount must be greater than 0'
        });
      }
      transaction.amount = amount;
    }
    if (category) transaction.category = category;
    if (date) transaction.date = date;
    if (time) transaction.time = time;

    transaction.updatedAt = Date.now();
    await transaction.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'transaction-updated', { transaction });

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'transaction-deleted', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/transactions/stats/summary
// @desc    Get transaction statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res, next) => {
  try {
    const { period } = req.query; // week, month, year

    let startDate = new Date(0); // Beginning of time
    const endDate = new Date();

    if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Get income and expenses by category
    const expensesByCategory = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const incomeByCategory = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'income',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get monthly trends
    const monthlyTrends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get recent transactions
    const recentTransactions = await Transaction.find({
      user: req.user._id
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(10);

    // Calculate totals
    const totalIncome = incomeByCategory.reduce((sum, cat) => sum + cat.total, 0);
    const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.total, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          period
        },
        expensesByCategory,
        incomeByCategory,
        monthlyTrends,
        recentTransactions
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/transactions
// @desc    Delete all transactions (for testing)
// @access  Private
router.delete('/', protect, async (req, res, next) => {
  try {
    await Transaction.deleteMany({ user: req.user._id });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'transactions-cleared', {});

    res.status(200).json({
      success: true,
      message: 'All transactions deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;