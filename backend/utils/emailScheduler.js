const cron = require('node-cron');
const nodemailer = require('nodemailer');
const moment = require('moment');
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to} | Subject: ${subject}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
  }
};

/**
 * Get assignment reminders for a specific day offset
 * SIMPLIFIED VERSION for you:
 *  - Finds courses where ANY assignment is due on targetDate
 *  - Sends to ALL users who have reminderSettings.email = true
 */
const getAssignmentReminders = async (daysBefore) => {
  const targetDate = moment().add(daysBefore, 'days').startOf('day');
  const endOfTargetDate = moment(targetDate).endOf('day');

  try {
    // 1) Find all courses with assignments due on target date
    const courses = await Course.find({
      'assignments.dueDate': {
        $gte: targetDate.toDate(),
        $lte: endOfTargetDate.toDate()
      }
    });

    // 2) All users who want email reminders
    const users = await User.find({
      'reminderSettings.email': true
    });

    const reminders = [];

    for (const course of courses) {
      for (const assignment of course.assignments) {
        if (!moment(assignment.dueDate).isSame(targetDate, 'day')) continue;

        for (const user of users) {
          const intervals = (user.reminderSettings && user.reminderSettings.intervals) || [1, 3, 7];

          if (intervals.includes(daysBefore)) {
            reminders.push({
              user,
              course,
              assignment,
              daysBefore
            });
          }
        }
      }
    }

    console.log(`📌 getAssignmentReminders(${daysBefore}) → ${reminders.length} reminders`);
    return reminders;
  } catch (error) {
    console.log('Using fallback assignment reminder data (DB error)', error.message);

    // Fallback course data for assignment reminders
    const fallbackCourses = [
      {
        _id: 1,
        title: 'Introduction to Web Development',
        assignments: [
          {
            title: 'Build a Personal Website',
            dueDate: moment().add(daysBefore, 'days').toDate(), // exactly daysBefore
            type: 'project',
            maxMarks: 100
          }
        ]
      }
    ];

    const reminders = [];

    const fallbackEmail = process.env.EMAIL_USER || 'student@example.com';

    const mockUsers = [
      {
        name: 'Student User',
        email: fallbackEmail,
        reminderSettings: { email: true, intervals: [1, 3, 7] }
      }
    ];

    for (const course of fallbackCourses) {
      for (const assignment of course.assignments) {
        if (moment(assignment.dueDate).isSame(targetDate, 'day')) {
          for (const user of mockUsers) {
            if (user.reminderSettings.email && user.reminderSettings.intervals.includes(daysBefore)) {
              reminders.push({
                user,
                course,
                assignment,
                daysBefore
              });
            }
          }
        }
      }
    }

    console.log(`📌 [fallback] getAssignmentReminders(${daysBefore}) → ${reminders.length} reminders`);
    return reminders;
  }
};

const sendAssignmentReminders = async () => {
  console.log('🔔 Checking for assignment reminders...');
  try {
    // Check for reminders 1, 3, and 7 days before
    const reminderDays = [1, 3, 7];

    for (const days of reminderDays) {
      const reminders = await getAssignmentReminders(days);

      console.log(`📅 Found ${reminders.length} reminders for ${days} day(s) before deadline`);

      for (const reminder of reminders) {
        const subject = `Assignment Due ${days === 1 ? 'Tomorrow' : `in ${days} Days`}: ${
          reminder.assignment.title
        }`;
        const html = generateReminderHTML(
          reminder.user,
          reminder.course,
          reminder.assignment,
          reminder.daysBefore
        );

        await sendEmail(reminder.user.email, subject, html);
      }
    }
  } catch (error) {
    console.error('❌ Error sending assignment reminders:', error);
  }
};

