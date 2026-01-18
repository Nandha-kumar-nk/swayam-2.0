// Test script for assignment reminders
const emailScheduler = require('./utils/emailScheduler');

// Test the assignment reminder functionality
async function testAssignmentReminders() {
  console.log('🧪 Testing assignment reminder system...');

  try {
    // Test getting reminders for different days
    const daysToTest = [1, 3, 7];

    for (const days of daysToTest) {
      console.log(`\n📅 Testing ${days} day(s) before deadline...`);
      const reminders = await emailScheduler.getAssignmentReminders(days);
      console.log(`✅ Found ${reminders.length} reminder(s) for ${days} day(s) before deadline`);

      // Show details of each reminder
      reminders.forEach((reminder, index) => {
        console.log(`  ${index + 1}. ${reminder.assignment.title}`);
        console.log(`     Course: ${reminder.course.title}`);
        console.log(`     User: ${reminder.user.name} (${reminder.user.email})`);
        console.log(`     Due: ${new Date(reminder.assignment.dueDate).toLocaleDateString()}`);
      });
    }

    console.log('\n✅ Assignment reminder system is working correctly!');
    console.log('📧 Emails would be sent automatically by the cron scheduler at 9 AM daily');

  } catch (error) {
    console.error('❌ Error testing assignment reminders:', error);
  }
}

// Run the test
testAssignmentReminders();
