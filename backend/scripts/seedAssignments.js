const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('../models/Course');

dotenv.config();

const sampleCoursesWithAssignments = [
  {
    title: "Introduction to Machine Learning",
    description: "Learn the fundamentals of machine learning algorithms, data preprocessing, and model evaluation techniques.",
    instructor: {
      name: "Dr. Sarah Johnson",
      bio: "AI researcher with 10+ years experience",
      profilePicture: "https://via.placeholder.com/150",
      institution: "Stanford University"
    },
    duration: {
      weeks: 12,
      hoursPerWeek: 6
    },
    difficulty: "Intermediate",
    category: "Computer Science",
    tags: ["Machine Learning", "AI", "Python", "Data Science"],
    assignments: [
      {
        title: "Linear Regression Implementation",
        description: "Implement linear regression from scratch using Python. Include data visualization and performance metrics.",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
        maxMarks: 100,
        week: 2,
        type: "assignment",
        isActive: true
      },
      {
        title: "Classification Algorithms Quiz",
        description: "Multiple choice quiz covering decision trees, SVM, and naive Bayes algorithms.",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 1 week
        maxMarks: 50,
        week: 4,
        type: "quiz",
        isActive: true
      },
      {
        title: "Final Project: Predictive Model",
        description: "Build a complete machine learning pipeline for a real-world dataset of your choice.",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Due in 3 weeks
        maxMarks: 200,
        week: 12,
        type: "project",
        isActive: true
      }
    ],
    syllabus: [
      {
        week: 1,
        title: "Introduction to ML",
        topics: ["What is Machine Learning", "Types of ML", "Applications"],
        resources: {
          videos: [{
            title: "ML Fundamentals",
            url: "https://example.com/video1",
            duration: "45 minutes"
          }],
          documents: [{
            title: "Course Introduction",
            url: "https://example.com/doc1.pdf",
            type: "pdf"
          }]
        }
      },
      {
        week: 2,
        title: "Linear Regression",
        topics: ["Simple Linear Regression", "Multiple Linear Regression", "Cost Functions"],
        resources: {
          videos: [{
            title: "Linear Regression Explained",
            url: "https://example.com/video2",
            duration: "60 minutes"
          }]
        }
      }
    ],
    prerequisites: ["Basic Programming", "Statistics", "Linear Algebra"],
    learningOutcomes: [
      "Understand core ML concepts",
      "Implement basic ML algorithms",
      "Evaluate model performance"
    ],
    thumbnail: "https://via.placeholder.com/300x200",
    startDate: new Date(),
    endDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Web Development with React",
    description: "Master modern web development with React, including hooks, state management, and best practices.",
    instructor: {
      name: "Prof. Michael Chen",
      bio: "Full-stack developer and educator",
      profilePicture: "https://via.placeholder.com/150",
      institution: "MIT"
    },
    duration: {
      weeks: 8,
      hoursPerWeek: 5
    },
    difficulty: "Intermediate",
    category: "Computer Science",
    tags: ["React", "JavaScript", "Web Development", "Frontend"],
    assignments: [
      {
        title: "Component Design Assignment",
        description: "Create reusable React components with proper prop handling and state management.",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Due in 5 days
        maxMarks: 75,
        week: 3,
        type: "assignment",
        isActive: true
      },
      {
        title: "State Management Quiz",
        description: "Test your understanding of React hooks, Context API, and state management patterns.",
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
        maxMarks: 50,
        week: 5,
        type: "quiz",
        isActive: true
      },
      {
        title: "Full-Stack Application",
        description: "Build a complete React application with backend API integration and user authentication.",
        dueDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // Due in 4 weeks
        maxMarks: 150,
        week: 8,
        type: "project",
        isActive: true
      }
    ],
    syllabus: [
      {
        week: 1,
        title: "React Fundamentals",
        topics: ["JSX", "Components", "Props"],
        resources: {
          videos: [{
            title: "Getting Started with React",
            url: "https://example.com/react1",
            duration: "40 minutes"
          }]
        }
      }
    ],
    prerequisites: ["HTML", "CSS", "JavaScript ES6"],
    learningOutcomes: [
      "Build interactive web applications",
      "Master React ecosystem",
      "Deploy production-ready apps"
    ],
    thumbnail: "https://via.placeholder.com/300x200",
    startDate: new Date(),
    endDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000)
  },
  {
    title: "Data Structures and Algorithms",
    description: "Comprehensive course covering essential data structures and algorithms for programming interviews and software development.",
    instructor: {
      name: "Dr. Emily Rodriguez",
      bio: "Computer Science professor specializing in algorithms",
      profilePicture: "https://via.placeholder.com/150",
      institution: "UC Berkeley"
    },
    duration: {
      weeks: 10,
      hoursPerWeek: 8
    },
    difficulty: "Advanced",
    category: "Computer Science",
    tags: ["Algorithms", "Data Structures", "Programming", "Interview Prep"],
    assignments: [
      {
        title: "Array and String Problems",
        description: "Solve 10 coding problems involving arrays and strings. Focus on time and space complexity.",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow!
        maxMarks: 100,
        week: 2,
        type: "assignment",
        isActive: true
      },
      {
        title: "Tree Traversal Implementation",
        description: "Implement various tree traversal algorithms (in-order, pre-order, post-order, level-order).",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Due in 2 weeks
        maxMarks: 120,
        week: 6,
        type: "assignment",
        isActive: true
      },
      {
        title: "Algorithm Analysis Exam",
        description: "Written exam covering time complexity analysis, space complexity, and algorithm design techniques.",
        dueDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // Due in 5 weeks
        maxMarks: 200,
        week: 10,
        type: "exam",
        isActive: true
      }
    ],
    syllabus: [
      {
        week: 1,
        title: "Introduction to Algorithms",
        topics: ["Algorithm Analysis", "Big O Notation", "Time Complexity"],
        resources: {
          videos: [{
            title: "Big O Explained",
            url: "https://example.com/bigO",
            duration: "50 minutes"
          }]
        }
      }
    ],
    prerequisites: ["Programming Fundamentals", "Mathematics"],
    learningOutcomes: [
      "Analyze algorithm complexity",
      "Implement efficient data structures",
      "Solve complex programming problems"
    ],
    thumbnail: "https://via.placeholder.com/300x200",
    startDate: new Date(),
    endDate: new Date(Date.now() + 10 * 7 * 24 * 60 * 60 * 1000)
  }
];

