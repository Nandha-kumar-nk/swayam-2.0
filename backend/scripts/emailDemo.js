const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import models and utilities
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { sendEmail } = require('../utils/emailScheduler');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const emailDemo = async () => {
  try {
    console.log('📧 SWAYAM 2.0 Email Demo & Testing\n');
    console.log('📋 Email Configuration:');
    console.log(`   Host: ${process.env.EMAIL_HOST}`);
    console.log(`   Port: ${process.env.EMAIL_PORT}`);
    console.log(`   User: ${process.env.EMAIL_USER}`);
    console.log(`   From: ${process.env.EMAIL_FROM}\n`);

    // Get sample user and course for testing
    const user = await User.findOne({ email: 'john@example.com' }).exec();
    const course = await Course.findOne({ title: /React/ }).populate('assignments').exec();
    
    if (!user || !course) {
      console.log('❌ Sample data not found. Please run the seed script first: node scripts/seedData.js');
      process.exit(1);
    }

    console.log(`🎯 Testing with user: ${user.name} (${user.email})`);
    console.log(`📚 Using course: ${course.title}\n`);

    // 1. Test Basic Email Connectivity
    console.log('🧪 Test 1: Basic Email Connectivity');
    console.log('-----------------------------------');
    
    try {
      const testSubject = '🧪 SWAYAM 2.0 Email Test';
      const testHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Email Test</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
                .content { padding: 30px 20px; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
                .success { color: #27ae60; font-weight: bold; font-size: 18px; }
                .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Email System Working!</h1>
                    <p>Enhanced SWAYAM 2.0 Learning Platform</p>
                </div>
                <div class="content">
                    <p class="success">✅ Congratulations! Your email system is configured correctly.</p>
                    
                    <div class="highlight">
                        <h3>📊 Test Details:</h3>
                        <ul>
                            <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                            <li><strong>Recipient:</strong> ${user.email}</li>
                            <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
                            <li><strong>Server:</strong> ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}</li>
                        </ul>
                    </div>
                    
                    <p>🚀 <strong>Your SWAYAM 2.0 platform is now ready to send:</strong></p>
                    <ul>
                        <li>📝 Assignment reminder emails</li>
                        <li>✅ Submission confirmations</li>
                        <li>📊 Weekly progress reports</li>
                        <li>🔔 Course notifications</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>This is an automated test message from SWAYAM 2.0</p>
                    <p>🎓 Empowering learners with technology</p>
                </div>
            </div>
        </body>
        </html>
      `;
      
      await sendEmail(user.email, testSubject, testHtml);
      console.log('✅ Basic email test PASSED - Check your inbox!');
    } catch (error) {
      console.log('❌ Basic email test FAILED:', error.message);
      return;
    }

    console.log('\n⏱️ Waiting 3 seconds before next test...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Test Assignment Reminder Email
    console.log('🧪 Test 2: Assignment Reminder Email');
    console.log('------------------------------------');
    
    if (course.assignments && course.assignments.length > 0) {
      const assignment = course.assignments[0];
      const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      try {
        await sendAssignmentReminderEmail(user, course, assignment, Math.max(1, daysLeft));
        console.log('✅ Assignment reminder email SENT successfully!');
        console.log(`   📝 Assignment: ${assignment.title}`);
        console.log(`   📅 Due in: ${Math.max(1, daysLeft)} day(s)`);
      } catch (error) {
        console.log('❌ Assignment reminder email FAILED:', error.message);
      }
    } else {
      console.log('⚠️  No assignments found for reminder test');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Test Submission Confirmation Email
    console.log('\n🧪 Test 3: Submission Confirmation Email');
    console.log('---------------------------------------');
    
    if (course.assignments && course.assignments.length > 0) {
      const assignment = course.assignments[0];
      const mockSubmission = {
        submittedAt: new Date(),
        files: [
          { originalName: 'component.jsx', size: 2048 },
          { originalName: 'readme.md', size: 1024 }
        ]
      };
      
      try {
        await sendSubmissionConfirmationEmail(user, course, assignment, mockSubmission);
        console.log('✅ Submission confirmation email SENT successfully!');
        console.log(`   📎 Files: ${mockSubmission.files.length} attached`);
      } catch (error) {
        console.log('❌ Submission confirmation email FAILED:', error.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Test Weekly Progress Report
    console.log('\n🧪 Test 4: Weekly Progress Report');
    console.log('-----------------------------------');
    
    try {
      await sendWeeklyProgressReport(user);
      console.log('✅ Weekly progress report SENT successfully!');
    } catch (error) {
      console.log('❌ Weekly progress report FAILED:', error.message);
    }

    console.log('\n🎉 Email Demo Complete!');
    console.log('========================');
    console.log('📬 Check your email inbox: kumar4112005@gmail.com');
    console.log('📧 You should have received 4 test emails:');
    console.log('   1. ✅ Basic connectivity test');
    console.log('   2. ⏰ Assignment reminder');
    console.log('   3. 📝 Submission confirmation');
    console.log('   4. 📊 Weekly progress report');
    console.log('\n💡 If emails are not in inbox, check your spam folder!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Email demo failed:', error);
    process.exit(1);
  }
};

// Helper function for assignment reminder email
const sendAssignmentReminderEmail = async (user, course, assignment, daysLeft) => {
  const urgencyText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  const subject = `⏰ Assignment Due ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}: ${assignment.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; border: 1px solid #f0f0f0; }
            .urgent { color: #e74c3c; font-weight: bold; font-size: 20px; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Assignment Reminder</h1>
                <p>Don't Miss Your Deadline!</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <div class="urgent">🚨 Your assignment is due ${urgencyText}!</div>
                
                <div class="assignment-info">
                    <h3>📝 ${assignment.title}</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
                    <p><strong>Type:</strong> ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</p>
                    <p><strong>Points:</strong> ${assignment.maxMarks}</p>
                    <p><strong>Description:</strong> ${assignment.description}</p>
                </div>
                
                <p>📚 <strong>Quick Tips:</strong></p>
                <ul>
                    <li>🕒 Don't wait until the last minute</li>
                    <li>📎 Check file upload requirements</li>
                    <li>💾 Save your work frequently</li>
                    <li>🔍 Review assignment instructions carefully</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL}/courses/${course._id}/assignments" class="button">
                        🚀 Submit Assignment Now
                    </a>
                </div>
            </div>
            <div class="footer">
                <p>You've got this! 💪 Good luck with your assignment!</p>
                <p>The Enhanced SWAYAM 2.0 Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  await sendEmail(user.email, subject, html);
};

// Helper function for submission confirmation email
const sendSubmissionConfirmationEmail = async (user, course, assignment, submission) => {
  const subject = `✅ Assignment Submitted: ${assignment.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignment Submission Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .assignment-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .success { color: #27ae60; font-weight: bold; font-size: 18px; text-align: center; margin: 20px 0; }
            .file-list { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e0e0e0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Submission Confirmed!</h1>
                <p>Enhanced SWAYAM 2.0 Learning Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <div class="success">🎉 Your assignment has been successfully submitted!</div>
                
                <div class="assignment-info">
                    <h3>📝 ${assignment.title}</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Submitted:</strong> ${submission.submittedAt.toLocaleString()}</p>
                    <p><strong>Files Uploaded:</strong> ${submission.files.length}</p>
                </div>
                
                ${submission.files.length > 0 ? `
                <div class="file-list">
                    <h4>📎 Uploaded Files:</h4>
                    <ul>
                        ${submission.files.map(file => `<li>📄 ${file.originalName} (${(file.size / 1024).toFixed(1)} KB)</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                <p>📋 <strong>What's Next?</strong></p>
                <ul>
                    <li>🔍 Your instructor will review your submission</li>
                    <li>📊 You'll receive grades and feedback soon</li>
                    <li>📧 We'll notify you when grades are available</li>
                    <li>💬 Check the course forum for discussions</li>
                </ul>
            </div>
            <div class="footer">
                <p>Keep up the great work! 🎓</p>
                <p>The Enhanced SWAYAM 2.0 Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  await sendEmail(user.email, subject, html);
};

// Helper function for weekly progress report
const sendWeeklyProgressReport = async (user) => {
  const subject = '📊 Your Weekly Learning Progress Report';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Weekly Progress Report</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #2196F3 100%); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .stats { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
            .stat-card { flex: 1; min-width: 120px; background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; border-left: 4px solid #4CAF50; }
            .stat-number { font-size: 24px; font-weight: bold; color: #4CAF50; }
            .course-list { background: white; border: 1px solid #e0e0e0; border-radius: 8px; margin: 15px 0; }
            .course-item { padding: 15px; border-bottom: 1px solid #f0f0f0; }
            .course-item:last-child { border-bottom: none; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📊 Weekly Progress Report</h1>
                <p>Week of ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p>Here's your learning progress summary for this week:</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-number">2</div>
                        <div>Courses Enrolled</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">5</div>
                        <div>Videos Watched</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">2</div>
                        <div>Assignments Due</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">8</div>
                        <div>Forum Posts Read</div>
                    </div>
                </div>
                
                <h3>📚 Your Active Courses</h3>
                <div class="course-list">
                    <div class="course-item">
                        <h4>⚛️ Introduction to React.js</h4>
                        <p><strong>Progress:</strong> 25% Complete</p>
                        <p><strong>Next:</strong> Week 2 - Components and JSX</p>
                        <p><strong>Assignment Due:</strong> Build Your First Component (in 5 days)</p>
                    </div>
                    <div class="course-item">
                        <h4>🔥 Advanced JavaScript Concepts</h4>
                        <p><strong>Progress:</strong> 10% Complete</p>
                        <p><strong>Next:</strong> Week 1 - Advanced Functions</p>
                        <p><strong>Assignment Due:</strong> Closure Module (in 8 days)</p>
                    </div>
                </div>
                
                <h3>🎯 This Week's Goals</h3>
                <ul>
                    <li>📹 Complete 3 more video lessons</li>
                    <li>📝 Start working on React assignment</li>
                    <li>💬 Participate in course discussions</li>
                    <li>📊 Maintain your learning streak</li>
                </ul>
                
                <p><strong>💡 Keep up the momentum!</strong> You're making great progress in your learning journey.</p>
            </div>
            <div class="footer">
                <p>Stay motivated and keep learning! 🚀</p>
                <p>The Enhanced SWAYAM 2.0 Team</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  await sendEmail(user.email, subject, html);
};

// Connect to database and run demo
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
  emailDemo();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});