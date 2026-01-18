const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    maxlength: [2000, 'Reply cannot be more than 2000 characters']
  },
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  isAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  acceptedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  acceptedAt: Date,
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const postSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Content cannot be more than 5000 characters']
  },
  type: {
    type: String,
    enum: ['question', 'discussion', 'announcement', 'help'],
    default: 'question'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  week: {
    type: Number,
    min: 0
  },
  replies: [replySchema],
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  pinnedAt: Date,
  isClosed: {
    type: Boolean,
    default: false
  },
  closedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  closedAt: Date,
  hasAcceptedAnswer: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  editedAt: Date,
  isEdited: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
postSchema.index({ courseId: 1, createdAt: -1 });
postSchema.index({ courseId: 1, isPinned: -1, lastActivity: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' });

// Virtual for total votes (upvotes - downvotes)
postSchema.virtual('voteScore').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for reply count
postSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to increment views
postSchema.methods.incrementViews = function(userId = null) {
  this.views += 1;
  
  if (userId) {
    const existingView = this.viewedBy.find(
      view => view.userId.toString() === userId.toString()
    );
    
    if (!existingView) {
      this.viewedBy.push({
        userId: userId,
        viewedAt: new Date()
      });
    }
  }
  
  return this.save();
};

// Method to add upvote
postSchema.methods.addUpvote = function(userId) {
  // Remove from downvotes if exists
  this.downvotes = this.downvotes.filter(
    id => id.toString() !== userId.toString()
  );
  
  // Add to upvotes if not already present
  if (!this.upvotes.includes(userId)) {
    this.upvotes.push(userId);
  }
  
  return this.save();
};

// Method to add downvote
postSchema.methods.addDownvote = function(userId) {
  // Remove from upvotes if exists
  this.upvotes = this.upvotes.filter(
    id => id.toString() !== userId.toString()
  );
  
  // Add to downvotes if not already present
  if (!this.downvotes.includes(userId)) {
    this.downvotes.push(userId);
  }
  
  return this.save();
};

// Method to remove vote
postSchema.methods.removeVote = function(userId) {
  this.upvotes = this.upvotes.filter(
    id => id.toString() !== userId.toString()
  );
  this.downvotes = this.downvotes.filter(
    id => id.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to add reply
postSchema.methods.addReply = function(replyData) {
  this.replies.push(replyData);
  this.lastActivity = new Date();
  
  return this.save();
};

// Method to accept an answer
postSchema.methods.acceptAnswer = function(replyId, acceptedBy) {
  // First, remove accepted status from all replies
  this.replies.forEach(reply => {
    reply.isAcceptedAnswer = false;
    reply.acceptedBy = undefined;
    reply.acceptedAt = undefined;
  });
  
  // Find and accept the specific reply
  const reply = this.replies.id(replyId);
  if (reply) {
    reply.isAcceptedAnswer = true;
    reply.acceptedBy = acceptedBy;
    reply.acceptedAt = new Date();
    this.hasAcceptedAnswer = true;
  }
  
  return this.save();
};

// Method to update last activity
postSchema.methods.updateLastActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Static method to get trending posts
postSchema.statics.getTrendingPosts = function(courseId, limit = 10) {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        courseId: new mongoose.Types.ObjectId(courseId),
        createdAt: { $gte: threeDaysAgo }
      }
    },
    {
      $addFields: {
        voteScore: { $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] },
        replyCount: { $size: '$replies' },
        engagementScore: {
          $add: [
            { $multiply: [{ $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }] }, 2] },
            { $size: '$replies' },
            { $divide: ['$views', 10] }
          ]
        }
      }
    },
    { $sort: { engagementScore: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'author'
      }
    },
    { $unwind: '$author' },
    {
      $project: {
        'author.password': 0,
        'author.email': 0
      }
    }
  ]);
};

module.exports = mongoose.model('ForumPost', postSchema);