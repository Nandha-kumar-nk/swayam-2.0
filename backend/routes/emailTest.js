const express = require('express');
const { sendEmail } = require('../utils/emailScheduler');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Send test email immediately
// @route   POST /api/email-test
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { email, subject, message } = req.body;
    
    const testEmail = email || req.user.email;
    const testSubject = subject || '🧪 SWAYAM 2.0 Email Test';
    const testMessage = message || 'This is a test email from SWAYAM 2.0!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Email Test - SWAYAM 2.0</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px 20px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
              .success { background: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin: 20px 0; }
              .info { background: #d1ecf1; padding: 15px; border-radius: 5px; color: #0c5460; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📧 Email System Test</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <div class="success">
                      <h2>✅ Success!</h2>
                      <p>Your SWAYAM 2.0 email system is working correctly!</p>
                  </div>
                  
                  <div class="info">
                      <h3>📋 Test Details:</h3>
                      <p><strong>Sent to:</strong> ${testEmail}</p>
                      <p><strong>Sent by:</strong> ${req.user.name}</p>
                      <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  
                  <h3>💬 Message:</h3>
                  <p>${testMessage}</p>
                  
                  <p>If you received this email, your reminder system is ready to send:</p>
                  <ul>
                      <li>📚 Assignment reminders</li>
                      <li>📊 Weekly progress reports</li>
                      <li>🎓 Course enrollment confirmations</li>
                      <li>📅 Calendar reminders</li>
                      <li>💬 Forum notifications</li>
                  </ul>
              </div>
              <div class="footer">
                  <p>This is a test email from SWAYAM 2.0</p>
                  <p>Email system operational ✨</p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(testEmail, testSubject, html);
    
    res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      data: {
        sentTo: testEmail,
        subject: testSubject,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// @desc    Send assignment reminder demo
// @route   POST /api/email-test/reminder-demo
// @access  Private
router.post('/reminder-demo', protect, async (req, res, next) => {
  try {
    const testEmail = req.user.email;
    const subject = '🔔 Assignment Reminder Demo - SWAYAM 2.0';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Assignment Reminder Demo - SWAYAM 2.0</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .due-date { color: #e74c3c; font-weight: bold; font-size: 16px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>📚 Assignment Reminder</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <h2>Hello ${req.user.name}! 👋</h2>
                  <p>This is a <strong>DEMO</strong> assignment reminder to show how the system works.</p>
                  
                  <div class="assignment-info">
                      <h3>📝 Demo Assignment: React Component Development</h3>
                      <p><strong>Course:</strong> Introduction to React.js</p>
                      <p><strong>Type:</strong> Programming Assignment</p>
                      <p><strong>Max Marks:</strong> 100</p>
                      <p class="due-date">⏰ Due: Tomorrow at 11:59 PM</p>
                      <p><strong>Description:</strong></p>
                      <p>Create a React component that displays user information with proper state management and event handling. This is a demo assignment to showcase the reminder system.</p>
                  </div>
                  
                  <p>Don't miss this deadline! In a real scenario, you would click the button below to access your course.</p>
                  
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/1" class="button">
                      Go to Assignment →
                  </a>
                  
                  <div class="footer">
                      <p>This is a DEMO reminder from SWAYAM 2.0</p>
                      <p>Your actual reminders will be sent 1, 3, and 7 days before due dates</p>
                      <p>Happy Learning! 🎓</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(testEmail, subject, html);
    
    res.status(200).json({
      success: true,
      message: 'Demo assignment reminder sent successfully!',
      data: {
        sentTo: testEmail,
        subject: subject,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Demo reminder failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send demo reminder',
      error: error.message
    });
  }
});

// @desc    Manually trigger assignment reminder check
// @route   POST /api/email-test/trigger-reminders
// @access  Private
router.post('/trigger-reminders', protect, async (req, res, next) => {
  try {
    const { sendAssignmentReminders } = require('../utils/emailScheduler');
    
    console.log('🔔 Manual trigger: Checking for assignment reminders...');
    
    // Run the reminder check
    await sendAssignmentReminders();
    
    res.status(200).json({
      success: true,
      message: 'Assignment reminder check triggered successfully!',
      data: {
        triggeredBy: req.user.name,
        timestamp: new Date().toISOString(),
        note: 'Check your email and server console for results'
      }
    });
    
  } catch (error) {
    console.error('Manual reminder trigger failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger reminder check',
      error: error.message
    });
  }
});

module.exports = router;
