import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  StarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  PlayIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  ComputerDesktopIcon,
  LinkIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

const CourseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  const [syllabus, setSyllabus] = useState(null);
  const [assignments, setAssignments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([1])); // Expand first week by default

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  useEffect(() => {
    if (user && userProgress) {
      fetchSyllabus();
      fetchAssignments();
    }
  }, [user, userProgress]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${id}`);
      if (response.data.success) {
        setCourse(response.data.data.course);
        setUserProgress(response.data.data.userProgress);
      }
    } catch (err) {
      setError('Failed to load course details');
      console.error('Error fetching course:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyllabus = async () => {
    try {
      const response = await api.get(`/courses/${id}/syllabus`);
      if (response.data.success) {
        setSyllabus(response.data.data.syllabus);
      }
    } catch (err) {
      console.error('Error fetching syllabus:', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get(`/courses/${id}/assignments`);
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    // If user is already enrolled, redirect to forum for P2P learning
    if (userProgress) {
      navigate(`/forum/${id}`);
      return;
    }

    try {
      setEnrolling(true);
      const response = await api.post(`/courses/${id}/enroll`);
      if (response.data.success) {
        if (response.data.redirectToForum) {
          // User is already enrolled, redirect to forum
          navigate(`/forum/${id}`);
          return;
        }
        // Refetch course data to get updated progress
        await fetchCourseDetail();
        // Show success message
        alert('Successfully enrolled in course!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDownload = async (weekNumber, type, filename, url) => {
    try {
      // For external URLs, open in new tab
      if (url.startsWith('http')) {
        window.open(url, '_blank');
        return;
      }

      // For internal resources, make API call to download
      const response = await api.get(`/courses/${id}/download/${weekNumber}/${type}/${encodeURIComponent(filename)}`, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Error downloading resource:', err);
      setError('Failed to download resource');
    }
  };

  const toggleWeekExpansion = (weekNumber) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          i < Math.floor(rating) ? (
            <StarSolid key={i} className="w-5 h-5 text-yellow-400" />
          ) : (
            <StarIcon key={i} className="w-5 h-5 text-gray-300" />
          )
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {rating}
        </span>
      </div>
    );
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'quiz':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'assignment':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'project':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
      case 'exam':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Course
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AcademicCapIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Course Not Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary"
          >
            Browse All Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="md:flex">
            {/* Course Image */}
            <div className="md:w-1/3">
              <img
                src={course.thumbnail || `https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=${encodeURIComponent(course.title)}`}
                alt={course.title}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            
            {/* Course Info */}
            <div className="md:w-2/3 p-8">
              {/* Category Badge */}
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-full mb-4">
                {course.category}
              </span>
              
              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {course.title}
              </h1>
              
              {/* Instructor */}
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                by <span className="font-semibold">{course.instructor.name}</span>
                {course.instructor.institution && (
                  <span> • {course.instructor.institution}</span>
                )}
              </p>
              
              {/* Rating */}
              <div className="flex items-center mb-6">
                {renderStars(course.rating.average)}
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({course.rating.count} reviews)
                </span>
              </div>
              
              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <ClockIcon className="w-6 h-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.duration.weeks} weeks
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course.duration.hoursPerWeek} hrs/week
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <UserGroupIcon className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.enrollmentCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">enrolled</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AcademicCapIcon className="w-6 h-6 mx-auto text-purple-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.difficulty}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">level</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <BookOpenIcon className="w-6 h-6 mx-auto text-orange-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {course.assignments?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">assignments</p>
                </div>
              </div>
              
              {/* Enrollment Button */}
              {!userProgress ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className={`w-full md:w-auto btn-primary text-lg py-3 px-8 ${enrolling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {enrolling ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Enrolling...</span>
                    </div>
                  ) : (
                    'Enroll Now'
                  )}
                </button>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    <span className="font-semibold">Enrolled</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Progress: {userProgress.completedWeeks?.length || 0} / {course.duration.weeks} weeks
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpenIcon },
              { id: 'syllabus', label: 'Syllabus', icon: DocumentTextIcon, requiresEnrollment: true },
              { id: 'assignments', label: 'Assignments', icon: ComputerDesktopIcon, requiresEnrollment: true },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.requiresEnrollment && !userProgress}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } ${tab.requiresEnrollment && !userProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.requiresEnrollment && !userProgress && (
                  <span className="text-xs">(Enrollment Required)</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  About This Course
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  {course.description}
                </p>
                
                {/* Learning Outcomes */}
                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      What You'll Learn
                    </h3>
                    <ul className="space-y-2">
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Prerequisites */}
                {course.prerequisites && course.prerequisites.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Prerequisites
                    </h3>
                    <ul className="space-y-2">
                      {course.prerequisites.map((prereq, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <ArrowRightIcon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">{prereq}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Instructor Info */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Instructor
                </h2>
                <div className="flex items-start space-x-4">
                  <img
                    src={course.instructor.profilePicture || `https://via.placeholder.com/80x80/3B82F6/FFFFFF?text=${encodeURIComponent(course.instructor.name.charAt(0))}`}
                    alt={course.instructor.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {course.instructor.name}
                    </h3>
                    {course.instructor.institution && (
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {course.instructor.institution}
                      </p>
                    )}
                    {course.instructor.bio && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {course.instructor.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Course Tags */}
              {course.tags && course.tags.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Course Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Course Details
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {course.duration.weeks} weeks
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Time commitment:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {course.duration.hoursPerWeek} hrs/week
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Enrolled:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {course.enrollmentCount.toLocaleString()} students
                    </span>
                  </div>
                  {course.startDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Start Date:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {new Date(course.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'syllabus' && userProgress && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Course Syllabus
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {course.duration.weeks} weeks • {course.duration.hoursPerWeek} hours per week
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {syllabus && syllabus.length > 0 ? (
                syllabus.map((week) => {
                  const isCompleted = userProgress.completedWeeks?.includes(week.week);
                  const isExpanded = expandedWeeks.has(week.week);
                  
                  return (
                    <div key={week.week} className="p-6">
                      <button
                        onClick={() => toggleWeekExpansion(week.week)}
                        className="w-full flex items-center justify-between text-left"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              week.week
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Week {week.week}: {week.title}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {week.topics.length} topics
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="mt-4 ml-12">
                          {/* Topics */}
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Topics Covered:
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                              {week.topics.map((topic, index) => (
                                <li key={index} className="text-gray-600 dark:text-gray-400 text-sm">
                                  {topic}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Resources */}
                          {week.resources && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Videos */}
                              {week.resources.videos && week.resources.videos.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                    <PlayIcon className="w-4 h-4 mr-1" />
                                    Videos
                                  </h4>
                                  <ul className="space-y-1">
                                    {week.resources.videos.map((video, index) => (
                                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                        <div className="flex items-center space-x-2">
                                          <PlayIcon className="w-4 h-4 text-blue-500" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {video.title}
                                          </span>
                                          {video.duration && (
                                            <span className="text-xs text-gray-500">({video.duration})</span>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => handleDownload(week.week, 'video', video.title, video.url)}
                                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                                        >
                                          <ArrowDownTrayIcon className="w-3 h-3" />
                                          <span>Download</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Documents */}
                              {week.resources.documents && week.resources.documents.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                    <DocumentTextIcon className="w-4 h-4 mr-1" />
                                    Documents
                                  </h4>
                                  <ul className="space-y-1">
                                    {week.resources.documents.map((doc, index) => (
                                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                        <div className="flex items-center space-x-2">
                                          <DocumentTextIcon className="w-4 h-4 text-green-500" />
                                          <span className="text-sm text-gray-700 dark:text-gray-300">
                                            {doc.title}
                                          </span>
                                          <span className="text-xs text-gray-500 uppercase">({doc.type})</span>
                                        </div>
                                        <button
                                          onClick={() => handleDownload(week.week, 'document', doc.title, doc.url)}
                                          className="flex items-center space-x-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
                                        >
                                          <ArrowDownTrayIcon className="w-3 h-3" />
                                          <span>Download</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {/* Additional Links */}
                              {week.resources.additionalLinks && week.resources.additionalLinks.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                    <LinkIcon className="w-4 h-4 mr-1" />
                                    Additional Resources
                                  </h4>
                                  <ul className="space-y-1">
                                    {week.resources.additionalLinks.map((link, index) => (
                                      <li key={index}>
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                                        >
                                          <LinkIcon className="w-3 h-3 mr-1" />
                                          {link.title}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <DocumentTextIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Syllabus will be available once you enroll in the course.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'assignments' && userProgress && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Assignments
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Complete assignments to track your progress and earn certificates
              </p>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments && assignments.length > 0 ? (
                assignments.map((assignment) => {
                  const isOverdue = new Date(assignment.dueDate) < new Date() && !assignment.submitted;
                  const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={assignment._id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {assignment.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAssignmentTypeColor(assignment.type)}`}>
                              {assignment.type}
                            </span>
                            {assignment.submitted && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full text-xs font-medium">
                                Submitted
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            {assignment.description}
                          </p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <CalendarDaysIcon className="w-4 h-4" />
                              <span>
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                {daysLeft > 0 && !assignment.submitted && (
                                  <span className={`ml-1 ${isOverdue ? 'text-red-500' : daysLeft <= 3 ? 'text-yellow-500' : ''}`}>
                                    ({daysLeft} days left)
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="ml-1 text-red-500">(Overdue)</span>
                                )}
                              </span>
                            </div>
                            <div>
                              Week {assignment.week}
                            </div>
                            <div>
                              Max Score: {assignment.maxMarks || assignment.maxScore}
                            </div>
                            {assignment.submitted && assignment.score !== null && (
                              <div className="text-green-600 dark:text-green-400 font-medium">
                                Score: {assignment.score}/{assignment.maxScore || assignment.maxMarks}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {assignment.submitted ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <CheckCircleIcon className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                          ) : (
                            <button className="btn-primary btn-sm">
                              Start Assignment
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {assignment.submitted && assignment.submittedAt && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Submitted on {new Date(assignment.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <ComputerDesktopIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No assignments available yet. Check back later!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
