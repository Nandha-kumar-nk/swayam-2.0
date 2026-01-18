require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { sendEmail, sendAssignmentReminders } = require('../utils/emailScheduler');
const moment = require('moment');

console.log('📚 SWAYAM 2.0 - Assignment Reminder Demo Setup\n');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2');

async function setupDemoAssignments() {
  console.log('🎯 Setting up demo assignments with different due dates...\n');
  
  try {
    // Find or create a demo course
    let demoCourse = await Course.findOne({ title: 'Assignment Reminder Demo Course' });
    
    if (!demoCourse) {
      console.log('📖 Creating demo course...');
      demoCourse = await Course.create({
        title: 'Assignment Reminder Demo Course',
        description: 'Course specifically for demonstrating email reminders',
        instructor: { name: 'Demo Instructor' },
        duration: { weeks: 8 },
        difficulty: 'Beginner',
        category: 'Computer Science',
        learningOutcomes: ['Understand email reminders'],
        assignments: [] // We'll add assignments below
      });
    } else {
      console.log('📖 Found existing demo course');
    }
    
    // Clear existing assignments to start fresh
    demoCourse.assignments = [];
    
    // Create assignments with different due dates for testing
    const assignments = [
      {
        title: '🚨 URGENT: Assignment Due Tomorrow',
        description: 'This assignment is due tomorrow - perfect for testing 1-day reminders',
        dueDate: moment().add(1, 'day').hour(23).minute(59).toDate(),
        maxMarks: 100,
        week: 1,
        type: 'assignment',
        isActive: true
      },
      {
        title: '⚡ Assignment Due in 3 Days',
        description: 'This assignment is due in 3 days - perfect for testing 3-day reminders',
        dueDate: moment().add(3, 'days').hour(23).minute(59).toDate(),
        maxMarks: 100,
        week: 2,
        type: 'quiz',
        isActive: true
      },
      {
        title: '📅 Assignment Due in 7 Days',
        description: 'This assignment is due in 7 days - perfect for testing 7-day reminders',
        dueDate: moment().add(7, 'days').hour(23).minute(59).toDate(),
        maxMarks: 100,
        week: 3,
        type: 'project',
        isActive: true
      },
      {
        title: '⏳ Assignment Due in 2 Weeks',
        description: 'This assignment is due in 2 weeks - should not trigger any reminders yet',
        dueDate: moment().add(14, 'days').hour(23).minute(59).toDate(),
        maxMarks: 100,
        week: 4,
        type: 'assignment',
        isActive: true
      },
      {
        title: '📝 Assignment Due in 5 Minutes (Demo)',
        description: 'This assignment is due in 5 minutes - for immediate demo purposes',
        dueDate: moment().add(5, 'minutes').toDate(),
        maxMarks: 50,
        week: 5,
        type: 'quiz',
        isActive: true
      }
    ];
    
    demoCourse.assignments = assignments;
    await demoCourse.save();
    
    console.log('✅ Created demo assignments:');
    assignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.title}`);
      console.log(`      Due: ${moment(assignment.dueDate).format('MMMM Do YYYY, h:mm A')}`);
      console.log(`      Days from now: ${moment(assignment.dueDate).diff(moment(), 'days')}`);
      console.log('');
    });
    
    return demoCourse;
    
  } catch (error) {
    console.error('❌ Error setting up demo assignments:', error.message);
    return null;
  }
}

async function setupDemoUser() {
  console.log('👤 Setting up demo user...\n');
  
  try {
    const demoEmail = process.env.EMAIL_USER; // Use your email for testing
    let demoUser = await User.findOne({ email: demoEmail });
    
    if (!demoUser) {
      console.log('👤 Creating demo user...');
      demoUser = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: 'demopass123',
        reminderSettings: {
          email: true,
          intervals: [1, 3, 7] // Will get reminders 1, 3, and 7 days before
        }
      });
    } else {
      console.log('👤 Found existing demo user');
      // Make sure reminder settings are enabled
      demoUser.reminderSettings = {
        email: true,
        intervals: [1, 3, 7]
      };
      await demoUser.save();
    }
    
    console.log(`✅ Demo user ready: ${demoUser.name} (${demoUser.email})`);
    console.log(`   Reminder intervals: ${demoUser.reminderSettings.intervals.join(', ')} days`);
    
    return demoUser;
    
  } catch (error) {
    console.error('❌ Error setting up demo user:', error.message);
    return null;
  }
}

async function enrollUserInDemoCourse(user, course) {
  console.log('\n📝 Enrolling user in demo course...');
  
  try {
    // Check if already enrolled
    let progress = await Progress.findOne({
      userId: user._id,
      courseId: course._id
    });
    
    if (!progress) {
      progress = await Progress.create({
        userId: user._id,
        courseId: course._id,
        overallProgress: 10,
        status: 'in_progress'
      });
      console.log('✅ User enrolled in demo course');
    } else {
      console.log('✅ User already enrolled in demo course');
    }
    
    // Add to user's enrolled courses if not already there
    if (!user.enrolledCourses.includes(course._id)) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }
    
    return progress;
    
  } catch (error) {
    console.error('❌ Error enrolling user:', error.message);
    return null;
  }
}

async function testRemindersNow() {
  console.log('\n🔔 Testing assignment reminders RIGHT NOW...\n');
  
  try {
    console.log('⏰ Manually triggering reminder system...');
    await sendAssignmentReminders();
    console.log('✅ Reminder check completed!');
    
  } catch (error) {
    console.error('❌ Error testing reminders:', error.message);
  }
}

async function sendInstantDemoReminder(user, course) {
  console.log('\n📧 Sending instant demo assignment reminder...\n');
  
  try {
    const subject = '🚨 DEMO: Assignment Due Soon - SWAYAM 2.0';
    const assignment = course.assignments.find(a => a.title.includes('Due Tomorrow')) || course.assignments[0];
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Assignment Reminder Demo - SWAYAM 2.0</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
              .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
              .due-date { color: #e74c3c; font-weight: bold; font-size: 18px; }
              .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .demo-badge { background: #f39c12; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <span class="demo-badge">DEMO</span>
                  <h1>🚨 Assignment Reminder</h1>
                  <p>SWAYAM 2.0 Learning Platform</p>
              </div>
              <div class="content">
                  <h2>Hello ${user.name}! 👋</h2>
                  <p>This is a <strong>DEMO</strong> of how assignment reminders work in SWAYAM 2.0.</p>
                  
                  <div class="assignment-info">
                      <h3>📝 ${assignment.title}</h3>
                      <p><strong>Course:</strong> ${course.title}</p>
                      <p><strong>Type:</strong> ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</p>
                      <p><strong>Max Marks:</strong> ${assignment.maxMarks}</p>
                      <p class="due-date">⏰ Due: ${moment(assignment.dueDate).format('MMMM Do YYYY, h:mm A')}</p>
                      <p><strong>Description:</strong></p>
                      <p>${assignment.description}</p>
                  </div>
                  
                  <p>🎯 <strong>In a real scenario, students would receive this email:</strong></p>
                  <ul>
                      <li>📅 <strong>7 days before</strong> the due date</li>
                      <li>📅 <strong>3 days before</strong> the due date</li>
                      <li>🚨 <strong>1 day before</strong> the due date</li>
                  </ul>
                  
                  <p>The system runs automatically every day at 9:00 AM to check for upcoming deadlines.</p>
                  
                  <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; color: #155724;">
                      <strong>✨ Demo Features:</strong><br>
                      • Personalized emails with student names<br>
                      • Beautiful HTML templates<br>
                      • Direct links to assignments<br>
                      • Customizable reminder intervals<br>
                      • Professional branding
                  </div>
                  
                  <p>Ready to submit your assignment? 🚀</p>
                  <p style="font-size: 12px; color: #666; margin-top: 30px;">
                      <em>This is a demonstration email. Timestamp: ${new Date().toLocaleString()}</em>
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    await sendEmail(user.email, subject, html);
    console.log('✅ Demo reminder email sent!');
    console.log(`   📧 Check your inbox: ${user.email}`);
    
  } catch (error) {
    console.error('❌ Error sending demo reminder:', error.message);
  }
}

async function runCompleteDemo() {
  console.log('🚀 Starting Complete Assignment Reminder Demo...\n');
  
  try {
    // 1. Set up demo course with assignments
    const demoCourse = await setupDemoAssignments();
    if (!demoCourse) {
      console.log('❌ Failed to set up demo course');
      return;
    }
    
    // 2. Set up demo user
    const demoUser = await setupDemoUser();
    if (!demoUser) {
      console.log('❌ Failed to set up demo user');
      return;
    }
    
    // 3. Enroll user in the course
    const progress = await enrollUserInDemoCourse(demoUser, demoCourse);
    if (!progress) {
      console.log('❌ Failed to enroll user');
      return;
    }
    
    // 4. Send instant demo reminder
    await sendInstantDemoReminder(demoUser, demoCourse);
    
    // 5. Test the actual reminder system
    await testRemindersNow();
    
    console.log('\n🎯 Demo Setup Complete!\n');
    console.log('📧 Check your email inbox for:');
    console.log('   1. 📝 Instant demo assignment reminder');
    console.log('   2. 🔔 Actual system-generated reminders');
    console.log('');
    console.log('🌐 Your demo course details:');
    console.log(`   📚 Course: ${demoCourse.title}`);
    console.log(`   🆔 Course ID: ${demoCourse._id}`);
    console.log(`   📝 Assignments: ${demoCourse.assignments.length}`);
    console.log('');
    console.log('🎪 Demo URLs you can now test:');
    console.log(`   📚 GET /api/courses/${demoCourse._id}`);
    console.log('   📧 POST /api/email-test/reminder-demo');
    console.log('   ⏰ POST /api/calendar/test-reminder');
    console.log('');
    console.log('✨ The reminder system will automatically run daily at 9:00 AM');
    console.log('   and send emails to users with assignments due in 1, 3, or 7 days!');
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error.message);
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