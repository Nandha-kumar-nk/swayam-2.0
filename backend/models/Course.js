const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  week: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  topics: [{
    type: String,
    required: true
  }],
  resources: {
    videos: [{
      title: String,
      url: String,
      duration: String
    }],
    documents: [{
      title: String,
      url: String,
      type: {
        type: String,
        enum: ['pdf', 'ppt', 'doc', 'txt'],
        default: 'pdf'
      }
    }],
    additionalLinks: [{
      title: String,
      url: String
    }]
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  maxMarks: {
    type: Number,
    default: 100
  },
  week: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['quiz', 'assignment', 'project', 'exam'],
    default: 'assignment'
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a course title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a course description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  instructor: {
    name: {
      type: String,
      required: true
    },
    bio: String,
    profilePicture: String,
    institution: String
  },
  duration: {
    weeks: {
      type: Number,
      required: true,
      min: 1,
      max: 52
    },
    hoursPerWeek: {
      type: Number,
      default: 5
    }
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Computer Science',
      'Engineering',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Economics',
      'Management',
      'Humanities',
      'Arts',
      'Languages',
      'Social Sciences'
    ]
  },
  tags: [{
    type: String,
    trim: true
  }],
  syllabus: [syllabusSchema],
  assignments: [assignmentSchema],
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String,
    required: true
  }],
  enrollmentCount: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  thumbnail: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  enrollmentDeadline: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better search performance
courseSchema.index({ title: 'text', description: 'text', 'instructor.name': 'text' });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ 'rating.average': -1 });

// Virtual for total duration in hours
courseSchema.virtual('totalHours').get(function() {
  return this.duration.weeks * this.duration.hoursPerWeek;
});

// Method to update enrollment count
courseSchema.methods.updateEnrollmentCount = async function() {
  const User = require('./User');
  const count = await User.countDocuments({ enrolledCourses: this._id });
  this.enrollmentCount = count;
  return this.save();
};

// Method to calculate average rating
courseSchema.methods.updateRating = async function() {
  const Progress = require('./Progress');
  const ratings = await Progress.find({ 
    courseId: this._id, 
    rating: { $exists: true } 
  }).select('rating');
  
  if (ratings.length > 0) {
    const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    this.rating.average = Math.round(average * 10) / 10;
    this.rating.count = ratings.length;
  }
  
  return this.save();
};

module.exports = mongoose.model('Course', courseSchema);