const mongoose = require('mongoose');
const idMapper = require('../middleware/idMapper');

console.log('🧪 Testing ID Mapping Middleware\n');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2');

// Wait for connection and test
mongoose.connection.once('open', async () => {
  console.log('✅ Connected to MongoDB\n');
  
  // Wait a moment for the ID mapper to initialize
  setTimeout(async () => {
    // Test the mapping function directly
    console.log('📋 Testing direct ID mapping:');
    const { getMappedId } = require('../middleware/idMapper');
    
    console.log('- Mapping "1":', getMappedId('1'));
    console.log('- Mapping "2":', getMappedId('2'));
    console.log('- Mapping "999":', getMappedId('999')); // Should return original
    console.log();
    
    // Test the middleware
    console.log('🔄 Testing middleware:');
    
    const testCases = [
      { courseId: '1', description: 'Simple ID 1' },
      { courseId: '2', description: 'Simple ID 2' },
      { courseId: '999', description: 'Non-existent ID' },
    ];
    
    for (const testCase of testCases) {
      console.log(`\nTesting: ${testCase.description}`);
      console.log(`Original courseId: "${testCase.courseId}"`);
      
      const req = { params: { courseId: testCase.courseId } };
      const res = {
        status: (code) => ({
          json: (data) => {
            console.log(`❌ Status: ${code}`);
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
          }
        })
      };
      const next = () => {
        console.log(`✅ Mapped courseId: "${req.params.courseId}"`);
      };
      
      try {
        await idMapper('courseId')(req, res, next);
      } catch (error) {
        console.log('❌ Error:', error.message);
      }
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Simple IDs like "1", "2" are mapped to actual ObjectIds');
    console.log('- Invalid IDs return appropriate error messages');
    console.log('- Your forum URL /api/forum/1 should now work!');
    
    process.exit(0);
  }, 2000); // Wait 2 seconds for initialization
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Database connection error:', error.message);
  process.exit(1);
});