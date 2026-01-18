const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get database overview
// @route   GET /api/debug/db-overview
// @access  Private
router.get('/db-overview', protect, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      courses: await Course.countDocuments(),
      progress: await Progress.countDocuments(),
      collections: []
    };

    // Get sample data from each collection
    const sampleUsers = await User.find({}, 'name email role createdAt').limit(5);
    const sampleCourses = await Course.find({}, 'title description instructor enrollmentCount').limit(5);
    const sampleProgress = await Progress.find({}, 'userId courseId completedVideos assignmentScores').populate('userId', 'name').populate('courseId', 'title').limit(5);

    stats.collections = [
      {
        name: 'users',
        count: stats.users,
        sample: sampleUsers
      },
      {
        name: 'courses', 
        count: stats.courses,
        sample: sampleCourses
      },
      {
        name: 'progress',
        count: stats.progress,
        sample: sampleProgress
      }
    ];

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('DB Overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching database overview',
      error: error.message
    });
  }
});

// @desc    Get all users
// @route   GET /api/debug/users
// @access  Private
router.get('/users', protect, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get all courses
// @route   GET /api/debug/courses
// @access  Private
router.get('/courses', protect, async (req, res) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching courses',
      error: error.message
    });
  }
});

// @desc    Get progress records
// @route   GET /api/debug/progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    const progress = await Progress.find({})
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: progress.length,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message
    });
  }
});

// @desc    Test email sending
// @route   POST /api/debug/test-email
// @access  Private
router.post('/test-email', protect, async (req, res) => {
  try {
    const { sendEmail } = require('../utils/emailScheduler');
    
    const testEmail = req.body.email || req.user.email;
    const subject = 'SWAYAM 2.0 Test Email';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Test Email</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .success { color: #27ae60; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🧪 Email Test Successful!</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <h2>Hello ${req.user.name}! 👋</h2>
                  <p class="success">If you're reading this, your email system is working perfectly!</p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                      <h3>✅ Test Details</h3>
                      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                      <p><strong>Recipient:</strong> ${testEmail}</p>
                      <p><strong>System:</strong> SWAYAM 2.0 Backend</p>
                  </div>
                  
                  <p>Your email configuration is working correctly. Assignment reminders, submission confirmations, and other notifications will be delivered successfully.</p>
                  
                  <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                      <p>🎓 Happy Learning!</p>
                      <p>The SWAYAM 2.0 Team</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(testEmail, subject, html);
    
    res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// @desc    Check server status and connections
// @route   GET /api/debug/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    const status = {
      server: {
        status: 'running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState
      },
      email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? '***configured***' : 'not configured',
        from: process.env.EMAIL_FROM
      },
      fileSystem: {
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        maxFileSize: process.env.MAX_FILE_SIZE || '10MB'
      }
    };
    
    res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking server status',
      error: error.message
    });
  }
});

module.exports = router;