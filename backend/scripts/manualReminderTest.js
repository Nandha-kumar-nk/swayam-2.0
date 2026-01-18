const axios = require('axios');

const testReminder = async () => {
  try {
    console.log('📧 Testing Assignment Reminder API...');
    
    // First, get an auth token (you'll need to login first)
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'john@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Get user's assignments
    const assignmentsResponse = await axios.get('http://localhost:5000/api/assignments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const assignments = assignmentsResponse.data.data;
    console.log(`📝 Found ${assignments.length} assignments`);
    
    if (assignments.length > 0) {
      const assignment = assignments[0];
      console.log(`🎯 Testing reminder for: ${assignment.title}`);
      
      // Trigger reminder
      const reminderResponse = await axios.post(`http://localhost:5000/api/assignments/${assignment._id}/remind`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Reminder triggered successfully!');
      console.log('📬 Check your email: kumar4112005@gmail.com');
    } else {
      console.log('❌ No assignments found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
};

testReminder();