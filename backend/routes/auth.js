const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, generateToken, generateRefreshToken, verifyRefreshToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailScheduler');

const router = express.Router();

// In-memory fallback for when MongoDB is not available
let fallbackUsers = [];
let fallbackUserId = 1;

// Helper function to generate ObjectId-like string
const generateObjectId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Export fallbackUsers for access from other parts of the same file
module.exports.fallbackUsers = fallbackUsers;

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user exists (try MongoDB first, fallback to memory)
    let existingUser;
    try {
      existingUser = await User.findOne({ email });
    } catch (error) {
      // MongoDB not available, use fallback
      existingUser = fallbackUsers.find(u => u.email === email);
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user (try MongoDB first, fallback to memory)
    let user;
    try {
      user = await User.create({
        name,
        email,
        password
      });
    } catch (error) {
      // MongoDB not available, use fallback
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      const userId = generateObjectId(); // Use ObjectId-like string
      user = {
        _id: userId,
        id: userId, // Add id field for compatibility
        name,
        email,
        password: hashedPassword,
        profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=FFFFFF`,
        role: 'student',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enrolledCourses: [],
        reminderSettings: {
          email: true,
          intervals: [1, 3, 7]
        },
        learningStreak: 0,
        lastActiveDate: new Date(),
        achievements: []
      };

      fallbackUsers.push(user);
    }

    // Generate tokens
    const token = generateToken(user._id, { name: user.name, email: user.email });
    const refreshToken = generateRefreshToken(user._id);

    // Send welcome email
    try {
      const welcomeEmailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome to SWAYAM 2.0</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                .welcome { background: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin: 20px 0; }
                .features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .feature-item { margin: 10px 0; padding: 10px; background: white; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎓 Welcome to SWAYAM 2.0!</h1>
                    <p>Enhanced Learning Platform</p>
                </div>
                <div class="content">
                    <div class="welcome">
                        <h2>Hello ${name}! 👋</h2>
                        <p>Welcome to SWAYAM 2.0 - Your enhanced learning journey starts here!</p>
                    </div>
                    
                    <h3>🚀 What's New in SWAYAM 2.0:</h3>
                    <div class="features">
                        <div class="feature-item">
                            <strong>📧 Smart Assignment Reminders:</strong> Get notified 1, 3, and 7 days before deadlines
                        </div>
                        <div class="feature-item">
                            <strong>💬 Community Forums:</strong> Connect with fellow learners in course-specific discussions
                        </div>
                        <div class="feature-item">
                            <strong>📊 Progress Dashboard:</strong> Track your learning progress with visual analytics
                        </div>
                        <div class="feature-item">
                            <strong>🌙 Dark Mode:</strong> Study comfortably with our modern, responsive interface
                        </div>
                    </div>
                    
                    <p><strong>Next Steps:</strong></p>
                    <ul>
                        <li>Complete your profile setup</li>
                        <li>Browse available courses</li>
                        <li>Join course forums and connect with peers</li>
                        <li>Set up your assignment reminder preferences</li>
                    </ul>
                    
                    <p>Happy Learning! 📚</p>
                </div>
                <div class="footer">
                    <p>This email was sent to ${email}</p>
                    <p>SWAYAM 2.0 - Transforming Online Education</p>
                    <p>Registration Date: ${new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      await sendEmail(email, '🎓 Welcome to SWAYAM 2.0 - Your Learning Journey Begins!', welcomeEmailHTML);
      console.log(`✅ Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .exists()
    .withMessage('Password is required')
], async (req, res, next) => {
  console.log('Login request received:', { 
    body: req.body,
    headers: req.headers,
    method: req.method,
    url: req.originalUrl
  });

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    let user;
    try {
      console.log('Attempting to find user in MongoDB...');
      user = await User.findOne({ email }).select('+password');
      console.log('MongoDB user lookup result:', user ? 'User found' : 'User not found');
    } catch (dbError) {
      console.warn('MongoDB error, falling back to in-memory users:', dbError.message);
      user = fallbackUsers.find(u => u.email === email);
      console.log('Fallback user lookup result:', user ? 'User found in fallback' : 'User not found in fallback');
    }

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'User not found'
      });
    }

    console.log('User found, checking password...');
    let isMatch = false;
    try {
      if (user.matchPassword) {
        isMatch = await user.matchPassword(password);
      } else {
        console.log('matchPassword method not found, using bcrypt directly');
        const bcrypt = require('bcryptjs');
        if (user.password && password) {
          isMatch = await bcrypt.compare(password, user.password);
        }
      }
      console.log('Password match result:', isMatch);
    } catch (pwError) {
      console.error('Error checking password:', pwError);
      return res.status(500).json({
        success: false,
        message: 'Error during authentication',
        error: 'Password verification failed'
      });
    }

    if (!isMatch) {
      console.log('Invalid password for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'Incorrect password'
      });
    }

    try {
      console.log('Generating tokens...');
      const token = generateToken(user._id || user.id, { 
        name: user.name, 
        email: user.email,
        role: user.role || 'student'
      });
      
      const refreshToken = generateRefreshToken(user._id || user.id);
      
      // Prepare user data for response
      const userData = {
        _id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role || 'student',
        profilePicture: user.profilePicture,
        enrolledCourses: user.enrolledCourses || []
      };

      console.log('Login successful for user:', user.email);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userData,
          token,
          refreshToken
        }
      });
    } catch (tokenError) {
      console.error('Error generating tokens:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Authentication error',
        error: 'Failed to generate authentication tokens'
      });
    }
  } catch (error) {
    console.error('Unexpected error in login route:', error);
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.id)
        .populate('enrolledCourses', 'title thumbnail difficulty')
        .select('-password');
    } catch (error) {
      const fallbackUsers = require('./auth').fallbackUsers || [];
      user = fallbackUsers.find(u => u._id === req.user.id || u.id === req.user.id);
      if (user) {
        user.password = undefined;
        if (!user.enrolledCourses) user.enrolledCourses = [];
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
      updates.email = email;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
router.put('/change-password', protect, [
  body('currentPassword')
    .exists()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        message: 'Invalid refresh token'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      const fallbackUser = fallbackUsers.find(u => u._id === decoded.id || u.id === decoded.id);
      if (!fallbackUser) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const newToken = generateToken(decoded.id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    next(error);
  }
}); // ✅ added missing closing brace here

// @desc    Get reminder settings
// @route   GET /api/auth/reminder-settings
// @access  Private
router.get('/reminder-settings', protect, async (req, res, next) => {
  try {
    let user;
    try {
      user = await User.findById(req.user.id).select('reminderSettings');
    } catch (error) {
      const fallbackUsers = require('./auth').fallbackUsers || [];
      user = fallbackUsers.find(u => u._id === req.user.id || u.id === req.user.id);
      if (user && !user.reminderSettings) {
        user.reminderSettings = {
          email: true,
          intervals: [1, 3, 7]
        };
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.reminderSettings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update reminder settings
// @route   PUT /api/auth/reminder-settings
// @access  Private
router.put('/reminder-settings', protect, async (req, res, next) => {
  try {
    const { email, intervals } = req.body;

    let user;
    try {
      user = await User.findByIdAndUpdate(
        req.user.id,
        {
          reminderSettings: {
            email: email !== undefined ? email : req.user.reminderSettings?.email || true,
            intervals: intervals || req.user.reminderSettings?.intervals || [1, 3, 7]
          }
        },
        { new: true, runValidators: true }
      ).select('reminderSettings');
    } catch (error) {
      const fallbackUsers = require('./auth').fallbackUsers || [];
      const userIndex = fallbackUsers.findIndex(u => u._id === req.user.id || u.id === req.user.id);

      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      fallbackUsers[userIndex].reminderSettings = {
        email: email !== undefined ? email : fallbackUsers[userIndex].reminderSettings?.email || true,
        intervals: intervals || fallbackUsers[userIndex].reminderSettings?.intervals || [1, 3, 7]
      };

      user = fallbackUsers[userIndex];
    }

    res.status(200).json({
      success: true,
      message: 'Reminder settings updated successfully',
      data: user.reminderSettings
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
