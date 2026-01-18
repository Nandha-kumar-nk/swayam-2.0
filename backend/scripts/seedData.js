const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const ForumPost = require('../models/Forum');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedData = async () => {
  try {
    console.log('🌱 Starting to seed database with sample data...');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Progress.deleteMany({});
    await ForumPost.deleteMany({});
    
    console.log('🧹 Cleared existing data');

    // Create sample users
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('password123', salt);

    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        role: 'student',
        profilePicture: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=FFFFFF'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah@example.com',
        password: hashedPassword,
        role: 'instructor',
        profilePicture: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=FFFFFF'
      },
      {
        name: 'Mike Chen',
        email: 'mike@example.com',
        password: hashedPassword,
        role: 'student',
        profilePicture: 'https://ui-avatars.com/api/?name=Mike+Chen&background=F59E0B&color=FFFFFF'
      },
      {
        name: 'Emma Wilson',
        email: 'emma@example.com',
        password: hashedPassword,
        role: 'student',
        profilePicture: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=8B5CF6&color=FFFFFF'
      }
    ]);

    console.log(`👥 Created ${users.length} sample users`);

    // Create sample courses
    const courses = await Course.insertMany([
      {
        title: 'Introduction to React.js',
        description: 'Learn the fundamentals of React.js and build modern web applications',
        instructor: {
          name: 'Sarah Johnson',
          bio: 'Senior Frontend Developer with 8 years of experience',
          avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=FFFFFF'
        },
        duration: {
          weeks: 12,
          hoursPerWeek: 5
        },
        difficulty: 'Beginner',
        category: 'Computer Science',
        tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
        enrollmentCount: 1547,
        rating: {
          average: 4.7,
          count: 342
        },
        isPublished: true,
        price: 2999,
        discountPrice: 1999,
        thumbnail: 'https://via.placeholder.com/400x225/3B82F6/FFFFFF?text=React.js',
        syllabus: [
          {
            week: 1,
            title: 'Introduction to React',
            description: 'Learn what React is and why it\'s popular',
            topics: ['What is React?', 'Setting up development environment', 'Creating your first component'],
            resources: {
              videos: [
                {
                  title: 'Welcome to React',
                  duration: '15 min',
                  url: 'https://example.com/video1'
                },
                {
                  title: 'Setting up React',
                  duration: '20 min',
                  url: 'https://example.com/video2'
                }
              ]
            }
          },
          {
            week: 2,
            title: 'Components and JSX',
            description: 'Understanding React components and JSX syntax',
            topics: ['Functional Components', 'Class Components', 'JSX Syntax', 'Props'],
            resources: {
              videos: [
                {
                  title: 'Understanding Components',
                  duration: '25 min',
                  url: 'https://example.com/video3'
                }
              ]
            }
          }
        ],
        assignments: [
          {
            title: 'Build Your First Component',
            description: 'Create a simple React component that displays user information',
            type: 'project',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            maxMarks: 100,
            week: 2
          },
          {
            title: 'React Hooks Quiz',
            description: 'Test your understanding of React Hooks',
            type: 'quiz',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
            maxMarks: 50,
            week: 4
          }
        ],
        learningOutcomes: [
          'Build modern web applications using React.js',
          'Understand component-based architecture',
          'Master React hooks and state management',
          'Create interactive user interfaces'
        ]
      },
      {
        title: 'Advanced JavaScript Concepts',
        description: 'Master advanced JavaScript concepts including closures, prototypes, and async programming',
        instructor: {
          name: 'Sarah Johnson',
          bio: 'Senior Frontend Developer with 8 years of experience',
          avatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=10B981&color=FFFFFF'
        },
        duration: {
          weeks: 8,
          hoursPerWeek: 6
        },
        difficulty: 'Intermediate',
        category: 'Computer Science',
        tags: ['JavaScript', 'ES6+', 'Async/Await', 'Closures'],
        enrollmentCount: 892,
        rating: {
          average: 4.5,
          count: 156
        },
        isPublished: true,
        price: 3999,
        discountPrice: 2499,
        thumbnail: 'https://via.placeholder.com/400x225/F59E0B/FFFFFF?text=JavaScript',
        syllabus: [
          {
            week: 1,
            title: 'Advanced Functions',
            description: 'Deep dive into functions, closures, and scope',
            topics: ['Closures', 'IIFE', 'Arrow Functions', 'Function Binding'],
            resources: {
              videos: [
                {
                  title: 'Understanding Closures',
                  duration: '30 min',
                  url: 'https://example.com/js-video1'
                }
              ]
            }
          }
        ],
        assignments: [
          {
            title: 'Implement a Closure-based Module',
            description: 'Create a JavaScript module using closures to maintain private state',
            type: 'assignment',
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            maxMarks: 100,
            week: 2
          }
        ],
        learningOutcomes: [
          'Master advanced JavaScript concepts',
          'Understand closures and scope',
          'Work with asynchronous programming',
          'Build complex JavaScript applications'
        ]
      }
    ]);

    console.log(`📚 Created ${courses.length} sample courses`);

    // Create sample progress records
    const progressRecords = await Progress.insertMany([
      {
        userId: users[0]._id, // John Doe
        courseId: courses[0]._id, // React course
        enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedVideos: [],
        assignmentScores: []
      },
      {
        userId: users[2]._id, // Mike Chen
        courseId: courses[0]._id, // React course
        enrolledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedVideos: [],
        assignmentScores: []
      },
      {
        userId: users[0]._id, // John Doe
        courseId: courses[1]._id, // JavaScript course
        enrolledAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        completedVideos: [],
        assignmentScores: []
      }
    ]);

    console.log(`📈 Created ${progressRecords.length} progress records`);

    // Create sample forum posts
    const forumPosts = await ForumPost.insertMany([
      {
        courseId: courses[0]._id, // React course
        userId: users[0]._id, // John Doe
        title: 'How to handle state in functional components?',
        content: 'I\'m struggling with understanding useState hook. Can someone explain with examples?',
        type: 'question',
        tags: ['useState', 'hooks', 'state-management'],
        views: 234,
        upvotes: [users[2]._id, users[3]._id],
        replies: [
          {
            userId: users[1]._id, // Sarah Johnson (instructor)
            content: 'useState is a React Hook that lets you add state to functional components. Here\'s a simple example:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\nThe first element is the current state value, and the second is a function to update it.',
            upvotes: [users[0]._id, users[2]._id],
            isAcceptedAnswer: true,
            acceptedBy: users[0]._id,
            acceptedAt: new Date()
          }
        ],
        hasAcceptedAnswer: true,
        lastActivity: new Date()
      },
      {
        courseId: courses[0]._id, // React course
        userId: users[2]._id, // Mike Chen
        title: 'Best practices for component structure?',
        content: 'What are the best practices for organizing React components in a large project?',
        type: 'discussion',
        tags: ['best-practices', 'project-structure', 'components'],
        views: 156,
        upvotes: [users[0]._id, users[1]._id, users[3]._id],
        replies: [
          {
            userId: users[1]._id, // Sarah Johnson
            content: 'I usually follow the atomic design principle. Start with atoms (buttons, inputs), then molecules (forms, cards), then organisms (header, sidebar).',
            upvotes: [users[0]._id, users[2]._id]
          }
        ],
        isPinned: true,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        courseId: courses[1]._id, // JavaScript course
        userId: users[0]._id, // John Doe
        title: 'Understanding Closures in JavaScript',
        content: 'I\'m having trouble understanding how closures work. Can someone provide a practical example?',
        type: 'help',
        tags: ['closures', 'javascript', 'functions'],
        views: 89,
        upvotes: [users[2]._id],
        replies: [],
        lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      }
    ]);

    console.log(`💬 Created ${forumPosts.length} forum posts`);

    console.log('✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${users.length}`);
    console.log(`📚 Courses: ${courses.length}`);
    console.log(`📈 Progress Records: ${progressRecords.length}`);
    console.log(`💬 Forum Posts: ${forumPosts.length}`);
    console.log('\n🔐 Login Credentials (all users have same password):');
    console.log('Email: john@example.com, sarah@example.com, mike@example.com, emma@example.com');
    console.log('Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Connect to database and seed
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
  seedData();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});