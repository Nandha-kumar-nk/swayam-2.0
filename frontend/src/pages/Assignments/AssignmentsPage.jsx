import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  AcademicCapIcon,
  BellIcon,
  StarIcon,
  PlayCircleIcon,
  XMarkIcon,
  BookOpenIcon,
  TrashIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
  ClockIcon as ClockSolid,
  ExclamationTriangleIcon as ExclamationTriangleSolid
} from '@heroicons/react/24/solid';

const AssignmentsPage = () => {
  const { courseId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [reminderSettings, setReminderSettings] = useState({
    email: true,
    intervals: [7, 3, 1] // days before deadline
  });
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDays, setReminderDays] = useState(1);
  const [isSettingReminder, setIsSettingReminder] = useState(false);
  const fileInputRef = useRef(null);

  // Sample assignments data - in real app this would come from API
  const sampleAssignments = [
    {
      _id: '1',
      title: 'React Components Assignment',
      description: 'Build a todo list application using React functional components and hooks. Include features for adding, editing, deleting, and marking tasks as complete.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      maxMarks: 100,
      week: 3,
      type: 'assignment',
      isActive: true,
      courseId,
      submitted: false,
      score: null,
      submittedAt: null,
      requirements: [
        'Use React functional components only',
        'Implement useState and useEffect hooks',
        'Add proper error handling',
        'Include responsive design',
        'Write clean, commented code'
      ],
      attachments: [
        {
          name: 'Assignment Instructions.pdf',
          url: '/api/assignments/1/files/instructions.pdf',
          size: '2.5 MB'
        },
        {
          name: 'Starter Code.zip',
          url: '/api/assignments/1/files/starter.zip',
          size: '1.2 MB'
        }
      ]
    },
    {
      _id: '2',
      title: 'State Management Quiz',
      description: 'Multiple choice quiz covering useState, useEffect, and component lifecycle in React.',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      maxMarks: 50,
      week: 4,
      type: 'quiz',
      isActive: true,
      courseId,
      submitted: true,
      score: 42,
      maxScore: 50,
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      requirements: [
        'Complete all 25 questions',
        'Time limit: 60 minutes',
        'No retakes allowed'
      ],
      attachments: []
    },
    {
      _id: '3',
      title: 'Final Project Proposal',
      description: 'Submit a detailed proposal for your final project including scope, timeline, and technical requirements.',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day overdue
      maxMarks: 25,
      week: 8,
      type: 'project',
      isActive: true,
      courseId,
      submitted: false,
      score: null,
      submittedAt: null,
      requirements: [
        'Minimum 3 pages',
        'Include project timeline',
        'List all technologies to be used',
        'Provide mockups or wireframes'
      ],
      attachments: [
        {
          name: 'Project Guidelines.pdf',
          url: '/api/assignments/3/files/guidelines.pdf',
          size: '1.8 MB'
        }
      ]
    }
  ];

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);

      // Check if courseId is available
      if (!courseId) {
        console.log('No course ID provided, using sample data for development');
        setAssignments(sampleAssignments);
        return;
      }

      const response = await api.get(`/courses/${courseId}/assignments`);
      if (response.data.success) {
        setAssignments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      // Use sample data for demo
      setAssignments(sampleAssignments);
    } finally {
      setLoading(false);
    }
  }, [courseId, sampleAssignments]);

  const loadReminderSettings = useCallback(async () => {
    try {
      const response = await api.get('/auth/reminder-settings');
      if (response.data.success) {
        setReminderSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error loading reminder settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
    loadReminderSettings();
  }, [courseId, fetchAssignments, loadReminderSettings]);

  const updateReminderSettings = async (newSettings) => {
    try {
      await api.put('/auth/reminder-settings', newSettings);
      setReminderSettings(newSettings);
    } catch (error) {
      console.error('Error updating reminder settings:', error);
    }
  };

  const handleSetReminder = async () => {
    if (!selectedAssignment || !reminderDays) return;
    
    setIsSettingReminder(true);
    try {
      await api.post(`/assignments/${selectedAssignment._id}/remind`, {
        daysBefore: reminderDays
      });
      
      // Show success message
      alert(`Reminder set for ${reminderDays} day${reminderDays !== 1 ? 's' : ''} before the due date.`);
      setShowReminderModal(false);
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert('Failed to set reminder. Please try again.');
    } finally {
      setIsSettingReminder(false);
    }
  };
  
  const openReminderModal = (assignment) => {
    setSelectedAssignment(assignment);
    // Calculate days until due date
    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    // Set default reminder to 1 day or less if due soon
    setReminderDays(Math.min(1, daysUntilDue));
    setShowReminderModal(true);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setSubmissionFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitAssignment = async () => {
    if (!selectedAssignment) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', selectedAssignment._id);
      formData.append('textSubmission', submissionText);
      
      submissionFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      const response = await api.post(`/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update assignments list
        setAssignments(prev => prev.map(assignment => 
          assignment._id === selectedAssignment._id 
            ? { ...assignment, submitted: true, submittedAt: new Date() }
            : assignment
        ));
        
        setShowSubmissionModal(false);
        setSelectedAssignment(null);
        setSubmissionFiles([]);
        setSubmissionText('');
        
        alert('Assignment submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusInfo = (assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate && !assignment.submitted;
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    if (assignment.submitted) {
      return {
        status: 'submitted',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        icon: CheckCircleSolid,
        text: `Submitted ${assignment.submittedAt ? new Date(assignment.submittedAt).toLocaleDateString() : ''}`
      };
    } else if (isOverdue) {
      return {
        status: 'overdue',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        icon: ExclamationTriangleSolid,
        text: `Overdue by ${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''}`
      };
    } else if (daysUntilDue <= 3) {
      return {
        status: 'urgent',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        icon: ClockSolid,
        text: `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`
      };
    } else {
      return {
        status: 'pending',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        icon: ClockIcon,
        text: `Due in ${daysUntilDue} days`
      };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'quiz':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'project':
        return <FolderOpenIcon className="w-5 h-5" />;
      case 'exam':
        return <DocumentTextIcon className="w-5 h-5" />;
      default:
        return <BookOpenIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'quiz':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'project':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100';
      case 'exam':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    }
  };

  const filteredAssignments = assignments
    .filter(assignment => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'pending') return !assignment.submitted;
      if (filterStatus === 'submitted') return assignment.submitted;
      if (filterStatus === 'overdue') {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        return now > dueDate && !assignment.submitted;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'status') {
        if (a.submitted === b.submitted) return 0;
        return a.submitted ? 1 : -1;
      }
      return 0;
    });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Assignments
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your assignments, submissions, and deadlines
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowReminderSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span>Reminders</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input"
                >
                  <option value="all">All Assignments</option>
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                >
                  <option value="dueDate">Due Date</option>
                  <option value="title">Title</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>
            
            {/* Progress Summary */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {assignments.filter(a => a.submitted).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Submitted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {assignments.filter(a => {
                    const now = new Date();
                    const dueDate = new Date(a.dueDate);
                    const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    return !a.submitted && daysLeft <= 3 && daysLeft > 0;
                  }).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Due Soon</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {assignments.filter(a => {
                    const now = new Date();
                    const dueDate = new Date(a.dueDate);
                    return now > dueDate && !a.submitted;
                  }).length}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Overdue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => {
            const statusInfo = getStatusInfo(assignment);
            
            return (
              <div
                key={assignment._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${statusInfo.borderColor} hover:shadow-lg transition-shadow`}
              >
                <div className="p-6">
                  {/* Assignment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(assignment.type)}`}>
                          {getTypeIcon(assignment.type)}
                          <span className="ml-1 capitalize">{assignment.type}</span>
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Week {assignment.week}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {assignment.maxMarks} points
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {assignment.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {assignment.description}
                      </p>
                      
                      {/* Requirements */}
                      {assignment.requirements && assignment.requirements.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Requirements:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {assignment.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Status Badge */}
                      <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${statusInfo.bgColor}`}>
                        <statusInfo.icon className={`w-5 h-5 ${statusInfo.color}`} />
                        <span className={`text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </div>
                      
                      {/* Reminder Button - Only show for pending assignments */}
                      {!assignment.submitted && statusInfo.status !== 'overdue' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReminderModal(assignment);
                          }}
                          className="flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Set Reminder"
                        >
                          <BellIcon className="w-4 h-4" />
                          <span>Remind Me</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Due Date and Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <CalendarDaysIcon className="w-4 h-4" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      
                      {assignment.submitted && assignment.score !== null && (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <StarIcon className="w-4 h-4" />
                          <span>Score: {assignment.score}/{assignment.maxScore || assignment.maxMarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Attachments */}
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                        <PaperClipIcon className="w-4 h-4 mr-1" />
                        Attachments:
                      </h4>
                      <div className="space-y-2">
                        {assignment.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <a 
                              href={attachment.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                              <span>{attachment.name}</span>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {!assignment.submitted ? (
                        <button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setShowSubmissionModal(true);
                          }}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4" />
                          <span>Submit Assignment</span>
                        </button>
                      ) : (
                        <button className="btn-outline flex items-center space-x-2">
                          <EyeIcon className="w-4 h-4" />
                          <span>View Submission</span>
                        </button>
                      )}
                    </div>
                    
                    {assignment.type === 'quiz' && !assignment.submitted && (
                      <button className="btn-secondary flex items-center space-x-2">
                        <PlayCircleIcon className="w-4 h-4" />
                        <span>Start Quiz</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAssignments.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <BookOpenIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No assignments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filterStatus === 'all' 
                ? 'No assignments available for this course yet.'
                : `No ${filterStatus} assignments found. Try changing your filter.`
              }
            </p>
          </div>
        )}

        {/* Submission Modal */}
        {showSubmissionModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Submit Assignment
                  </h2>
                  <button
                    onClick={() => setShowSubmissionModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedAssignment.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Text Submission */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Text Submission (Optional)
                  </label>
                  <textarea
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your text submission here..."
                    rows={6}
                    className="form-input"
                  />
                </div>
                
                {/* File Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File Attachments
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <ArrowUpTrayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Drag and drop files here, or
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-outline"
                    >
                      Browse Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  {submissionFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {submissionFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowSubmissionModal(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitAssignment}
                    disabled={submitting || (submissionFiles.length === 0 && !submissionText.trim())}
                    className="btn-primary disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      'Submit Assignment'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reminder Settings Modal */}
        {showReminderSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Reminder Settings
                  </h2>
                  <button
                    onClick={() => setShowReminderSettings(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Reminders
                    </label>
                    <input
                      type="checkbox"
                      checked={reminderSettings.email}
                      onChange={(e) => setReminderSettings(prev => ({ ...prev, email: e.target.checked }))}
                      className="form-checkbox"
                    />
                  </div>
                  
                  {reminderSettings.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Send reminders:
                      </label>
                      <div className="space-y-2">
                        {[7, 3, 1].map(days => (
                          <label key={days} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reminderSettings.intervals.includes(days)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReminderSettings(prev => ({
                                    ...prev,
                                    intervals: [...prev.intervals, days].sort((a, b) => b - a)
                                  }));
                                } else {
                                  setReminderSettings(prev => ({
                                    ...prev,
                                    intervals: prev.intervals.filter(d => d !== days)
                                  }));
                                }
                              }}
                              className="form-checkbox mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {days} day{days > 1 ? 's' : ''} before deadline
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowReminderSettings(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateReminderSettings(reminderSettings);
                      setShowReminderSettings(false);
                    }}
                    className="btn-primary"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentsPage;
