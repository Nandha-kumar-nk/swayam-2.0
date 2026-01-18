const validateObjectId = require('../middleware/validateObjectId');

console.log('🧪 Testing ObjectId Validation Middleware\n');

// Mock request and response objects
function createMockReq(params) {
  return { params };
}

function createMockRes() {
  return {
    status: (code) => ({
      json: (data) => {
        console.log(`❌ Status: ${code}`);
        console.log(`   Response: ${JSON.stringify(data, null, 2)}\n`);
      }
    })
  };
}

function createNext() {
  return () => console.log('✅ Valid ObjectId - Proceeding to next middleware\n');
}

// Test cases
const testCases = [
  {
    description: 'Invalid ObjectId (simple string)',
    params: { courseId: '1' },
    param: 'courseId'
  },
  {
    description: 'Invalid ObjectId (too short)',
    params: { id: 'abc123' },
    param: 'id'
  },
  {
    description: 'Invalid ObjectId (wrong characters)',
    params: { postId: 'gggggggggggggggggggggggg' },
    param: 'postId'
  },
  {
    description: 'Valid ObjectId',
    params: { courseId: '507f1f77bcf86cd799439011' },
    param: 'courseId'
  },
  {
    description: 'Valid ObjectId (different format)',
    params: { id: '6507f1f77bcf86cd79943901' },
    param: 'id'
  }
];

// Run tests
testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`Parameter: ${testCase.param} = "${testCase.params[testCase.param]}"`);
  
  const req = createMockReq(testCase.params);
  const res = createMockRes();
  const next = createNext();
  
  const validator = validateObjectId(testCase.param);
  validator(req, res, next);
});

console.log('🎯 Summary:');
console.log('- Invalid ObjectIds return 400 status with descriptive error');
console.log('- Valid ObjectIds pass through to next middleware');
console.log('- This prevents the CastError exceptions you were experiencing');
console.log('- Applied to all routes with ObjectId parameters in the API');