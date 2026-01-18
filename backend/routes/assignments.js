const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailScheduler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/assignments');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/javascript',
    'text/html',
    'text/css'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per submission
  }
});

// @desc    Get user's assignments
// @route   GET /api/assignments
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const progresses = await Progress.find({ userId: req.user.id })
      .populate({
        path: 'courseId',
        select: 'title assignments',
        populate: {
          path: 'assignments'
        }
      });

    const assignments = [];
    
    progresses.forEach(progress => {
      if (progress.courseId && progress.courseId.assignments) {
        progress.courseId.assignments.forEach(assignment => {
          const submission = progress.assignmentScores.find(
            score => score.assignmentId.toString() === assignment._id.toString()
          );
          
          assignments.push({
            ...assignment.toObject(),
            courseTitle: progress.courseId.title,
            courseId: progress.courseId._id,
            submitted: !!submission,
            score: submission ? submission.score : null,
            submittedAt: submission ? submission.submittedAt : null
          });
        });
      }
    });

    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit assignment with files
// @route   POST /api/assignments/:id/submit
// @access  Private
router.post('/:id/submit', protect, upload.array('files', 5), async (req, res, next) => {
  try {
    const { textSubmission, courseId } = req.body;
    const assignmentId = req.params.id;
    
    // Find the course and assignment
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const assignment = course.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check if assignment is still active and not past due
    const now = new Date();
    if (now > assignment.dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }
    
    const progress = await Progress.findOne({
      userId: req.user.id,
      courseId: courseId
    }).populate('userId');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Course enrollment not found'
      });
    }
    
    // Check if already submitted
    const existingSubmission = progress.assignmentScores.find(
      score => score.assignmentId.toString() === assignmentId
    );
    
    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }
    
    // Process uploaded files
    const submissionFiles = req.files ? req.files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    })) : [];
    
    // Create submission object
    const submission = {
      assignmentId: assignmentId,
      textSubmission: textSubmission || '',
      files: submissionFiles,
      submittedAt: new Date(),
      status: 'submitted',
      score: null, // Will be graded later
      maxScore: assignment.maxMarks,
      feedback: ''
    };
    
    // Add to progress
    progress.assignmentScores.push(submission);
    await progress.save();
    
    // Send confirmation email
    await sendSubmissionConfirmationEmail(progress.userId, course, assignment, submission);
    
    // Emit socket event for real-time updates
    const io = req.app.get('socketio');
    if (io) {
      io.to(`course-staff-${courseId}`).emit('assignment-submitted', {
        assignmentId,
        studentName: progress.userId.name,
        courseName: course.title,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submissionId: submission._id,
        submittedAt: submission.submittedAt,
        filesCount: submissionFiles.length
      }
    });
  } catch (error) {
    // Clean up uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(err => 
          console.error('Error deleting file:', err)
        );
      });
    }
    next(error);
  }
});

