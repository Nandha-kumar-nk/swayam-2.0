const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const idMapper = require('../middleware/idMapper');

const router = express.Router();

// Fallback course data for when MongoDB is not available
const fallbackCourses = [
  {
    _id: 1,
    title: "Introduction to Web Development",
    description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=500",
    category: "Technology",
    difficulty: "Beginner",
    duration: "8 weeks",
    instructor: {
      name: "Dr. Sarah Johnson",
      avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3B82F6&color=FFFFFF"
    },
    rating: { average: 4.5, count: 1250 },
    enrollmentCount: 5420,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    syllabus: [
      { week: 1, title: "HTML Basics", topics: ["Tags", "Elements", "Structure"] },
      { week: 2, title: "CSS Fundamentals", topics: ["Selectors", "Properties", "Layout"] },
      { week: 3, title: "JavaScript Introduction", topics: ["Variables", "Functions", "Events"] }
    ],
    assignments: [
      { title: "Build a Personal Website", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: "Create Interactive Form", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
    ]
  },
  {
    _id: 2,
    title: "Data Science with Python",
    description: "Master data analysis, visualization, and machine learning with Python",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500",
    category: "Data Science",
    difficulty: "Intermediate",
    duration: "12 weeks",
    instructor: {
      name: "Prof. Michael Chen",
      avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=10B981&color=FFFFFF"
    },
    rating: { average: 4.7, count: 890 },
    enrollmentCount: 3240,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    syllabus: [
      { week: 1, title: "Python Basics", topics: ["Syntax", "Data Types", "Control Flow"] },
      { week: 2, title: "NumPy & Pandas", topics: ["Arrays", "DataFrames", "Analysis"] },
      { week: 3, title: "Data Visualization", topics: ["Matplotlib", "Seaborn", "Plotly"] }
    ],
    assignments: [
      { title: "Data Analysis Project", dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      { title: "ML Model Implementation", dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) }
    ]
  },
  {
    _id: 3,
    title: "Digital Marketing Fundamentals",
    description: "Learn modern digital marketing strategies and tools",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500",
    category: "Business",
    difficulty: "Beginner",
    duration: "6 weeks",
    instructor: {
      name: "Ms. Emily Rodriguez",
      avatar: "https://ui-avatars.com/api/?name=Emily+Rodriguez&background=F59E0B&color=FFFFFF"
    },
    rating: { average: 4.3, count: 670 },
    enrollmentCount: 2180,
    isActive: true,
    createdAt: new Date('2024-02-15'),
    syllabus: [
      { week: 1, title: "Marketing Basics", topics: ["Strategy", "Target Audience", "Channels"] },
      { week: 2, title: "Social Media Marketing", topics: ["Platforms", "Content", "Engagement"] },
      { week: 3, title: "SEO & Analytics", topics: ["Keywords", "Optimization", "Tracking"] }
    ],
    assignments: [
      { title: "Marketing Campaign Plan", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: "Social Media Strategy", dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000) }
    ]
  }
];

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let courses, total;
    
    try {
      courses = await Course.find({ isActive: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-syllabus -assignments');

      total = await Course.countDocuments({ isActive: true });
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('📚 Using fallback course data');
      total = fallbackCourses.length;
      courses = fallbackCourses.slice(skip, skip + limit);
    }
    
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public (with optional auth)
router.get('/:id', idMapper('id'), optionalAuth, async (req, res, next) => {
  try {
    let course;
    
    try {
      course = await Course.findById(req.params.id);
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('📚 Using fallback course data for single course');
      const courseId = parseInt(req.params.id) || req.params.id;
      course = fallbackCourses.find(c => c._id == courseId);
    }
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    let userProgress = null;
    if (req.user) {
      try {
        userProgress = await Progress.findOne({
          userId: req.user.id,
          courseId: course._id
        });
      } catch (error) {
        // MongoDB not available, no progress tracking in fallback mode
        userProgress = null;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        course,
        userProgress
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
