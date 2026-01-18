import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BookOpenIcon,
  ClockIcon,
  ChartBarIcon,
  FireIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import api from '../../utils/api';
import ChatbotWidget from '../../components/ChatbotWidget';

const DashboardPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch enrolled courses with progress
      const coursesResponse = await api.get('/courses/my-courses');
      if (coursesResponse.data.success && coursesResponse.data.data.length > 0) {
        setEnrolledCourses(coursesResponse.data.data);
      } else {
        // Use dummy data if API returns empty or fails
        setEnrolledCourses([
          {
            _id: 1,
            title: "Introduction to Web Development",
            description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
            thumbnail: "https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Web+Development",
            instructor: { name: "Dr. Sarah Johnson" },
            category: "Technology",
            difficulty: "Beginner",
            duration: { weeks: 8 },
            progress: 65,
            status: 'in_progress',
            enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 2,
            title: "Data Science with Python",
            description: "Master data analysis, visualization, and machine learning with Python",
            thumbnail: "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Data+Science",
            instructor: { name: "Prof. Michael Chen" },
            category: "Data Science",
            difficulty: "Intermediate",
            duration: { weeks: 12 },
            progress: 30,
            status: 'in_progress',
            enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            _id: 3,
            title: "React Advanced Patterns",
            description: "Advanced React concepts including hooks, context, and performance optimization",
            thumbnail: "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=React+Advanced",
            instructor: { name: "Ms. Emily Rodriguez" },
            category: "Technology",
            difficulty: "Advanced",
            duration: { weeks: 6 },
            progress: 85,
            status: 'in_progress',
            enrolledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      }

      // For now, we'll generate upcoming assignments from enrolled courses
      // In a real app, this would come from a separate assignments API
      generateAssignmentsFromCourses(enrolledCourses);

      // Generate recent activities (placeholder for now)
      setRecentActivities([
        {
          id: 1,
          type: "course_enrolled",
          title: "Enrolled in a new course",
          course: "Welcome to your learning journey!",
          timestamp: "Just now",
          icon: BookOpenIcon,
          color: "text-blue-600"
        },
        {
          id: 2,
          type: "week_completed",
          title: "Completed Week 3",
          course: "Introduction to Web Development",
          timestamp: "2 hours ago",
          icon: CheckCircleIcon,
          color: "text-green-600"
        },
        {
          id: 3,
          type: "assignment_submitted",
          title: "Submitted assignment",
          course: "Data Science with Python",
          timestamp: "1 day ago",
          icon: PlayCircleIcon,
          color: "text-purple-600"
        }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      // Always show dummy data as fallback
      setEnrolledCourses([
        {
          _id: 1,
          title: "Introduction to Web Development",
          description: "Learn the fundamentals of web development including HTML, CSS, and JavaScript",
          thumbnail: "https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Web+Development",
          instructor: { name: "Dr. Sarah Johnson" },
          category: "Technology",
          difficulty: "Beginner",
          duration: { weeks: 8 },
          progress: 65,
          status: 'in_progress',
          enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 2,
          title: "Data Science with Python",
          description: "Master data analysis, visualization, and machine learning with Python",
          thumbnail: "https://via.placeholder.com/300x200/10B981/FFFFFF?text=Data+Science",
          instructor: { name: "Prof. Michael Chen" },
          category: "Data Science",
          difficulty: "Intermediate",
          duration: { weeks: 12 },
          progress: 30,
          status: 'in_progress',
          enrolledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          _id: 3,
          title: "React Advanced Patterns",
          description: "Advanced React concepts including hooks, context, and performance optimization",
          thumbnail: "https://via.placeholder.com/300x200/8B5CF6/FFFFFF?text=React+Advanced",
          instructor: { name: "Ms. Emily Rodriguez" },
          category: "Technology",
          difficulty: "Advanced",
          duration: { weeks: 6 },
          progress: 85,
          status: 'in_progress',
          enrolledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);

      // Generate assignments for dummy courses
      generateAssignmentsFromCourses(enrolledCourses);

      // Generate recent activities
      setRecentActivities([
        {
          id: 1,
          type: "course_enrolled",
          title: "Enrolled in a new course",
          course: "Welcome to your learning journey!",
          timestamp: "Just now",
          icon: BookOpenIcon,
          color: "text-blue-600"
        },
        {
          id: 2,
          type: "week_completed",
          title: "Completed Week 3",
          course: "Introduction to Web Development",
          timestamp: "2 hours ago",
          icon: CheckCircleIcon,
          color: "text-green-600"
        },
        {
          id: 3,
          type: "assignment_submitted",
          title: "Submitted assignment",
          course: "Data Science with Python",
          timestamp: "1 day ago",
          icon: PlayCircleIcon,
          color: "text-purple-600"
        }
      ]);

      // Don't show error for demo purposes
      // setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const generateAssignmentsFromCourses = (courses) => {
    // Generate sample assignments based on enrolled courses
    const assignments = [];
    if (!courses || courses.length === 0) {
      // Generate default assignments if no courses available
      assignments.push(
        {
          id: 1,
          title: "Complete Week 2 Assignment",
          course: "Introduction to Web Development",
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 5,
          type: "assignment",
          priority: "high"
        },
        {
          id: 2,
          title: "Data Analysis Project",
          course: "Data Science with Python",
          dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 8,
          type: "project",
          priority: "medium"
        },
        {
          id: 3,
          title: "React Quiz",
          course: "React Advanced Patterns",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: 3,
          type: "quiz",
          priority: "high"
        }
      );
    } else {
      courses.slice(0, 3).forEach((course, index) => {
        assignments.push({
          id: index + 1,
          title: `Complete Week ${Math.floor(Math.random() * course.duration?.weeks || 8) + 1}`,
          course: course.title,
          dueDate: new Date(Date.now() + (Math.random() * 10 + 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysLeft: Math.floor(Math.random() * 10) + 3,
          type: Math.random() > 0.5 ? "assignment" : "project",
          priority: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
        });
      });
    }
    setUpcomingAssignments(assignments);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'assignment': return '📝';
      case 'project': return '🚀';
      case 'quiz': return '❓';
      default: return '📚';
    }
  };

  // Calculate overall stats
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(c => c.status === 'completed').length;
  const totalTimeSpent = enrolledCourses.reduce((sum, course) => sum + (course.timeSpent || 0), 0);
  const averageProgress = totalCourses > 0 ? enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / totalCourses : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Here's your learning progress and upcoming assignments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{completedCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <ChartBarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{Math.round(averageProgress)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hours Studied</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTimeSpent}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Courses</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {enrolledCourses.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpenIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No enrolled courses yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Start your learning journey by enrolling in a course.
                      </p>
                      <Link to="/courses" className="btn-primary">
                        Browse Courses
                      </Link>
                    </div>
                  ) : (
                    enrolledCourses.map(course => (
                      <div key={course._id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <img
                          src={course.thumbnail || `https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=${encodeURIComponent(course.title)}`}
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{course.title}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            by {course.instructor?.name || 'Instructor'}
                            {course.instructor?.institution && ` • ${course.instructor.institution}`}
                          </p>

                          {/* Progress Bar */}
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                              <span>Progress: {Math.round(course.progress || 0)}%</span>
                              <span>{Math.round(course.progress || 0)}% Complete</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${course.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Next Assignment or Status */}
                          <div className="mt-2 flex items-center text-sm text-orange-600 dark:text-orange-400">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>Enrolled {new Date(course.enrolledAt || course.lastAccessedAt).toLocaleDateString()}</span>
                          </div>

                          {/* Completed Badge */}
                          {course.status === 'completed' && (
                            <div className="mt-2 flex items-center text-sm text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2">
                          <Link
                            to={`/courses/${course._id}`}
                            className="btn-primary text-sm px-3 py-1"
                          >
                            Continue
                          </Link>
                          <Link
                            to={`/forum/${course._id}`}
                            className="btn-outline text-sm px-3 py-1 flex items-center"
                          >
                            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                            Forum
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${activity.color.replace('text-', 'bg-').replace('600', '100')} dark:${activity.color.replace('text-', 'bg-').replace('600', '900')}`}>
                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{activity.course} • {activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Assignments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h2>
                  <BellAlertIcon className="w-5 h-5 text-orange-500" />
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {upcomingAssignments.map(assignment => (
                    <div key={assignment.id} className={`p-3 rounded-lg border ${getPriorityColor(assignment.priority)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getTypeIcon(assignment.type)}</span>
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">{assignment.title}</h3>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{assignment.course}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              Due {formatDate(assignment.dueDate)}
                            </span>
                            <span className={`text-xs font-bold ${
                              assignment.daysLeft <= 3 ? 'text-red-600' :
                              assignment.daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {assignment.daysLeft} days left
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/assignments" className="block mt-4 text-center btn-outline text-sm py-2">
                  View All Assignments
                </Link>
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar</h2>
              </div>
              <div className="p-6">
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  className="react-calendar"
                  tileClassName={({ date }) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const hasDeadline = upcomingAssignments.some(a => a.dueDate === dateStr);
                    return hasDeadline ? 'react-calendar__tile--hasActive' : '';
                  }}
                />
              </div>
            </div>

            {/* Learning Streak */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="p-6 text-center">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full inline-flex mb-4">
                  <FireIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Learning Streak</h3>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{user?.learningStreak || 7} days</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Keep it up! You're doing great!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Widget */}
      <ChatbotWidget
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        user={user}
      />

      {/* Chatbot Toggle Button */}
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-50"
        title="Open AI Assistant"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  );
};

export default DashboardPage;
