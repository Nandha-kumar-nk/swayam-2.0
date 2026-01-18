const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const Course = require('../models/Course');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swayam2', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedCourses = async () => {
  try {
    console.log('🌱 Starting to seed database with 20 comprehensive courses...');

    // Clear existing courses
    await Course.deleteMany({});
    console.log('🧹 Cleared existing courses');

    // Course data based on the fallback courses from routes/courses.js
    const coursesData = [
      {
        title: "Introduction to Web Development",
        description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
        instructor: {
          name: "Dr. Sarah Johnson",
          bio: "Senior Frontend Developer with 8 years of experience in web technologies",
          institution: "Tech University"
        },
        duration: {
          weeks: 8,
          hoursPerWeek: 5
        },
        difficulty: "Beginner",
        category: "Computer Science",
        tags: ["HTML", "CSS", "JavaScript", "Web Development", "Frontend"],
        enrollmentCount: 5420,
        rating: {
          average: 4.5,
          count: 1250
        },
        thumbnail: "https://via.placeholder.com/500x300/3B82F6/FFFFFF?text=Web+Development",
        isActive: true,
        startDate: new Date('2024-01-15'),
        learningOutcomes: [
          "Build responsive websites using HTML and CSS",
          "Add interactivity with JavaScript",
          "Understand web development best practices",
          "Create portfolio-ready projects"
        ],
        syllabus: [
          {
            week: 1,
            title: "HTML Basics",
            topics: ["HTML Tags", "Document Structure", "Semantic HTML"],
            resources: {
              videos: [
                { title: "Introduction to HTML", url: "https://example.com/html-intro", duration: "15:30" },
                { title: "HTML Document Structure", url: "https://example.com/html-structure", duration: "12:45" }
              ],
              documents: [
                { title: "HTML Cheat Sheet", url: "https://example.com/html-cheat-sheet", type: "pdf" }
              ]
            }
          },
          {
            week: 2,
            title: "CSS Fundamentals",
            topics: ["CSS Selectors", "Box Model", "Flexbox Layout"],
            resources: {
              videos: [
                { title: "CSS Selectors Explained", url: "https://example.com/css-selectors", duration: "18:20" }
              ],
              documents: [
                { title: "CSS Grid Guide", url: "https://example.com/css-grid", type: "pdf" }
              ]
            }
          },
          {
            week: 3,
            title: "JavaScript Introduction",
            topics: ["Variables", "Functions", "DOM Manipulation"],
            resources: {
              videos: [
                { title: "JavaScript Variables", url: "https://example.com/js-variables", duration: "20:15" }
              ],
              documents: [
                { title: "JavaScript Basics Slides", url: "https://example.com/js-basics", type: "pdf" }
              ]
            }
          }
        ],
        assignments: [
          {
            title: "Build a Personal Website",
            description: "Create a responsive personal website using HTML, CSS, and JavaScript",
            type: "project",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxMarks: 100,
            week: 6
          }
        ]
      },
      {
        title: "Data Science with Python",
        description: "Master data analysis, visualization, and machine learning with Python",
        instructor: {
          name: "Prof. Michael Chen",
          bio: "Data Science Professor and Researcher specializing in machine learning",
          institution: "Data Science Institute"
        },
        duration: {
          weeks: 12,
          hoursPerWeek: 6
        },
        difficulty: "Intermediate",
        category: "Engineering",
        tags: ["Python", "Data Analysis", "Machine Learning", "Pandas", "NumPy"],
        enrollmentCount: 3240,
        rating: {
          average: 4.7,
          count: 890
        },
        thumbnail: "https://via.placeholder.com/500x300/10B981/FFFFFF?text=Data+Science",
        isActive: true,
        startDate: new Date('2024-02-01'),
        learningOutcomes: [
          "Analyze datasets using Python libraries",
          "Create compelling data visualizations",
          "Build machine learning models",
          "Apply statistical methods to real-world problems"
        ]
      },
      {
        title: "Digital Marketing Fundamentals",
        description: "Learn modern digital marketing strategies and tools",
        instructor: {
          name: "Ms. Emily Rodriguez",
          bio: "Digital Marketing Director with 10+ years of experience",
          institution: "Marketing Excellence Academy"
        },
        duration: {
          weeks: 6,
          hoursPerWeek: 4
        },
        difficulty: "Beginner",
        category: "Management",
        tags: ["Digital Marketing", "Social Media", "SEO", "Content Marketing"],
        enrollmentCount: 2180,
        rating: {
          average: 4.3,
          count: 670
        },
        thumbnail: "https://via.placeholder.com/500x300/F59E0B/FFFFFF?text=Digital+Marketing",
        isActive: true,
        startDate: new Date('2024-02-15')
      },
      {
        title: "Machine Learning Fundamentals",
        description: "Introduction to machine learning algorithms and their applications",
        instructor: {
          name: "Dr. Alex Kumar",
          bio: "AI Researcher and Professor specializing in machine learning",
          institution: "AI Research Center"
        },
        duration: {
          weeks: 10,
          hoursPerWeek: 7
        },
        difficulty: "Advanced",
        category: "Social Sciences",
        tags: ["Machine Learning", "AI", "Algorithms", "Data Science"],
        enrollmentCount: 3870,
        rating: {
          average: 4.8,
          count: 1450
        },
        thumbnail: "https://via.placeholder.com/500x300/8B5CF6/FFFFFF?text=Machine+Learning",
        isActive: true,
        startDate: new Date('2024-01-20')
      },
      {
        title: "Mobile App Development with React Native",
        description: "Build cross-platform mobile applications using React Native",
        instructor: {
          name: "Mr. David Wilson",
          bio: "Senior Mobile Developer with expertise in React Native and Flutter",
          institution: "Mobile Tech Solutions"
        },
        duration: {
          weeks: 9,
          hoursPerWeek: 6
        },
        difficulty: "Intermediate",
        category: "Computer Science",
        tags: ["React Native", "Mobile Development", "JavaScript", "Cross-platform"],
        enrollmentCount: 2150,
        rating: {
          average: 4.6,
          count: 920
        },
        thumbnail: "https://via.placeholder.com/500x300/EF4444/FFFFFF?text=React+Native",
        isActive: true,
        startDate: new Date('2024-02-05')
      },
      {
        category: "Computer Science",
        title: "Cloud Computing with AWS",
        description: "Learn Amazon Web Services for scalable cloud solutions",
        instructor: {
          name: "Ms. Lisa Anderson",
          bio: "AWS Certified Solutions Architect with 7 years of cloud experience",
          institution: "Cloud Technologies Inc"
        },
        duration: {
          weeks: 11,
          hoursPerWeek: 5
        },
        difficulty: "Intermediate",
        category: "Computer Science",
        tags: ["AWS", "Cloud Computing", "DevOps", "Infrastructure"],
        enrollmentCount: 1890,
        rating: {
          average: 4.4,
          count: 780
        },
        thumbnail: "https://via.placeholder.com/500x300/06B6D4/FFFFFF?text=AWS+Cloud",
        isActive: true,
        startDate: new Date('2024-01-25')
      },
      {
        title: "Cybersecurity Essentials",
        description: "Learn fundamental cybersecurity concepts and best practices",
        instructor: {
          name: "Mr. Robert Taylor",
          bio: "Cybersecurity Expert and Certified Ethical Hacker",
          institution: "Cyber Defense Institute"
        },
        duration: {
          weeks: 7,
          hoursPerWeek: 5
        },
        difficulty: "Beginner",
        category: "Computer Science",
        tags: ["Cybersecurity", "Ethical Hacking", "Network Security", "Information Security"],
        enrollmentCount: 2980,
        rating: {
          average: 4.7,
          count: 1100
        },
        thumbnail: "https://via.placeholder.com/500x300/DC2626/FFFFFF?text=Cybersecurity",
        isActive: true,
        startDate: new Date('2024-02-10')
      },
      {
        title: "Blockchain Technology",
        description: "Understanding blockchain, cryptocurrencies, and smart contracts",
        instructor: {
          name: "Dr. Maria Santos",
          bio: "Blockchain Researcher and Cryptocurrency Expert",
          institution: "Blockchain Research Lab"
        },
        duration: {
          weeks: 8,
          hoursPerWeek: 4
        },
        difficulty: "Advanced",
        category: "Computer Science",
        tags: ["Blockchain", "Cryptocurrency", "Smart Contracts", "Decentralized Finance"],
        enrollmentCount: 1420,
        rating: {
          average: 4.2,
          count: 650
        },
        thumbnail: "https://via.placeholder.com/500x300/7C3AED/FFFFFF?text=Blockchain",
        isActive: true,
        startDate: new Date('2024-01-30')
      },
      {
        title: "UI/UX Design Principles",
        description: "Master user interface and user experience design fundamentals",
        instructor: {
          name: "Ms. Jennifer Lee",
          bio: "Senior UX Designer with 9 years of experience in product design",
          institution: "Design Excellence Studio"
        },
        duration: {
          weeks: 6,
          hoursPerWeek: 6
        },
        difficulty: "Beginner",
        category: "Arts",
        tags: ["UI Design", "UX Design", "User Research", "Prototyping"],
        enrollmentCount: 2340,
        rating: {
          average: 4.6,
          count: 890
        },
        thumbnail: "https://via.placeholder.com/500x300/EC4899/FFFFFF?text=UI+UX+Design",
        isActive: true,
        startDate: new Date('2024-02-08')
      },
      {
        title: "DevOps Engineering",
        description: "Learn DevOps practices, CI/CD, and infrastructure automation",
        instructor: {
          name: "Mr. Kevin Brown",
          bio: "DevOps Engineer and Infrastructure Automation Expert",
          institution: "Cloud Infrastructure Corp"
        },
        duration: {
          weeks: 10,
          hoursPerWeek: 7
        },
        difficulty: "Advanced",
        category: "Computer Science",
        tags: ["DevOps", "CI/CD", "Docker", "Kubernetes", "Automation"],
        enrollmentCount: 1560,
        rating: {
          average: 4.5,
          count: 720
        },
        thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=DevOps",
        isActive: true,
        startDate: new Date('2024-01-28')
      },
      {
        title: "Data Structures and Algorithms",
        description: "Master fundamental data structures and algorithm design",
        instructor: {
          name: "Prof. James Wilson",
          bio: "Computer Science Professor specializing in algorithms and data structures",
          institution: "Computer Science Department"
        },
        duration: {
          weeks: 12,
          hoursPerWeek: 8
        },
        difficulty: "Intermediate",
        category: "Computer Science",
        tags: ["Data Structures", "Algorithms", "Problem Solving", "Complexity Analysis"],
        enrollmentCount: 3120,
        rating: {
          average: 4.8,
          count: 1350
        },
        thumbnail: "https://via.placeholder.com/500x300/1F2937/FFFFFF?text=DSA",
        isActive: true,
        startDate: new Date('2024-01-18')
      },
      {
        title: "Python for Data Analysis",
        description: "Comprehensive guide to data analysis using Python libraries",
        instructor: {
          name: "Dr. Rachel Green",
          bio: "Data Analyst and Python Programming Instructor",
          institution: "Python Analytics Institute"
        },
        duration: {
          weeks: 8,
          hoursPerWeek: 5
        },
        difficulty: "Beginner",
        category: "Engineering",
        tags: ["Python", "Data Analysis", "Pandas", "NumPy", "Visualization"],
        enrollmentCount: 2670,
        rating: {
          average: 4.4,
          count: 980
        },
        thumbnail: "https://via.placeholder.com/500x300/10B981/FFFFFF?text=Python+Analysis",
        isActive: true,
        startDate: new Date('2024-02-12')
      },
      {
        title: "Full Stack Development",
        description: "Complete full-stack web development from frontend to backend",
        instructor: {
          name: "Mr. Steven Chen",
          bio: "Full Stack Developer and Tech Lead with expertise in MERN stack",
          institution: "Web Solutions Ltd"
        },
        duration: {
          weeks: 14,
          hoursPerWeek: 8
        },
        difficulty: "Advanced",
        category: "Computer Science",
        tags: ["Full Stack", "MERN", "MongoDB", "Express", "React", "Node.js"],
        enrollmentCount: 2890,
        rating: {
          average: 4.7,
          count: 1150
        },
        thumbnail: "https://via.placeholder.com/500x300/3B82F6/FFFFFF?text=Full+Stack",
        isActive: true,
        startDate: new Date('2024-01-22')
      },
      {
        title: "Digital Photography",
        description: "Learn professional digital photography techniques and editing",
        instructor: {
          name: "Ms. Anna Martinez",
          bio: "Professional Photographer and Adobe Lightroom Expert",
          institution: "Photography Arts Academy"
        },
        duration: {
          weeks: 6,
          hoursPerWeek: 4
        },
        difficulty: "Beginner",
        category: "Arts",
        tags: ["Photography", "Digital Art", "Photo Editing", "Composition"],
        enrollmentCount: 1450,
        rating: {
          average: 4.3,
          count: 670
        },
        thumbnail: "https://via.placeholder.com/500x300/8B5CF6/FFFFFF?text=Photography",
        isActive: true,
        startDate: new Date('2024-02-14')
      },
      {
        title: "Business Analytics",
        description: "Use data-driven insights for strategic business decisions",
        instructor: {
          name: "Dr. Michael Thompson",
          bio: "Business Intelligence Consultant and Analytics Professor",
          institution: "Business School of Management"
        },
        duration: {
          weeks: 9,
          hoursPerWeek: 6
        },
        difficulty: "Intermediate",
        category: "Management",
        tags: ["Business Analytics", "Data Visualization", "Decision Making", "Strategy"],
        enrollmentCount: 1980,
        rating: {
          average: 4.5,
          count: 890
        },
        thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=Business+Analytics",
        isActive: true,
        startDate: new Date('2024-02-06')
      },
      {
        title: "Game Development with Unity",
        description: "Create 2D and 3D games using Unity game engine",
        instructor: {
          name: "Mr. Chris Johnson",
          bio: "Indie Game Developer and Unity Certified Instructor",
          institution: "Game Development Studio"
        },
        duration: {
          weeks: 10,
          hoursPerWeek: 7
        },
        difficulty: "Intermediate",
        category: "Computer Science",
        tags: ["Unity", "Game Development", "C#", "3D Graphics", "Game Design"],
        enrollmentCount: 1670,
        rating: {
          average: 4.6,
          count: 750
        },
        thumbnail: "https://via.placeholder.com/500x300/DC2626/FFFFFF?text=Unity+Games",
        isActive: true,
        startDate: new Date('2024-02-03')
      },
      {
        title: "Ethical Hacking",
        description: "Learn ethical hacking techniques and penetration testing",
        instructor: {
          name: "Mr. David Kim",
          bio: "Certified Ethical Hacker and Cybersecurity Consultant",
          institution: "Cybersecurity Solutions"
        },
        duration: {
          weeks: 12,
          hoursPerWeek: 6
        },
        difficulty: "Advanced",
        category: "Computer Science",
        tags: ["Ethical Hacking", "Penetration Testing", "Network Security", "Vulnerability Assessment"],
        enrollmentCount: 2130,
        rating: {
          average: 4.8,
          count: 920
        },
        thumbnail: "https://via.placeholder.com/500x300/1F2937/FFFFFF?text=Ethical+Hacking",
        isActive: true,
        startDate: new Date('2024-01-26')
      },
      {
        title: "Internet of Things (IoT)",
        description: "Build IoT solutions with sensors, connectivity, and cloud integration",
        instructor: {
          name: "Dr. Priya Patel",
          bio: "IoT Researcher and Embedded Systems Engineer",
          institution: "IoT Innovation Center"
        },
        duration: {
          weeks: 8,
          hoursPerWeek: 5
        },
        difficulty: "Intermediate",
        category: "Computer Science",
        tags: ["IoT", "Sensors", "Embedded Systems", "Cloud Integration"],
        enrollmentCount: 1340,
        rating: {
          average: 4.4,
          count: 680
        },
        thumbnail: "https://via.placeholder.com/500x300/06B6D4/FFFFFF?text=IoT",
        isActive: true,
        startDate: new Date('2024-02-11')
      },
      {
        title: "Financial Management",
        description: "Learn personal and business financial planning and investment",
        instructor: {
          name: "Ms. Sarah Williams",
          bio: "Certified Financial Planner and Investment Advisor",
          institution: "Financial Planning Institute"
        },
        duration: {
          weeks: 7,
          hoursPerWeek: 4
        },
        difficulty: "Beginner",
        category: "Management",
        tags: ["Finance", "Investment", "Financial Planning", "Budgeting"],
        enrollmentCount: 1870,
        rating: {
          average: 4.2,
          count: 890
        },
        thumbnail: "https://via.placeholder.com/500x300/059669/FFFFFF?text=Finance",
        isActive: true,
        startDate: new Date('2024-02-09')
      },
      {
        title: "Artificial Intelligence Ethics",
        description: "Explore ethical considerations in AI development and deployment",
        instructor: {
          name: "Prof. Elena Rodriguez",
          bio: "AI Ethics Researcher and Professor of Technology Ethics",
          institution: "Center for Responsible AI"
        },
        duration: {
          weeks: 6,
          hoursPerWeek: 5
        },
        difficulty: "Advanced",
        category: "Social Sciences",
        tags: ["AI Ethics", "Responsible AI", "Bias in AI", "AI Policy"],
        enrollmentCount: 980,
        rating: {
          average: 4.7,
          count: 540
        },
        thumbnail: "https://via.placeholder.com/500x300/7C3AED/FFFFFF?text=AI+Ethics",
        isActive: true,
        startDate: new Date('2024-02-13')
      }
    ];

    // Insert courses into database
    const courses = await Course.insertMany(coursesData);
    console.log(`✅ Successfully seeded ${courses.length} courses into the database!`);

    // Display summary
    console.log('\n📚 Course Categories and Counts:');
    const categoryCounts = {};
    courses.forEach(course => {
      categoryCounts[course.category] = (categoryCounts[course.category] || 0) + 1;
    });

    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} courses`);
    });

    console.log('\n🎯 Difficulty Levels Distribution:');
    const difficultyCounts = {};
    courses.forEach(course => {
      difficultyCounts[course.difficulty] = (difficultyCounts[course.difficulty] || 0) + 1;
    });

    Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
      console.log(`  ${difficulty}: ${count} courses`);
    });

    console.log('\n✅ Database seeding completed successfully!');
    console.log('You can now visit the courses page to see all 20 courses.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    process.exit(1);
  }
};

// Connect to database and seed
mongoose.connection.once('open', () => {
  console.log('✅ Connected to MongoDB');
  seedCourses();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
