const express = require('express');
const router = express.Router();
const Budget = require('C:/Users/Admin/celestiq-app/Server/Models/Budget');
const Transaction = require('C:/Users/Admin/celestiq-app/Server/Models/Transaction');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');
const { emitToUser } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers');

// @route   GET /api/budgets
// @desc    Get all budgets for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        // Get current month start and end dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Calculate total spent in this category for current month
        const spentResult = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              type: 'expense',
              category: budget.category,
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spent = spentResult[0]?.total || 0;
        const percentage = (spent / budget.limit) * 100;
        const remaining = budget.limit - spent;

        return {
          ...budget.toObject(),
          spent,
          percentage: percentage.toFixed(2),
          remaining,
          isOverBudget: spent > budget.limit
        };
      })
    );

    res.status(200).json({
      success: true,
      count: budgetsWithSpending.length,
      data: { budgets: budgetsWithSpending }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/budgets/:id
// @desc    Get single budget
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    // Calculate spending for this budget
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const spentResult = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          category: budget.category,
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spent = spentResult[0]?.total || 0;
    const percentage = (spent / budget.limit) * 100;
    const remaining = budget.limit - spent;

    // Get transaction history for this category
    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      category: budget.category,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: -1 }).limit(20);

    res.status(200).json({
      success: true,
      data: {
        budget: {
          ...budget.toObject(),
          spent,
          percentage: percentage.toFixed(2),
          remaining,
          isOverBudget: spent > budget.limit
        },
        transactions
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { category, limit, period } = req.body;

    // Validation
    if (!category || !limit) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category and limit'
      });
    }

    if (limit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be greater than 0'
      });
    }

    // Check if budget already exists for this category
    const existingBudget = await Budget.findOne({
      user: req.user._id,
      category
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: 'Budget already exists for this category'
      });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category,
      limit,
      period: period || 'monthly'
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'budget-added', { budget });

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: { budget }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    const { category, limit, period } = req.body;

    // Update fields
    if (category) {
      // Check if another budget exists with this category
      const existingBudget = await Budget.findOne({
        user: req.user._id,
        category,
        _id: { $ne: req.params.id }
      });

      if (existingBudget) {
        return res.status(400).json({
          success: false,
          message: 'Budget already exists for this category'
        });
      }

      budget.category = category;
    }

    if (limit) {
      if (limit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Limit must be greater than 0'
        });
      }
      budget.limit = limit;
    }

    if (period) budget.period = period;

    budget.updatedAt = Date.now();
    await budget.save();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'budget-updated', { budget });

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully',
      data: { budget }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }

    await budget.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'budget-deleted', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/budgets/stats/overview
// @desc    Get budget overview and alerts
// @access  Private
router.get('/stats/overview', protect, async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Calculate spending for all budgets
    const budgetsWithStatus = await Promise.all(
      budgets.map(async (budget) => {
        const spentResult = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              type: 'expense',
              category: budget.category,
              date: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const spent = spentResult[0]?.total || 0;
        const percentage = (spent / budget.limit) * 100;
        const remaining = budget.limit - spent;

        let status = 'safe';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 80) status = 'warning';
        else if (percentage >= 60) status = 'moderate';

        return {
          ...budget.toObject(),
          spent,
          percentage: percentage.toFixed(2),
          remaining,
          status
        };
      })
    );

    // Categorize budgets
    const exceeded = budgetsWithStatus.filter(b => b.status === 'exceeded');
    const warning = budgetsWithStatus.filter(b => b.status === 'warning');
    const safe = budgetsWithStatus.filter(b => b.status === 'safe' || b.status === 'moderate');

    // Calculate total budget vs spent
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgetsWithStatus.reduce((sum, b) => sum + b.spent, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalBudget,
          totalSpent,
          totalRemaining: totalBudget - totalSpent,
          overallPercentage: totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0
        },
        budgets: budgetsWithStatus,
        alerts: {
          exceeded,
          warning,
          safe
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;