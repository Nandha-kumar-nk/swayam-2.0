const mongoose = require('mongoose');

const assignmentScoreSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.ObjectId,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    required: true
  },
  maxScore: {
    type: Number,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  feedback: {
    type: String
  },
  graded: {
    type: Boolean,
    default: false
  },
  gradedAt: Date,
  gradedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
});

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  completedWeeks: [{
    week: Number,
    completedAt: {
      type: Date,
      default: Date.now
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0
    }
  }],
  assignmentScores: [assignmentScoreSchema],
  overallProgress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped'],
    default: 'enrolled'
  },
  completedAt: Date,
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 500
  },
  reviewedAt: Date,
  notes: [{
    content: String,
    week: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarkedContent: [{
    type: String, // URL or content identifier
    title: String,
    week: Number,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure one progress record per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Index for queries
progressSchema.index({ status: 1 });
progressSchema.index({ overallProgress: -1 });
progressSchema.index({ lastAccessedAt: -1 });

// Method to calculate overall progress
progressSchema.methods.calculateProgress = async function() {
  const Course = require('./Course');
  const course = await Course.findById(this.courseId);
  
  if (!course) return 0;
  
  const totalWeeks = course.duration.weeks;
  const totalAssignments = course.assignments.length;
  
  // Calculate week completion percentage (70% weight)
  const weekProgress = (this.completedWeeks.length / totalWeeks) * 70;
  
  // Calculate assignment completion percentage (30% weight)
  const assignmentProgress = (this.assignmentScores.length / totalAssignments) * 30;
  
  const totalProgress = Math.min(100, Math.round(weekProgress + assignmentProgress));
  
  this.overallProgress = totalProgress;
  
  // Update status based on progress
  if (totalProgress === 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (totalProgress > 0) {
    this.status = 'in_progress';
  }
  
  return this.save();
};

// Method to mark week as completed
progressSchema.methods.completeWeek = function(weekNumber, timeSpent = 0) {
  const existingWeek = this.completedWeeks.find(w => w.week === weekNumber);
  
  if (!existingWeek) {
    this.completedWeeks.push({
      week: weekNumber,
      completedAt: new Date(),
      timeSpent
    });
  } else {
    existingWeek.timeSpent += timeSpent;
  }
  
  this.lastAccessedAt = new Date();
  return this.calculateProgress();
};

// Method to add assignment score
progressSchema.methods.addAssignmentScore = function(assignmentId, score, maxScore, feedback = '') {
  const existingScore = this.assignmentScores.find(
    s => s.assignmentId.toString() === assignmentId.toString()
  );
  
  if (existingScore) {
    existingScore.score = score;
    existingScore.feedback = feedback;
    existingScore.submittedAt = new Date();
  } else {
    this.assignmentScores.push({
      assignmentId,
      score,
      maxScore,
      feedback,
      submittedAt: new Date()
    });
  }
  
  return this.calculateProgress();
};

// Method to get completion percentage for specific week
progressSchema.methods.getWeekCompletion = function(weekNumber) {
  const completedWeek = this.completedWeeks.find(w => w.week === weekNumber);
  return completedWeek ? 100 : 0;
};

// Method to get average assignment score
progressSchema.methods.getAverageScore = function() {
  if (this.assignmentScores.length === 0) return 0;
  
  const totalScore = this.assignmentScores.reduce((sum, score) => {
    return sum + (score.score / score.maxScore) * 100;
  }, 0);
  
  return Math.round(totalScore / this.assignmentScores.length);
};

module.exports = mongoose.model('Progress', progressSchema);