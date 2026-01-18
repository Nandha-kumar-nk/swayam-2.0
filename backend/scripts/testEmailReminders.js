require('dotenv').config();
const mongoose = require('mongoose');
const { sendEmail, sendAssignmentReminders } = require('../utils/emailScheduler');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const moment = require('moment');

console.log('📧 SWAYAM 2.0 - Email Reminder Testing & Demo\n');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2');

async function testEmailConfiguration() {
  console.log('🔧 Testing Email Configuration...');
  
  const config = {
    HOST: process.env.EMAIL_HOST,
    PORT: process.env.EMAIL_PORT,
    USER: process.env.EMAIL_USER,
    FROM: process.env.EMAIL_FROM
  };
  
  console.log('Email Config:');
  Object.keys(config).forEach(key => {
    const value = config[key];
    if (key === 'USER' && value) {
      console.log(`  ${key}: ${value}`);
    } else if (value) {
      console.log(`  ${key}: ${value}`);
    } else {
      console.log(`  ${key}: ❌ NOT SET`);
    }
  });
  
  return config.HOST && config.USER;
}

async function sendTestEmail() {
  console.log('\n📬 Sending Test Email...');
  
  try {
    const testEmail = process.env.EMAIL_USER; // Send to yourself for testing
    const subject = '🧪 SWAYAM 2.0 Email Test';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Email Test - SWAYAM 2.0</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; padding: 15px; border-radius: 5px; color: #155724; margin: 20px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>✅ Email System Test</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <div class="success">
                      <h2>🎉 Success!</h2>
                      <p>Your SWAYAM 2.0 email system is working correctly!</p>
                  </div>
                  <p>If you received this email, your reminder system is ready to send:</p>
                  <ul>
                      <li>📚 Assignment reminders</li>
                      <li>📊 Weekly progress reports</li>
                      <li>🎓 Course enrollment confirmations</li>
                      <li>📅 Calendar reminders</li>
                  </ul>
                  <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(testEmail, subject, html);
    console.log('✅ Test email sent successfully!');
    console.log(`   Check your inbox: ${testEmail}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    return false;
  }
}

async function createTestUserAndCourse() {
  console.log('\n👤 Setting up test user and course...');
  
  try {
    // Create or find test user
    let testUser = await User.findOne({ email: process.env.EMAIL_USER });
    
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: process.env.EMAIL_USER,
        password: 'testpass123',
        reminderSettings: {
          email: true,
          intervals: [1, 3, 7] // 1, 3, and 7 days before due date
        }
      });
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }
    
    // Find a course to use for testing
    let testCourse = await Course.findOne();
    if (!testCourse) {
      console.log('❌ No courses found. Creating test course...');
      testCourse = await Course.create({
        title: 'Email Testing Course',
        description: 'Course for testing email reminders',
        instructor: { name: 'Test Instructor' },
        duration: { weeks: 4 },
        difficulty: 'Beginner',
        category: 'Computer Science',
        learningOutcomes: ['Test email system'],
        assignments: [{
          title: 'Test Assignment - Due Tomorrow',
          description: 'This assignment is due tomorrow to test email reminders',
          dueDate: moment().add(1, 'day').hour(23).minute(59).toDate(), // Tomorrow at 11:59 PM
          maxMarks: 100,
          week: 1,
          type: 'assignment'
        }, {
          title: 'Test Assignment - Due in 3 Days',
          description: 'This assignment is due in 3 days to test email reminders',
          dueDate: moment().add(3, 'days').hour(23).minute(59).toDate(),
          maxMarks: 100,
          week: 2,
          type: 'assignment'
        }]
      });
    }
    
    // Create or update progress
    let progress = await Progress.findOne({ 
      userId: testUser._id, 
      courseId: testCourse._id 
    });
    
    if (!progress) {
      progress = await Progress.create({
        userId: testUser._id,
        courseId: testCourse._id,
        overallProgress: 25,
        status: 'in_progress'
      });
      console.log('✅ Created progress record');
    }
    
    console.log(`✅ Test setup complete:`);
    console.log(`   User: ${testUser.name} (${testUser.email})`);
    console.log(`   Course: ${testCourse.title}`);
    console.log(`   Assignments: ${testCourse.assignments.length}`);
    
    return { testUser, testCourse, progress };
    
  } catch (error) {
    console.error('❌ Error setting up test data:', error.message);
    return null;
  }
}

async function testAssignmentReminders() {
  console.log('\n🔔 Testing Assignment Reminder System...');
  
  try {
    await sendAssignmentReminders();
    console.log('✅ Assignment reminder check completed');
    console.log('   Check the server console for reminder logs');
    console.log('   Check your email for any reminder messages');
  } catch (error) {
    console.error('❌ Error testing assignment reminders:', error.message);
  }
}

async function sendDemoEnrollmentEmail(user, course) {
  console.log('\n📧 Sending Demo Enrollment Email...');
  
  try {
    const subject = `Welcome to ${course.title}! 🎓`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Course Enrollment - SWAYAM 2.0</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
              .assignment { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #ffc107; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Welcome to Your Course!</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <h2>Congratulations, ${user.name}! 👋</h2>
                  <p>You have successfully enrolled in:</p>
                  
                  <div class="course-info">
                      <h3>📚 ${course.title}</h3>
                      <p><strong>Difficulty:</strong> ${course.difficulty}</p>
                      <p><strong>Duration:</strong> ${course.duration.weeks} weeks</p>
                      <p><strong>Description:</strong> ${course.description}</p>
                  </div>
                  
                  <h3>📋 Upcoming Assignments:</h3>
                  ${course.assignments.map(assignment => `
                    <div class="assignment">
                        <strong>${assignment.title}</strong><br>
                        <small>Due: ${moment(assignment.dueDate).format('MMMM Do YYYY, h:mm A')}</small><br>
                        ${assignment.description}
                    </div>
                  `).join('')}
                  
                  <p>🔔 <strong>Reminder Settings:</strong></p>
                  <p>You will receive email reminders ${user.reminderSettings.intervals.join(', ')} days before assignment deadlines.</p>
                  
                  <p>Ready to start learning? 🚀</p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(user.email, subject, html);
    console.log('✅ Demo enrollment email sent!');
    
  } catch (error) {
    console.error('❌ Error sending demo enrollment email:', error.message);
  }
}

async function runCompleteDemo() {
  console.log('🚀 Starting Complete Email Demo...\n');
  
  try {
    // 1. Test email configuration
    const configOK = await testEmailConfiguration();
    if (!configOK) {
      console.log('❌ Email configuration incomplete. Check your .env file.');
      return;
    }
    
    // 2. Send test email
    const testEmailOK = await sendTestEmail();
    if (!testEmailOK) {
      console.log('❌ Test email failed. Check your email credentials.');
      return;
    }
    
    // 3. Set up test data
    const testData = await createTestUserAndCourse();
    if (!testData) {
      console.log('❌ Failed to set up test data.');
      return;
    }
    
    // 4. Send demo enrollment email
    await sendDemoEnrollmentEmail(testData.testUser, testData.testCourse);
    
    // 5. Test assignment reminders
    await testAssignmentReminders();
    
    console.log('\n🎯 Demo Complete! Check your email inbox:');
    console.log(`   📧 ${process.env.EMAIL_USER}`);
    console.log('\n✨ What you should see:');
    console.log('   1. ✅ Email system test confirmation');
    console.log('   2. 🎓 Course enrollment welcome email');
    console.log('   3. 🔔 Assignment reminder emails (if any are due)');
    
    console.log('\n📋 Next Steps:');
    console.log('   • Check your spam folder if emails are missing');
    console.log('   • Verify Gmail app password is correct');
    console.log('   • Use the /api/calendar/test-reminder endpoint for instant email tests');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    mongoose.disconnect();
  }
}

// Run the demo
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB\n');
  runCompleteDemo();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Database connection error:', error.message);
});