const seedAssignments = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear existing courses (optional - comment out if you want to keep existing data)
    // await Course.deleteMany({});
    // console.log('🗑️  Cleared existing courses');
    
    // Check if courses already exist
    const existingCourses = await Course.find({});
    
    if (existingCourses.length > 0) {
      console.log(`📚 Found ${existingCourses.length} existing courses. Adding assignments...`);
      
      // Update existing courses with assignments if they don't have any
      for (const courseData of sampleCoursesWithAssignments) {
        const existingCourse = await Course.findOne({ title: courseData.title });
        
        if (existingCourse && (!existingCourse.assignments || existingCourse.assignments.length === 0)) {
          existingCourse.assignments = courseData.assignments;
          await existingCourse.save();
          console.log(`✅ Updated "${existingCourse.title}" with assignments`);
        }
      }
    } else {
      // Create new courses with assignments
      const createdCourses = await Course.insertMany(sampleCoursesWithAssignments);
      console.log(`🎉 Created ${createdCourses.length} courses with assignments`);
      
      createdCourses.forEach(course => {
        console.log(`📖 ${course.title} - ${course.assignments.length} assignments`);
      });
    }
    
    // Display upcoming assignments
    const allCourses = await Course.find({ assignments: { $exists: true, $ne: [] } });
    
    console.log('\n📅 Upcoming Assignments:');
    console.log('========================');
    
    allCourses.forEach(course => {
      console.log(`\n🎓 ${course.title}`);
      course.assignments.forEach(assignment => {
        const dueDate = new Date(assignment.dueDate);
        const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        const status = daysUntil < 0 ? '❌ OVERDUE' : 
                      daysUntil === 0 ? '🚨 DUE TODAY' :
                      daysUntil === 1 ? '⚠️  DUE TOMORROW' :
                      `📅 ${daysUntil} days`;
        
        console.log(`  • ${assignment.title} (${assignment.type}) - ${status}`);
        console.log(`    Due: ${dueDate.toLocaleDateString()} ${dueDate.toLocaleTimeString()}`);
      });
    });
    
    console.log('\n✨ Assignment seeding completed successfully!');
    console.log('💡 The email scheduler will now send reminders for these assignments.');
    
  } catch (error) {
    console.error('❌ Error seeding assignments:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run the seed script
if (require.main === module) {
  seedAssignments();
}

module.exports = { seedAssignments, sampleCoursesWithAssignments };