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
    thumbnail: "https://via.placeholder.com/500x300/3B82F6/FFFFFF?text=Web+Development",
    category: "Technology",
    difficulty: "Beginner",
    duration: "8 weeks",
    instructor: {
      name: "Dr. Sarah Johnson",
      avatar: "https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=SJ"
    },
    rating: { average: 4.5, count: 1250 },
    enrollmentCount: 5420,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    syllabus: [
      { week: 1, title: "HTML Basics", topics: ["Tags", "Elements", "Structure"],
        resources: {
          videos: [
            { title: "Introduction to HTML", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "15:30" },
            { title: "HTML Document Structure", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_2mb.mp4", duration: "12:45" }
          ],
          documents: [
            { title: "HTML Cheat Sheet", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" },
            { title: "HTML Best Practices", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ],
          additionalLinks: [
            { title: "MDN HTML Documentation", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" }
          ]
        }
      },
      { week: 2, title: "CSS Fundamentals", topics: ["Selectors", "Properties", "Layout"],
        resources: {
          videos: [
            { title: "CSS Selectors Explained", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "18:20" }
          ],
          documents: [
            { title: "CSS Grid Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" },
            { title: "CSS Flexbox Tutorial", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 3, title: "JavaScript Introduction", topics: ["Variables", "Functions", "Events"],
        resources: {
          videos: [
            { title: "JavaScript Variables", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "20:15" }
          ],
          documents: [
            { title: "JavaScript Basics Slides", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Build a Personal Website", type: "project", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), maxMarks: 100 },
      { title: "Create Interactive Form", type: "project", dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 2,
    title: "Data Science with Python",
    description: "Master data analysis, visualization, and machine learning with Python",
    thumbnail: "https://via.placeholder.com/500x300/10B981/FFFFFF?text=Data+Science",
    category: "Data Science",
    difficulty: "Intermediate",
    duration: "12 weeks",
    instructor: {
      name: "Prof. Michael Chen",
      avatar: "https://via.placeholder.com/150x150/10B981/FFFFFF?text=MC"
    },
    rating: { average: 4.7, count: 890 },
    enrollmentCount: 3240,
    isActive: true,
    createdAt: new Date('2024-02-01'),
    syllabus: [
      { week: 1, title: "Python Basics", topics: ["Syntax", "Data Types", "Control Flow"],
        resources: {
          videos: [
            { title: "Python Installation and Setup", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "10:25" }
          ],
          documents: [
            { title: "Python Installation Guide", url: "https://www.python.org/ftp/python/3.9.0/python-3.9.0-docs-pdf-a4.tar.bz2", type: "pdf" },
            { title: "Python Syntax Reference", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 2, title: "NumPy & Pandas", topics: ["Arrays", "DataFrames", "Analysis"],
        resources: {
          videos: [
            { title: "NumPy Array Operations", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "22:10" }
          ],
          documents: [
            { title: "Pandas Cheat Sheet", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" },
            { title: "Data Analysis with Pandas", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 3, title: "Data Visualization", topics: ["Matplotlib", "Seaborn", "Plotly"],
        resources: {
          videos: [
            { title: "Creating Charts with Matplotlib", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "25:45" }
          ],
          documents: [
            { title: "Matplotlib Tutorial", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Data Analysis Project", type: "project", dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), maxMarks: 100 },
      { title: "ML Model Implementation", type: "project", dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 3,
    title: "Digital Marketing Fundamentals",
    description: "Learn modern digital marketing strategies and tools",
    thumbnail: "https://via.placeholder.com/500x300/F59E0B/FFFFFF?text=Digital+Marketing",
    category: "Business",
    difficulty: "Beginner",
    duration: "6 weeks",
    instructor: {
      name: "Ms. Emily Rodriguez",
      avatar: "https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=ER"
    },
    rating: { average: 4.3, count: 670 },
    enrollmentCount: 2180,
    isActive: true,
    createdAt: new Date('2024-02-15'),
    syllabus: [
      { week: 1, title: "Marketing Basics", topics: ["Strategy", "Target Audience", "Channels"],
        resources: {
          videos: [
            { title: "Marketing Strategy Overview", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "14:30" }
          ],
          documents: [
            { title: "Marketing Strategy Template", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" },
            { title: "Target Audience Worksheet", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 2, title: "Social Media Marketing", topics: ["Platforms", "Content", "Engagement"],
        resources: {
          videos: [
            { title: "Social Media Content Strategy", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "19:15" }
          ],
          documents: [
            { title: "Social Media Calendar Template", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 3, title: "SEO & Analytics", topics: ["Keywords", "Optimization", "Tracking"],
        resources: {
          videos: [
            { title: "SEO Fundamentals", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "16:45" }
          ],
          documents: [
            { title: "SEO Checklist", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" },
            { title: "Google Analytics Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Marketing Campaign Plan", type: "project", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), maxMarks: 100 },
      { title: "Social Media Strategy", type: "project", dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 4,
    title: "Machine Learning Fundamentals",
    description: "Introduction to machine learning algorithms and their applications",
    thumbnail: "https://via.placeholder.com/500x300/8B5CF6/FFFFFF?text=Machine+Learning",
    category: "Artificial Intelligence",
    difficulty: "Advanced",
    duration: "10 weeks",
    instructor: {
      name: "Dr. Alex Kumar",
      avatar: "https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=AK"
    },
    rating: { average: 4.8, count: 1450 },
    enrollmentCount: 3870,
    isActive: true,
    createdAt: new Date('2024-01-20'),
    syllabus: [
      { week: 1, title: "ML Introduction", topics: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"],
        resources: {
          videos: [
            { title: "What is Machine Learning?", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "20:00" }
          ],
          documents: [
            { title: "ML Overview Slides", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      },
      { week: 2, title: "Linear Regression", topics: ["Simple Linear", "Multiple Linear", "Polynomial"],
        resources: {
          videos: [
            { title: "Linear Regression Theory", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "25:30" }
          ],
          documents: [
            { title: "Regression Formulas", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Linear Regression Quiz", type: "quiz", dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), maxMarks: 50 },
      { title: "ML Project Implementation", type: "project", dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 5,
    title: "Mobile App Development with React Native",
    description: "Build cross-platform mobile applications using React Native",
    thumbnail: "https://via.placeholder.com/500x300/EF4444/FFFFFF?text=React+Native",
    category: "Technology",
    difficulty: "Intermediate",
    duration: "9 weeks",
    instructor: {
      name: "Mr. David Wilson",
      avatar: "https://via.placeholder.com/150x150/EF4444/FFFFFF?text=DW"
    },
    rating: { average: 4.6, count: 920 },
    enrollmentCount: 2150,
    isActive: true,
    createdAt: new Date('2024-02-05'),
    syllabus: [
      { week: 1, title: "React Native Setup", topics: ["Environment Setup", "First App", "Expo CLI"],
        resources: {
          videos: [
            { title: "Installing React Native", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "18:45" }
          ],
          documents: [
            { title: "Setup Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "First React Native App", type: "project", dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 6,
    title: "Cloud Computing with AWS",
    description: "Learn Amazon Web Services for scalable cloud solutions",
    thumbnail: "https://via.placeholder.com/500x300/06B6D4/FFFFFF?text=AWS+Cloud",
    category: "Cloud Computing",
    difficulty: "Intermediate",
    duration: "11 weeks",
    instructor: {
      name: "Ms. Lisa Anderson",
      avatar: "https://via.placeholder.com/150x150/06B6D4/FFFFFF?text=LA"
    },
    rating: { average: 4.4, count: 780 },
    enrollmentCount: 1890,
    isActive: true,
    createdAt: new Date('2024-01-25'),
    syllabus: [
      { week: 1, title: "AWS Basics", topics: ["Account Setup", "IAM", "Regions"],
        resources: {
          videos: [
            { title: "AWS Account Creation", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "16:20" }
          ],
          documents: [
            { title: "AWS Getting Started", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "AWS Services Quiz", type: "quiz", dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), maxMarks: 50 }
    ]
  },
  {
    _id: 7,
    title: "Cybersecurity Essentials",
    description: "Learn fundamental cybersecurity concepts and best practices",
    thumbnail: "https://via.placeholder.com/500x300/DC2626/FFFFFF?text=Cybersecurity",
    category: "Security",
    difficulty: "Beginner",
    duration: "7 weeks",
    instructor: {
      name: "Mr. Robert Taylor",
      avatar: "https://via.placeholder.com/150x150/DC2626/FFFFFF?text=RT"
    },
    rating: { average: 4.7, count: 1100 },
    enrollmentCount: 2980,
    isActive: true,
    createdAt: new Date('2024-02-10'),
    syllabus: [
      { week: 1, title: "Security Fundamentals", topics: ["CIA Triad", "Threats", "Vulnerabilities"],
        resources: {
          videos: [
            { title: "Introduction to Cybersecurity", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "22:15" }
          ],
          documents: [
            { title: "Security Basics Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Security Assessment", type: "project", dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 8,
    title: "Blockchain Technology",
    description: "Understanding blockchain, cryptocurrencies, and smart contracts",
    thumbnail: "https://via.placeholder.com/500x300/7C3AED/FFFFFF?text=Blockchain",
    category: "Technology",
    difficulty: "Advanced",
    duration: "8 weeks",
    instructor: {
      name: "Dr. Maria Santos",
      avatar: "https://via.placeholder.com/150x150/7C3AED/FFFFFF?text=MS"
    },
    rating: { average: 4.2, count: 650 },
    enrollmentCount: 1420,
    isActive: true,
    createdAt: new Date('2024-01-30'),
    syllabus: [
      { week: 1, title: "Blockchain Basics", topics: ["Distributed Ledger", "Consensus", "Mining"],
        resources: {
          videos: [
            { title: "What is Blockchain?", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "19:45" }
          ],
          documents: [
            { title: "Blockchain Whitepaper", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Blockchain Quiz", type: "quiz", dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), maxMarks: 50 }
    ]
  },
  {
    _id: 9,
    title: "UI/UX Design Principles",
    description: "Master user interface and user experience design fundamentals",
    thumbnail: "https://via.placeholder.com/500x300/EC4899/FFFFFF?text=UI+UX+Design",
    category: "Design",
    difficulty: "Beginner",
    duration: "6 weeks",
    instructor: {
      name: "Ms. Jennifer Lee",
      avatar: "https://via.placeholder.com/150x150/EC4899/FFFFFF?text=JL"
    },
    rating: { average: 4.6, count: 890 },
    enrollmentCount: 2340,
    isActive: true,
    createdAt: new Date('2024-02-08'),
    syllabus: [
      { week: 1, title: "Design Thinking", topics: ["User Research", "Empathy Maps", "Personas"],
        resources: {
          videos: [
            { title: "Design Thinking Process", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "17:30" }
          ],
          documents: [
            { title: "Design Thinking Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Design Portfolio", type: "project", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 10,
    title: "DevOps Engineering",
    description: "Learn DevOps practices, CI/CD, and infrastructure automation",
    thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=DevOps",
    category: "DevOps",
    difficulty: "Advanced",
    duration: "10 weeks",
    instructor: {
      name: "Mr. Kevin Brown",
      avatar: "https://via.placeholder.com/150x150/059669/FFFFFF?text=KB"
    },
    rating: { average: 4.5, count: 720 },
    enrollmentCount: 1560,
    isActive: true,
    createdAt: new Date('2024-01-28'),
    syllabus: [
      { week: 1, title: "DevOps Culture", topics: ["Collaboration", "Automation", "Monitoring"],
        resources: {
          videos: [
            { title: "DevOps Introduction", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "21:15" }
          ],
          documents: [
            { title: "DevOps Best Practices", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "CI/CD Pipeline Setup", type: "project", dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 11,
    title: "Data Structures and Algorithms",
    description: "Master fundamental data structures and algorithm design",
    thumbnail: "https://via.placeholder.com/500x300/1F2937/FFFFFF?text=DSA",
    category: "Computer Science",
    difficulty: "Intermediate",
    duration: "12 weeks",
    instructor: {
      name: "Prof. James Wilson",
      avatar: "https://via.placeholder.com/150x150/1F2937/FFFFFF?text=JW"
    },
    rating: { average: 4.8, count: 1350 },
    enrollmentCount: 3120,
    isActive: true,
    createdAt: new Date('2024-01-18'),
    syllabus: [
      { week: 1, title: "Arrays and Strings", topics: ["Array Operations", "String Manipulation", "Time Complexity"],
        resources: {
          videos: [
            { title: "Arrays in Programming", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "23:45" }
          ],
          documents: [
            { title: "Array Cheat Sheet", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Array Problems Quiz", type: "quiz", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), maxMarks: 50 },
      { title: "Algorithm Implementation", type: "project", dueDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 12,
    title: "Python for Data Analysis",
    description: "Comprehensive guide to data analysis using Python libraries",
    thumbnail: "https://via.placeholder.com/500x300/10B981/FFFFFF?text=Python+Analysis",
    category: "Data Science",
    difficulty: "Beginner",
    duration: "8 weeks",
    instructor: {
      name: "Dr. Rachel Green",
      avatar: "https://via.placeholder.com/150x150/10B981/FFFFFF?text=RG"
    },
    rating: { average: 4.4, count: 980 },
    enrollmentCount: 2670,
    isActive: true,
    createdAt: new Date('2024-02-12'),
    syllabus: [
      { week: 1, title: "Python Data Tools", topics: ["NumPy", "Pandas", "Matplotlib"],
        resources: {
          videos: [
            { title: "Data Analysis with Python", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "24:20" }
          ],
          documents: [
            { title: "Python Data Libraries Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Data Analysis Quiz", type: "quiz", dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), maxMarks: 50 }
    ]
  },
  {
    _id: 13,
    title: "Full Stack Development",
    description: "Complete full-stack web development from frontend to backend",
    thumbnail: "https://via.placeholder.com/500x300/3B82F6/FFFFFF?text=Full+Stack",
    category: "Technology",
    difficulty: "Advanced",
    duration: "14 weeks",
    instructor: {
      name: "Mr. Steven Chen",
      avatar: "https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=SC"
    },
    rating: { average: 4.7, count: 1150 },
    enrollmentCount: 2890,
    isActive: true,
    createdAt: new Date('2024-01-22'),
    syllabus: [
      { week: 1, title: "MERN Stack Overview", topics: ["MongoDB", "Express.js", "React", "Node.js"],
        resources: {
          videos: [
            { title: "MERN Stack Architecture", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "26:10" }
          ],
          documents: [
            { title: "Full Stack Architecture Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Full Stack Project", type: "project", dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), maxMarks: 150 }
    ]
  },
  {
    _id: 14,
    title: "Digital Photography",
    description: "Learn professional digital photography techniques and editing",
    thumbnail: "https://via.placeholder.com/500x300/8B5CF6/FFFFFF?text=Photography",
    category: "Arts",
    difficulty: "Beginner",
    duration: "6 weeks",
    instructor: {
      name: "Ms. Anna Martinez",
      avatar: "https://via.placeholder.com/150x150/8B5CF6/FFFFFF?text=AM"
    },
    rating: { average: 4.3, count: 670 },
    enrollmentCount: 1450,
    isActive: true,
    createdAt: new Date('2024-02-14'),
    syllabus: [
      { week: 1, title: "Camera Basics", topics: ["Aperture", "Shutter Speed", "ISO"],
        resources: {
          videos: [
            { title: "Understanding Camera Settings", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "18:30" }
          ],
          documents: [
            { title: "Photography Basics Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Photography Portfolio", type: "project", dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 15,
    title: "Business Analytics",
    description: "Use data-driven insights for strategic business decisions",
    thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=Business+Analytics",
    category: "Business",
    difficulty: "Intermediate",
    duration: "9 weeks",
    instructor: {
      name: "Dr. Michael Thompson",
      avatar: "https://via.placeholder.com/150x150/059669/FFFFFF?text=MT"
    },
    rating: { average: 4.5, count: 890 },
    enrollmentCount: 1980,
    isActive: true,
    createdAt: new Date('2024-02-06'),
    syllabus: [
      { week: 1, title: "Analytics Fundamentals", topics: ["Data Collection", "Metrics", "KPIs"],
        resources: {
          videos: [
            { title: "Business Analytics Overview", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "20:45" }
          ],
          documents: [
            { title: "Analytics Framework Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Analytics Report", type: "project", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 16,
    title: "Game Development with Unity",
    description: "Create 2D and 3D games using Unity game engine",
    thumbnail: "https://via.placeholder.com/500x300/DC2626/FFFFFF?text=Unity+Games",
    category: "Game Development",
    difficulty: "Intermediate",
    duration: "10 weeks",
    instructor: {
      name: "Mr. Chris Johnson",
      avatar: "https://via.placeholder.com/150x150/DC2626/FFFFFF?text=CJ"
    },
    rating: { average: 4.6, count: 750 },
    enrollmentCount: 1670,
    isActive: true,
    createdAt: new Date('2024-02-03'),
    syllabus: [
      { week: 1, title: "Unity Interface", topics: ["Project Setup", "Scene Management", "GameObjects"],
        resources: {
          videos: [
            { title: "Unity Getting Started", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "22:30" }
          ],
          documents: [
            { title: "Unity Basics Tutorial", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "First Unity Game", type: "project", dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 17,
    title: "Ethical Hacking",
    description: "Learn ethical hacking techniques and penetration testing",
    thumbnail: "https://via.placeholder.com/500x300/1F2937/FFFFFF?text=Ethical+Hacking",
    category: "Security",
    difficulty: "Advanced",
    duration: "12 weeks",
    instructor: {
      name: "Mr. David Kim",
      avatar: "https://via.placeholder.com/150x150/1F2937/FFFFFF?text=DK"
    },
    rating: { average: 4.8, count: 920 },
    enrollmentCount: 2130,
    isActive: true,
    createdAt: new Date('2024-01-26'),
    syllabus: [
      { week: 1, title: "Hacking Fundamentals", topics: ["Reconnaissance", "Scanning", "Gaining Access"],
        resources: {
          videos: [
            { title: "Ethical Hacking Introduction", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "25:15" }
          ],
          documents: [
            { title: "Hacking Methodology Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Security Assessment Quiz", type: "quiz", dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), maxMarks: 50 },
      { title: "Penetration Testing Report", type: "project", dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 18,
    title: "Internet of Things (IoT)",
    description: "Build IoT solutions with sensors, connectivity, and cloud integration",
    thumbnail: "https://via.placeholder.com/500x300/06B6D4/FFFFFF?text=IoT",
    category: "Technology",
    difficulty: "Intermediate",
    duration: "8 weeks",
    instructor: {
      name: "Dr. Priya Patel",
      avatar: "https://via.placeholder.com/150x150/06B6D4/FFFFFF?text=PP"
    },
    rating: { average: 4.4, count: 680 },
    enrollmentCount: 1340,
    isActive: true,
    createdAt: new Date('2024-02-11'),
    syllabus: [
      { week: 1, title: "IoT Architecture", topics: ["Sensors", "Connectivity", "Cloud Platforms"],
        resources: {
          videos: [
            { title: "IoT System Design", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "19:20" }
          ],
          documents: [
            { title: "IoT Architecture Guide", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "IoT Project Prototype", type: "project", dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 19,
    title: "Financial Management",
    description: "Learn personal and business financial planning and investment",
    thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=Finance",
    category: "Business",
    difficulty: "Beginner",
    duration: "7 weeks",
    instructor: {
      name: "Ms. Sarah Williams",
      avatar: "https://via.placeholder.com/150x150/059669/FFFFFF?text=SW"
    },
    rating: { average: 4.2, count: 890 },
    enrollmentCount: 1870,
    isActive: true,
    createdAt: new Date('2024-02-09'),
    syllabus: [
      { week: 1, title: "Financial Planning", topics: ["Budgeting", "Saving", "Investment Basics"],
        resources: {
          videos: [
            { title: "Personal Finance Fundamentals", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "21:45" }
          ],
          documents: [
            { title: "Financial Planning Template", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "Financial Plan", type: "project", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), maxMarks: 100 }
    ]
  },
  {
    _id: 20,
    title: "Artificial Intelligence Ethics",
    description: "Explore ethical considerations in AI development and deployment",
    thumbnail: "https://via.placeholder.com/500x300/7C3AED/FFFFFF?text=AI+Ethics",
    category: "Artificial Intelligence",
    difficulty: "Advanced",
    duration: "6 weeks",
    instructor: {
      name: "Prof. Elena Rodriguez",
      avatar: "https://via.placeholder.com/150x150/7C3AED/FFFFFF?text=ER"
    },
    rating: { average: 4.7, count: 540 },
    enrollmentCount: 980,
    isActive: true,
    createdAt: new Date('2024-02-13'),
    syllabus: [
      { week: 1, title: "AI Ethics Framework", topics: ["Bias", "Privacy", "Accountability"],
        resources: {
          videos: [
            { title: "Ethics in AI Development", url: "https://sample-videos.com/zip/10/mp4/360/SampleVideo_360x240_1mb.mp4", duration: "23:30" }
          ],
          documents: [
            { title: "AI Ethics Guidelines", url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", type: "pdf" }
          ]
        }
      }
    ],
    assignments: [
      { title: "AI Ethics Case Study", type: "project", dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), maxMarks: 100 }
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
        // MongoDB not available, but user is authenticated, assume enrolled for fallback mode
        console.log('📚 Using fallback progress for authenticated user');
        userProgress = {
          _id: `fallback-${req.user.id}-${course._id}`,
          userId: req.user.id,
          courseId: course._id,
          completedWeeks: [],
          overallProgress: 0,
          status: 'enrolled',
          enrolledAt: new Date(),
          lastAccessedAt: new Date()
        };
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

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
router.post('/:id/enroll', idMapper('id'), protect, async (req, res, next) => {
  try {
    let course;
    let user;
    
    // Get course (try MongoDB first, fallback to memory)
    try {
      course = await Course.findById(req.params.id);
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('📚 Using fallback course data for enrollment');
      const courseId = parseInt(req.params.id) || req.params.id;
      course = fallbackCourses.find(c => c._id == courseId);
    }
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get user data (try MongoDB first, fallback to memory)
    try {
      user = await User.findById(req.user.id);
    } catch (error) {
      // MongoDB not available, use user data from JWT token
      user = {
        _id: req.user.id,
        name: req.user.name || 'Student',
        email: req.user.email || 'student@example.com',
        enrolledCourses: []
      };
      console.log('📚 Using JWT user data for enrollment:', user.email);
    }

    // Check if already enrolled (simplified for fallback mode)
    let existingProgress = null;
    try {
      existingProgress = await Progress.findOne({
        userId: req.user.id,
        courseId: course._id
      });
    } catch (error) {
      // In fallback mode, check if user has already "enrolled" by checking if they have a fallback progress
      existingProgress = null; // Allow enrollment in fallback mode
    }

    if (existingProgress) {
      // User is already enrolled, return success and indicate they can access the forum
      return res.status(200).json({
        success: true,
        message: 'Already enrolled in this course. Redirecting to forum for peer-to-peer learning.',
        data: existingProgress,
        redirectToForum: true
      });
    }

    // Create progress record (try MongoDB first, fallback to memory)
    let progress;
    try {
      progress = await Progress.create({
        userId: req.user.id,
        courseId: course._id
      });

      // Update course enrollment count if MongoDB is available
      try {
        await course.updateEnrollmentCount();
      } catch (updateError) {
        console.warn('Could not update enrollment count:', updateError.message);
      }

    } catch (error) {
      // MongoDB not available, create fallback progress that will be stored in memory for this session
      progress = {
        _id: Date.now(),
        userId: req.user.id,
        courseId: course._id,
        completedWeeks: [],
        overallProgress: 0,
        status: 'enrolled',
        enrolledAt: new Date(),
        lastAccessedAt: new Date()
      };
      console.log('📚 Created fallback progress record for enrollment');
    }

    // Send enrollment welcome email (this should work regardless of database)
    try {
      await sendEnrollmentEmail(user, course);
      console.log(`✅ Enrollment email sent to ${user.email} for course: ${course.title}`);
    } catch (emailError) {
      console.error(`❌ Failed to send enrollment email:`, emailError);
      // Don't fail enrollment if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course! Check your email for course details.',
      data: progress
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    next(error);
  }
});

// Helper function to send enrollment email
const sendEnrollmentEmail = async (user, course) => {
  const { sendEmail } = require('../utils/emailScheduler');
  
  const subject = `Welcome to ${course.title}! 🎓`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Course Enrollment Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .course-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to SWAYAM 2.0!</h1>
                <p>You're now enrolled in ${course.title}</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p>Congratulations! You have successfully enrolled in <strong>${course.title}</strong>.</p>
                
                <div class="course-info">
                    <h3>📚 Course Details</h3>
                    <p><strong>Instructor:</strong> ${course.instructor.name}</p>
                    <p><strong>Duration:</strong> ${course.duration}</p>
                    <p><strong>Difficulty:</strong> ${course.difficulty}</p>
                    <p><strong>Category:</strong> ${course.category}</p>
                </div>
                
                <h3>📅 What's Next?</h3>
                <p>Your course materials are now available! Start with the introduction and complete your first assignment.</p>
                
                <h3>⏰ Assignment Reminders</h3>
                <p>We'll send you email reminders:</p>
                <ul>
                    <li>📧 7 days before each assignment deadline</li>
                    <li>📧 3 days before each assignment deadline</li>
                    <li>📧 1 day before each assignment deadline</li>
                </ul>
                
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${course._id}" class="button">
                    Start Learning →
                </a>
                
                <p>Need help? Join the course forum to connect with fellow students and get support from instructors.</p>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Happy Learning! 🚀</p>
                    <p>The SWAYAM 2.0 Team</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
  
  try {
    await sendEmail(user.email, subject, html);
    console.log(`✅ Enrollment email sent to ${user.email} for course: ${course.title}`);
  } catch (error) {
    console.error(`❌ Failed to send enrollment email to ${user.email}:`, error);
  }
};

// @desc    Get course syllabus
// @route   GET /api/courses/:id/syllabus
// @access  Private (enrolled students only)
router.get('/:id/syllabus', idMapper('id'), protect, async (req, res, next) => {
  try {
    let course;
    let progress = null;

    // Get course (try MongoDB first, fallback to memory)
    try {
      course = await Course.findById(req.params.id).select('syllabus');
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('📚 Using fallback course data for syllabus');
      const courseId = parseInt(req.params.id) || req.params.id;
      course = fallbackCourses.find(c => c._id == courseId);
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled (simplified for fallback mode)
    try {
      progress = await Progress.findOne({
        userId: req.user.id,
        courseId: req.params.id
      });
    } catch (error) {
      // In fallback mode, assume user is enrolled if they have a valid token
      progress = {
        completedWeeks: [],
        enrollmentDate: new Date()
      };
      console.log('📚 Using fallback progress data for syllabus access');
    }

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access the syllabus'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        syllabus: course.syllabus,
        progress: progress ? progress.completedWeeks || [] : []
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get course assignments
// @route   GET /api/courses/:id/assignments
// @access  Private (enrolled students only)
router.get('/:id/assignments', idMapper('id'), protect, async (req, res, next) => {
  try {
    let course;
    let progress = null;
    
    // Get course (try MongoDB first, fallback to memory)
    try {
      course = await Course.findById(req.params.id).select('assignments');
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('📚 Using fallback course data for assignments');
      const courseId = parseInt(req.params.id) || req.params.id;
      course = fallbackCourses.find(c => c._id == courseId);
    }
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled (simplified for fallback mode)
    try {
      progress = await Progress.findOne({
        userId: req.user.id,
        courseId: req.params.id
      });
    } catch (error) {
      // In fallback mode, assume user is enrolled if they have a valid token
      progress = {
        assignmentScores: [],
        enrollmentDate: new Date()
      };
      console.log('📚 Using fallback progress data for assignments access');
    }

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to access assignments'
      });
    }

    // Add submission status to assignments
    const assignmentsWithStatus = course.assignments.map((assignment, index) => {
      const submission = progress.assignmentScores ? progress.assignmentScores.find(
        score => score.assignmentId == assignment._id || score.assignmentId == index
      ) : null;
      
      return {
        _id: assignment._id || index,
        title: assignment.title,
        description: assignment.description || `Complete ${assignment.title}`,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks || 100,
        submitted: !!submission,
        score: submission ? submission.score : null,
        maxScore: submission ? submission.maxScore : (assignment.maxMarks || 100),
        submittedAt: submission ? submission.submittedAt : null
      };
    });

    res.status(200).json({
      success: true,
      data: assignmentsWithStatus
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's enrolled courses with progress
// @route   GET /api/courses/my-courses
// @access  Private (temporarily public for development)
router.get('/my-courses', async (req, res, next) => {
  try {
    console.log('📚 /my-courses endpoint called');
    console.log('📚 req.user:', req.user);

    let progressRecords;

    // For development: return fallback data if no user is authenticated
    if (!req.user) {
      console.log('📚 User not authenticated, returning sample enrolled courses for development');
      progressRecords = [];
    } else {
      // Get user's progress records (try MongoDB first, fallback to memory)
      try {
        progressRecords = await Progress.find({ userId: req.user.id })
          .populate('courseId')
          .sort({ lastAccessedAt: -1 });
        console.log('📚 Found progress records:', progressRecords.length);
      } catch (error) {
        // MongoDB not available, return empty array for now
        console.log('📚 Using fallback for user courses (no persistent progress)');
        progressRecords = [];
      }
    }

    // Format the response
    const enrolledCourses = progressRecords.map(progress => {
      const course = progress.courseId;
      if (!course) return null;

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        progress: progress.overallProgress || 0,
        lastAccessedAt: progress.lastAccessedAt,
        status: progress.status,
        enrolledAt: progress.enrolledAt || progress.createdAt
      };
    }).filter(Boolean);

    // For development: add some sample enrolled courses if none exist
    if (enrolledCourses.length === 0) {
      console.log('📚 No enrolled courses found, adding sample data');
      const sampleCourses = fallbackCourses.slice(0, 3).map(course => ({
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        instructor: course.instructor,
        category: course.category,
        difficulty: course.difficulty,
        duration: course.duration,
        progress: Math.floor(Math.random() * 60) + 20, // Random progress 20-80%
        lastAccessedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last access within 7 days
        status: Math.random() > 0.5 ? 'in_progress' : 'enrolled',
        enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random enrollment within 30 days
      }));
      enrolledCourses.push(...sampleCourses);
    }

    console.log('📚 Returning enrolled courses:', enrolledCourses.length);

    res.status(200).json({
      success: true,
      data: enrolledCourses
    });
  } catch (error) {
    console.error('📚 Error in /my-courses endpoint:', error);
    next(error);
  }
});

// @desc    Download course resource (video/document)
// @route   GET /api/courses/:id/download/:week/:type/:filename
// @access  Private (enrolled students only)
router.get('/:id/download/:week/:type/:filename', idMapper('id'), protect, async (req, res, next) => {
  try {
    const { week, type, filename } = req.params;
    const weekNumber = parseInt(week);

    let course;
    let progress = null;

    // Get course (try MongoDB first, fallback to memory)
    try {
      course = await Course.findById(req.params.id);
    } catch (error) {
      // MongoDB not available, use fallback data
      console.log('Using fallback course data for download');
      const courseId = parseInt(req.params.id) || req.params.id;
      course = fallbackCourses.find(c => c._id == courseId);
    }

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is enrolled (simplified for fallback mode)
    try {
      progress = await Progress.findOne({
        userId: req.user.id,
        courseId: req.params.id
      });
    } catch (error) {
      // In fallback mode, assume user is enrolled if they have a valid token
      progress = {
        enrollmentDate: new Date()
      };
      console.log('Using fallback progress data for download access');
    }

    if (!progress) {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in this course to download resources'
      });
    }

    // Find the specific week in syllabus
    const weekData = course.syllabus?.find(w => w.week === weekNumber);
    if (!weekData) {
      return res.status(404).json({
        success: false,
        message: 'Week not found in course syllabus'
      });
    }

    // Find the resource
    let resource = null;
    let resourceUrl = null;

    if (type === 'video') {
      resource = weekData.resources?.videos?.find(v => v.title === decodeURIComponent(filename) || v.url?.includes(filename));
      if (resource) {
        resourceUrl = resource.url;
      }
    } else if (type === 'document') {
      resource = weekData.resources?.documents?.find(d => d.title === decodeURIComponent(filename) || d.url?.includes(filename));
      if (resource) {
        resourceUrl = resource.url;
      }
    }

    if (!resource || !resourceUrl) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // For demo purposes, we'll redirect to external URLs or serve placeholder content
    // In a real application, you would:
    // 1. Store files in cloud storage (AWS S3, Google Cloud Storage, etc.)
    // 2. Generate signed URLs for secure access
    // 3. Track download analytics

    if (resourceUrl.startsWith('http')) {
      // External URL - redirect
      res.redirect(resourceUrl);
    } else {
      // Local file path - serve the file
      const filePath = path.join(__dirname, '../uploads', resourceUrl);

      if (fs.existsSync(filePath)) {
        res.download(filePath, filename);
      } else {
        // File not found - serve a placeholder or redirect to external source
        res.status(404).json({
          success: false,
          message: 'File not found on server. Please contact support.'
        });
      }
    }

  } catch (error) {
    next(error);
  }
});

// Helper function to check if file exists
const fs = require('fs');
const path = require('path');

module.exports = router;