// @desc    Get assignment submission details
// @route   GET /api/assignments/:id/submission
// @access  Private
router.get('/:id/submission', protect, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    
    const progress = await Progress.findOne({
      userId: req.user.id
    }).populate('courseId', 'title assignments');
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Course enrollment not found'
      });
    }
    
    const submission = progress.assignmentScores.find(
      score => score.assignmentId.toString() === assignmentId
    );
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: submission
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Download assignment submission file
// @route   GET /api/assignments/submissions/files/:filename
// @access  Private
router.get('/submissions/files/:filename', protect, async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/assignments', filename);
    
    // Verify user has access to this file (check if it's their submission)
    const progress = await Progress.findOne({
      userId: req.user.id,
      'assignmentScores.files.filename': filename
    });
    
    if (!progress) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this file'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Find original filename
    const submission = progress.assignmentScores.find(score => 
      score.files.some(file => file.filename === filename)
    );
    
    const fileInfo = submission.files.find(file => file.filename === filename);
    const originalName = fileInfo ? fileInfo.originalName : filename;
    
    // Set headers and send file
    res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// @desc    Get upcoming assignment deadlines for reminders
// @route   GET /api/assignments/upcoming-deadlines
// @access  Private
router.get('/upcoming-deadlines', protect, async (req, res, next) => {
  try {
    const { days = 7 } = req.query; // Default to 7 days ahead
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));
    
    const progresses = await Progress.find({ userId: req.user.id })
      .populate({
        path: 'courseId',
        select: 'title assignments',
        populate: {
          path: 'assignments'
        }
      });
    
    const upcomingAssignments = [];
    
    progresses.forEach(progress => {
      if (progress.courseId && progress.courseId.assignments) {
        progress.courseId.assignments.forEach(assignment => {
          const dueDate = new Date(assignment.dueDate);
          const isSubmitted = progress.assignmentScores.some(
            score => score.assignmentId.toString() === assignment._id.toString()
          );
          
          if (dueDate >= new Date() && dueDate <= futureDate && !isSubmitted) {
            const daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
            
            upcomingAssignments.push({
              assignmentId: assignment._id,
              title: assignment.title,
              courseTitle: progress.courseId.title,
              courseId: progress.courseId._id,
              dueDate: assignment.dueDate,
              daysLeft,
              type: assignment.type,
              maxMarks: assignment.maxMarks
            });
          }
        });
      }
    });
    
    // Sort by due date
    upcomingAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    res.status(200).json({
      success: true,
      data: upcomingAssignments
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Trigger assignment reminder email (for testing)
// @route   POST /api/assignments/:id/remind
// @access  Private
router.post('/:id/remind', protect, async (req, res, next) => {
  try {
    const assignmentId = req.params.id;
    
    const progress = await Progress.findOne({
      userId: req.user.id
    }).populate('userId courseId');
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Course enrollment not found'
      });
    }
    
    const assignment = progress.courseId.assignments.id(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }
    
    // Check if already submitted
    const isSubmitted = progress.assignmentScores.some(
      score => score.assignmentId.toString() === assignmentId
    );
    
    if (isSubmitted) {
      return res.status(400).json({
        success: false,
        message: 'Assignment already submitted'
      });
    }
    
    const daysLeft = Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return res.status(400).json({
        success: false,
        message: 'Assignment deadline has passed'
      });
    }
    
    // Send reminder email
    await sendAssignmentReminderEmail(progress.userId, progress.courseId, assignment, daysLeft);
    
    res.status(200).json({
      success: true,
      message: 'Reminder sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to send submission confirmation email
const sendSubmissionConfirmationEmail = async (user, course, assignment, submission) => {
  const subject = `Assignment Submitted: ${assignment.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignment Submission Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .success { color: #27ae60; font-weight: bold; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Submission Confirmed!</h1>
                <p>SWAYAM 2.0 Learning Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p class="success">Your assignment has been successfully submitted!</p>
                
                <div class="assignment-info">
                    <h3>📝 ${assignment.title}</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Submitted:</strong> ${submission.submittedAt.toLocaleString()}</p>
                    <p><strong>Files Uploaded:</strong> ${submission.files.length}</p>
                    ${submission.textSubmission ? `<p><strong>Text Submission:</strong> Yes</p>` : ''}
                </div>
                
                <p>Your submission has been recorded and will be reviewed by your instructor. You'll receive notification once it's graded.</p>
                
                <a href="${process.env.FRONTEND_URL}/courses/${course._id}/assignments" class="button">
                    View Assignment →
                </a>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>Keep up the great work! 🎓</p>
                    <p>The SWAYAM 2.0 Team</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
  
  try {
    await sendEmail(user.email, subject, html);
    console.log(`✅ Submission confirmation email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send submission confirmation email:`, error);
  }
};

// Helper function to send assignment reminder email
const sendAssignmentReminderEmail = async (user, course, assignment, daysLeft) => {
  const urgencyText = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  const subject = `Assignment Due ${daysLeft === 1 ? 'Tomorrow' : `in ${daysLeft} Days`}: ${assignment.title}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Assignment Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f39c12 0%, #e74c3c 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 10px 10px; }
            .assignment-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
            .urgent { color: #e74c3c; font-weight: bold; font-size: 18px; }
            .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Assignment Reminder</h1>
                <p>Don't Miss Your Deadline!</p>
            </div>
            <div class="content">
                <h2>Hello ${user.name}! 👋</h2>
                <p class="urgent">Your assignment is due ${urgencyText}!</p>
                
                <div class="assignment-info">
                    <h3>📝 ${assignment.title}</h3>
                    <p><strong>Course:</strong> ${course.title}</p>
                    <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
                    <p><strong>Type:</strong> ${assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}</p>
                    <p><strong>Points:</strong> ${assignment.maxMarks}</p>
                </div>
                
                <p>Don't wait until the last minute! Submit your assignment early to avoid any technical issues.</p>
                
                <a href="${process.env.FRONTEND_URL}/courses/${course._id}/assignments" class="button">
                    Submit Assignment Now →
                </a>
                
                <div style="text-align: center; margin-top: 30px; color: #666; font-size: 14px;">
                    <p>You've got this! 💪</p>
                    <p>The SWAYAM 2.0 Team</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
  
  try {
    await sendEmail(user.email, subject, html);
    console.log(`✅ Assignment reminder email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ Failed to send assignment reminder email:`, error);
  }
};

module.exports = router;