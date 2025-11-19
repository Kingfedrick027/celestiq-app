const express = require('express');
const router = express.Router();
const Goal = require('C:/Users/Admin/celestiq-app/Server/Models/Goal');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');
const { emitToUser } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers');

// @route   GET /api/goals
// @desc    Get all goals for user
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { user: req.user._id };

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    // Filter by status if provided
    let filteredGoals = goals;
    if (status === 'completed') {
      filteredGoals = goals.filter(goal => goal.progress >= goal.target);
    } else if (status === 'active') {
      filteredGoals = goals.filter(goal => goal.progress < goal.target);
    }

    res.status(200).json({
      success: true,
      count: filteredGoals.length,
      data: { goals: filteredGoals }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/goals/:id
// @desc    Get single goal
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { goal }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, description, target, progress, deadline } = req.body;

    // Validation
    if (!name || !target) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and target'
      });
    }

    if (target <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Target must be greater than 0'
      });
    }

    if (progress && progress < 0) {
      return res.status(400).json({
        success: false,
        message: 'Progress cannot be negative'
      });
    }

    const goal = await Goal.create({
      user: req.user._id,
      name,
      description: description || '',
      target,
      progress: progress || 0,
      deadline: deadline || null
    });

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'goal-added', { goal });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: { goal }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const { name, description, target, progress, deadline } = req.body;

    // Update fields
    if (name) goal.name = name;
    if (description !== undefined) goal.description = description;
    if (target) {
      if (target <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Target must be greater than 0'
        });
      }
      goal.target = target;
    }
    if (progress !== undefined) {
      if (progress < 0) {
        return res.status(400).json({
          success: false,
          message: 'Progress cannot be negative'
        });
      }
      goal.progress = progress;
    }
    if (deadline !== undefined) goal.deadline = deadline;

    goal.updatedAt = Date.now();
    await goal.save();

    // Check if goal is completed
    const isCompleted = goal.progress >= goal.target;

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'goal-updated', { 
      goal,
      isCompleted 
    });

    res.status(200).json({
      success: true,
      message: isCompleted ? 'Congratulations! Goal completed!' : 'Goal updated successfully',
      data: { goal }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/goals/:id/progress
// @desc    Update goal progress
// @access  Private
router.patch('/:id/progress', protect, async (req, res, next) => {
  try {
    const { amount, operation } = req.body; // operation: 'add' or 'set'

    if (!amount || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    let goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    const previousProgress = goal.progress;

    if (operation === 'add') {
      goal.progress += amount;
    } else {
      goal.progress = amount;
    }

    // Ensure progress doesn't go negative
    if (goal.progress < 0) goal.progress = 0;

    goal.updatedAt = Date.now();
    await goal.save();

    const isCompleted = goal.progress >= goal.target && previousProgress < goal.target;

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'goal-progress-updated', { 
      goal,
      isCompleted 
    });

    res.status(200).json({
      success: true,
      message: isCompleted ? 'Congratulations! Goal completed! 🎉' : 'Progress updated successfully',
      data: { goal }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    await goal.deleteOne();

    // Emit real-time update
    const io = req.app.get('io');
    emitToUser(io, req.user._id, 'goal-deleted', { id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/goals/stats/overview
// @desc    Get goals overview
// @access  Private
router.get('/stats/overview', protect, async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id });

    // Categorize goals
    const completed = goals.filter(goal => goal.progress >= goal.target);
    const active = goals.filter(goal => goal.progress < goal.target);
    const nearCompletion = active.filter(goal => {
      const percentage = (goal.progress / goal.target) * 100;
      return percentage >= 75;
    });

    // Calculate totals
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    const totalRemaining = totalTarget - totalProgress;
    const overallPercentage = totalTarget > 0 ? (totalProgress / totalTarget) * 100 : 0;

    // Check for overdue goals
    const now = new Date();
    const overdue = active.filter(goal => goal.deadline && new Date(goal.deadline) < now);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalGoals: goals.length,
          completed: completed.length,
          active: active.length,
          nearCompletion: nearCompletion.length,
          overdue: overdue.length,
          totalTarget,
          totalProgress,
          totalRemaining,
          overallPercentage: overallPercentage.toFixed(2)
        },
        goals: {
          all: goals,
          completed,
          active,
          nearCompletion,
          overdue
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;