// Send weekly progress report
const sendWeeklyProgressReport = async () => {
  console.log('📊 Sending weekly progress reports...');

  try {
    const oneWeekAgo = moment().subtract(7, 'days').toDate();

    // Get users who have been active in the last week
    const activeProgresses = await Progress.find({
      lastAccessedAt: { $gte: oneWeekAgo }
    }).populate('userId courseId');

    const userProgressMap = new Map();

    // Group progress by user
    activeProgresses.forEach((progress) => {
      if (!userProgressMap.has(progress.userId._id.toString())) {
        userProgressMap.set(progress.userId._id.toString(), {
          user: progress.userId,
          courses: []
        });
      }
      userProgressMap.get(progress.userId._id.toString()).courses.push({
        course: progress.courseId,
        progress: progress.overallProgress,
        status: progress.status
      });
    });

    // Send reports
    for (const [userId, data] of userProgressMap) {
      if (data.user.reminderSettings && data.user.reminderSettings.email) {
        const subject = 'Your Weekly Learning Progress - SWAYAM 2.0';
        const html = generateProgressReportHTML(data.user, data.courses);
        await sendEmail(data.user.email, subject, html);
      }
    }
  } catch (error) {
    console.error('❌ Error sending progress reports:', error);
  }
};

// Generate progress report HTML
const generateProgressReportHTML = (user, courses) => {
  const coursesHTML = courses
    .map(
      ({ course, progress, status }) => `
    <div class="course-progress">
      <h3>${course.title}</h3>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progress}%"></div>
      </div>
      <p>Progress: ${progress}% | Status: ${
        status.charAt(0).toUpperCase() + status.slice(1)
      }</p>
    </div>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Weekly Progress Report - SWAYAM 2.0</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .course-progress { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #667eea; }
            .progress-bar { background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-fill { background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; transition: width 0.3s ease; }
            .stats { display: flex; justify-content: space-around; text-align: center; margin: 20px 0; }
            .stat { background: white; padding: 15px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📈 Weekly Progress Report</h1>
                <p>SWAYAM 2.0 Learning Platform</p>
            </div>
            <div class="content">
                <h2>Great job, ${user.name}! 🎉</h2>
                <p>Here's a summary of your learning progress this week:</p>
                
                <div class="stats">
                    <div class="stat">
                        <h3>${user.learningStreak || 0}</h3>
                        <p>Day Streak</p>
                    </div>
                    <div class="stat">
                        <h3>${courses.length}</h3>
                        <p>Active Courses</p>
                    </div>
                </div>
                
                <h3>Your Course Progress:</h3>
                ${coursesHTML}
                
                <p>Keep up the great work! Consistent learning is the key to success. 🚀</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// ✅ This was missing in your file – this is why reminders couldn’t send HTML
const generateReminderHTML = (user, course, assignment, daysLeft) => {
  const urgencyText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
            .urgent { color: #e74c3c; font-weight: bold; font-size: 18px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
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
                <p class="urgent">Your assignment is due ${urgencyText}!</p>
                
                <div class="assignment-info">
                    <h3>📝 ${assignment.title}</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
                    <p><strong>Type:</strong> ${assignment.type}</p>
                    <p><strong>Points:</strong> ${assignment.maxMarks}</p>
                </div>
                
                <p>Don't wait until the last minute! Submit your assignment early to avoid any technical issues.</p>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${
    course._id
  }/assignments" class="button">
                    Submit Assignment Now →
                </a>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>You've got this! 💪</p>
                    <p>The SWAYAM 2.0 Team</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Start scheduler
const startScheduler = () => {
  console.log('📅 Starting email scheduler...');

  // ⚠️ DEV MODE: run assignment reminder check VERY OFTEN
  // This helps you test quickly. When done, you can change to real time.
  cron.schedule('* * * * *', () => {
    console.log('⏰ [DEV] Running assignment reminder check...');
    sendAssignmentReminders();
  });

  // ORIGINAL: Check for assignment reminders every day at 7:22 AM
  // cron.schedule('22 7 * * *', () => {
  //   console.log('⏰ Running daily assignment reminder check...');
  //   sendAssignmentReminders();
  // });

  // Send weekly progress reports every Sunday at 6 PM
  cron.schedule('0 18 * * 0', () => {
    console.log('⏰ Sending weekly progress reports...');
    sendWeeklyProgressReport();
  });

  console.log('✅ Email scheduler started successfully');
};

module.exports = {
  startScheduler,
  sendEmail,
  sendAssignmentReminders,
  sendWeeklyProgressReport,
  getAssignmentReminders
};
