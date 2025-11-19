const express = require('express');
const router = express.Router();
const User = require('C:/Users/Admin/celestiq-app/Server/Models/User');
const { generateToken } = require('C:/Users/Admin/celestiq-app/Server/Utils/helpers');
const { sendOTPEmail, sendWelcomeEmail } = require('C:/Users/Admin/celestiq-app/Server/Services/emailService');
const { protect } = require('C:/Users/Admin/celestiq-app/Server/Middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user and send OTP
// @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      isVerified: false
    });

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);

    if (!emailResult.success) {
      console.error('Failed to send OTP email:', emailResult.error);
      // Continue anyway - user can request new OTP
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for OTP.',
      data: {
        userId: user._id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and OTP'
      });
    }

    // Find user
    const user = await User.findOne({ 
      email: email.toLowerCase() 
    }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please login.'
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check OTP expiry
    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Verify user
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.lastLogin = Date.now();
    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          darkMode: user.darkMode,
          categories: user.categories
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. Please login.'
      });
    }

    // Generate new OTP
    const otp = user.generateOTP();
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp, user.name);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email first'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          darkMode: user.darkMode,
          categories: user.categories
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          darkMode: user.darkMode,
          categories: user.categories,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put('/update-profile', protect, async (req, res, next) => {
  try {
    const { name, currency, darkMode } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (darkMode !== undefined) user.darkMode = darkMode;

    await user.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user_${user._id}`).emit('profile-updated', {
      user: {
        id: user._id,
        name: user.name,
        currency: user.currency,
        darkMode: user.darkMode
      }
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          darkMode: user.darkMode,
          categories: user.categories
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   POST /api/auth/add-category
// @desc    Add custom category
// @access  Private
router.post('/add-category', protect, async (req, res, next) => {
  try {
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category type and name'
      });
    }

    if (!['expense', 'income'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category type'
      });
    }

    const user = await User.findById(req.user._id);

    // Check if category already exists
    if (user.categories[type].includes(name.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    user.categories[type].push(name.trim());
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Category added successfully',
      data: {
        categories: user.categories
      }
    });

  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/auth/delete-category
// @desc    Delete custom category
// @access  Private
router.delete('/delete-category', protect, async (req, res, next) => {
  try {
    const { type, name } = req.body;

    if (!type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide category type and name'
      });
    }

    const user = await User.findById(req.user._id);

    if (user.categories[type].length <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last category'
      });
    }

    user.categories[type] = user.categories[type].filter(cat => cat !== name);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: {
        categories: user.categories
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;