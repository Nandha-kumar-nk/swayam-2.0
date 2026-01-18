const express = require('express');
const { protect } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailScheduler');
const moment = require('moment');

const router = express.Router();

// @desc    Create a new calendar reminder
// @route   POST /api/calendar/reminder
// @access  Private
router.post('/reminder', protect, async (req, res, next) => {
  try {
    const { title, description, reminderDate, reminderTime, email } = req.body;
    
    // Validate date
    const reminderDateTime = moment(`${reminderDate} ${reminderTime}`, 'YYYY-MM-DD HH:mm');
    if (!reminderDateTime.isValid() || reminderDateTime.isBefore(moment())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid future date and time'
      });
    }

    // Calculate delay in milliseconds
    const delayMs = reminderDateTime.diff(moment());
    
    // Schedule the email reminder
    setTimeout(async () => {
      try {
        const subject = `🔔 SWAYAM 2.0 Reminder: ${title}`;
        const html = generateReminderEmailHTML(req.user, title, description, reminderDateTime);
        
        await sendEmail(email || req.user.email, subject, html);
        console.log(`✅ Calendar reminder email sent to ${email || req.user.email} for: ${title}`);
      } catch (error) {
        console.error('❌ Error sending calendar reminder email:', error);
      }
    }, delayMs);

    // For immediate demo purposes, also send a confirmation email
    if (delayMs > 10000) { // If more than 10 seconds in future, send confirmation
      const confirmSubject = '✅ Calendar Reminder Set - SWAYAM 2.0';
      const confirmHtml = generateConfirmationEmailHTML(req.user, title, description, reminderDateTime);
      await sendEmail(email || req.user.email, confirmSubject, confirmHtml);
    }

    res.status(201).json({
      success: true,
      message: 'Calendar reminder has been set successfully!',
      data: {
        title,
        description,
        reminderDateTime: reminderDateTime.toISOString(),
        delayMs,
        willTriggerIn: moment.duration(delayMs).humanize()
      }
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Send immediate test reminder
// @route   POST /api/calendar/test-reminder
// @access  Private
router.post('/test-reminder', protect, async (req, res, next) => {
  try {
    const { title, description, email } = req.body;
    
    const testTitle = title || 'Demo Calendar Reminder';
    const testDescription = description || 'This is a test reminder from your SWAYAM 2.0 calendar system!';
    const now = moment().add(5, 'seconds'); // 5 seconds from now for demo

    // Send immediate test
    setTimeout(async () => {
      try {
        const subject = `🔔 SWAYAM 2.0 Test Reminder: ${testTitle}`;
        const html = generateReminderEmailHTML(req.user, testTitle, testDescription, now);
        
        await sendEmail(email || req.user.email, subject, html);
        console.log(`✅ Test calendar reminder email sent to ${email || req.user.email}`);
      } catch (error) {
        console.error('❌ Error sending test reminder email:', error);
      }
    }, 5000); // 5 second delay

    // Send immediate confirmation
    const confirmSubject = '⚡ Test Calendar Reminder Scheduled - SWAYAM 2.0';
    const confirmHtml = generateTestConfirmationEmailHTML(req.user, testTitle, testDescription);
    await sendEmail(email || req.user.email, confirmSubject, confirmHtml);

    res.status(200).json({
      success: true,
      message: 'Test calendar reminder scheduled! Check your email in 5 seconds.',
      data: {
        title: testTitle,
        description: testDescription,
        scheduledFor: now.toISOString(),
        willTriggerIn: '5 seconds'
      }
    });

  } catch (error) {
    next(error);
  }
});

// Generate reminder email HTML
const generateReminderEmailHTML = (user, title, description, reminderDateTime) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Calendar Reminder - SWAYAM 2.0</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .reminder-info { background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ECDC4; }
            .time-badge { display: inline-block; background: #FF6B6B; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
            .description { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin: 15px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 Calendar Reminder</h1>
                <p>SWAYAM 2.0 Learning Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p>This is your scheduled reminder from the SWAYAM 2.0 calendar system.</p>
                
                <div class="reminder-info">
                    <h3>📅 ${title}</h3>
                    <div class="time-badge">
                        ⏰ ${reminderDateTime.format('MMMM Do YYYY, h:mm A')}
                    </div>
                    <div class="description">
                        <strong>Details:</strong><br>
                        ${description}
                    </div>
                </div>
                
                <p>🎯 <strong>What to do next:</strong></p>
                <ul>
                    <li>Review the reminder details above</li>
                    <li>Check your course dashboard for updates</li>
                    <li>Set additional reminders if needed</li>
                </ul>
                
                <p>Thank you for using SWAYAM 2.0's calendar reminder system! 🚀</p>
            </div>
            <div class="footer">
                <p>This is an automated reminder from SWAYAM 2.0</p>
                <p>Manage your reminders in your profile settings</p>
                <p>Happy Learning! 🎓</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate confirmation email HTML
const generateConfirmationEmailHTML = (user, title, description, reminderDateTime) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reminder Confirmation - SWAYAM 2.0</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .reminder-details { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Reminder Set Successfully</h1>
                <p>SWAYAM 2.0 Calendar System</p>
            </div>
            <div class="content">
                <div class="success-icon">🎉</div>
                <h2>Great job, ${user.name}!</h2>
                <p>Your calendar reminder has been successfully scheduled. Here are the details:</p>
                
                <div class="reminder-details">
                    <h3>📋 ${title}</h3>
                    <p><strong>📅 Scheduled for:</strong> ${reminderDateTime.format('MMMM Do YYYY, h:mm A')}</p>
                    <p><strong>📝 Description:</strong> ${description}</p>
                    <p><strong>⏱️ Time until reminder:</strong> ${reminderDateTime.fromNow()}</p>
                </div>
                
                <p>🔔 <strong>What happens next:</strong></p>
                <ul>
                    <li>You'll receive an email reminder at the scheduled time</li>
                    <li>The reminder will include all the details you specified</li>
                    <li>You can set more reminders anytime from your dashboard</li>
                </ul>
                
                <p>Thank you for using SWAYAM 2.0's smart reminder system! 🚀</p>
            </div>
            <div class="footer">
                <p>This confirmation was sent from SWAYAM 2.0</p>
                <p>Your reminder is now active and will be delivered on time ⏰</p>
                <p>Happy Learning! 🎓</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate test confirmation email HTML
const generateTestConfirmationEmailHTML = (user, title, description) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Test Reminder Scheduled - SWAYAM 2.0</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .countdown { background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9500; text-align: center; }
            .test-details { background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚡ Test Reminder Scheduled</h1>
                <p>SWAYAM 2.0 Demo System</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p>Your test calendar reminder is now scheduled and will be delivered shortly!</p>
                
                <div class="countdown">
                    <h3>⏱️ Countdown: 5 seconds!</h3>
                    <p>Watch your inbox for the reminder email</p>
                </div>
                
                <div class="test-details">
                    <h3>🧪 Test Details:</h3>
                    <p><strong>Title:</strong> ${title}</p>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Delivery:</strong> In 5 seconds from now</p>
                </div>
                
                <p>🎯 <strong>This demonstrates:</strong></p>
                <ul>
                    <li>Calendar-based email scheduling ✅</li>
                    <li>Real-time email delivery ✅</li>
                    <li>Professional email templates ✅</li>
                    <li>User-friendly reminder system ✅</li>
                </ul>
                
                <p>Perfect for your demo presentation! 🚀</p>
            </div>
            <div class="footer">
                <p>This is a demo feature of SWAYAM 2.0</p>
                <p>Calendar reminders working perfectly! ⚡</p>
                <p>Happy Learning! 🎓</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = router;