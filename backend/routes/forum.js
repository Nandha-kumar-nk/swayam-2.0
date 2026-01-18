const express = require('express');
const ForumPost = require('../models/Forum');
const User = require('../models/User');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const idMapper = require('../middleware/idMapper');
const getGeminiResponse = require('../utils/gemini'); // ✅ our helper

const router = express.Router();

/* -----------------------------------------------------------
   SIMPLE FALLBACK FORUM DATA (if Mongo fails)
----------------------------------------------------------- */
const fallbackForumPosts = [
  {
    _id: 1,
    id: 1,
    courseId: 1,
    userId: {
      _id: 1,
      name: "John Doe",
      profilePicture:
        "https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=FFFFFF",
    },
    title: "Question about HTML semantics",
    content: "What's the difference between div and section elements?",
    type: "question",
    votes: 5,
    replies: [],
    author: {
      id: 1,
      name: "John Doe",
      avatar:
        "https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=FFFFFF",
      reputation: 85,
      badge: "Active Learner",
    },
    isPinned: false,
    lastActivity: new Date(),
    createdAt: new Date(),
    upvotes: 5,
    downvotes: 1,
    views: 234,
    tags: ["html", "semantics", "web-development"],
  },
];

/* -----------------------------------------------------------
   IN-MEMORY AI TRAINING / ANALYTICS
----------------------------------------------------------- */
const aiTrainingData = {
  courseContent: {},      // courseId -> [{ content, feedback, ... }]
  userInteractions: {},   // userId -> [{ courseId, type, ... }]
  conversationHistory: {},// userId -> [{ courseId, userMessage, assistantResponse, ... }]
};

function storeConversation(userId, courseId, userMessage, assistantResponse) {
  if (!aiTrainingData.conversationHistory[userId]) {
    aiTrainingData.conversationHistory[userId] = [];
  }

  aiTrainingData.conversationHistory[userId].push({
    courseId,
    userMessage,
    assistantResponse,
    timestamp: new Date(),
  });

  if (aiTrainingData.conversationHistory[userId].length > 50) {
    aiTrainingData.conversationHistory[userId] =
      aiTrainingData.conversationHistory[userId].slice(-50);
  }
}

/* -----------------------------------------------------------
   AI CHAT (USED BY ChatbotWidget.jsx)
   POST /api/forum/:courseId/ai-chat
----------------------------------------------------------- */
router.post('/:courseId/ai-chat', protect, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    // Get course context (title)
    let courseContext = null;
    try {
      const course = await Course.findById(req.params.courseId);
      courseContext = course ? course.title : null;
    } catch (error) {
      // Fallback if DB not available
      const courseId = parseInt(req.params.courseId) || req.params.courseId;
      const fallbackCourses = [
        { _id: 1, title: "Introduction to Web Development" },
        { _id: 2, title: "Data Science with Python" },
        { _id: 3, title: "Digital Marketing Fundamentals" },
      ];
      const course = fallbackCourses.find((c) => c._id == courseId);
      courseContext = course ? course.title : "General";
    }

    const aiResponse = await getGeminiResponse(
      message.trim(),
      courseContext,
      conversationHistory
    );

    // Save to in-memory analytics
    storeConversation(req.user.id, req.params.courseId, message.trim(), aiResponse);

    console.log(
      `🤖 Gemini AI Chat | User: ${req.user.id} | Course: ${req.params.courseId} | Query: ${message.slice(
        0,
        60
      )}...`
    );

    // Optional: if you have socket.io and want to log that AI chat started
    const io = req.app.get('socketio');
    if (io) {
      io.emit('ai-chat-start', {
        userId: req.user.id,
        courseId: req.params.courseId,
        userName: req.user.name || 'Student',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date(),
        confidence: 95,
        type: "llm-response",
      },
    });
  } catch (error) {
    console.error("AI Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "AI chat failed. Please try again.",
    });
  }
});

/* -----------------------------------------------------------
   AI TRAINING
   POST /api/forum/ai-training
----------------------------------------------------------- */
router.post('/ai-training', protect, async (req, res, next) => {
  try {
    const { courseId, trainingData, feedback } = req.body;

    if (!courseId || !trainingData) {
      return res.status(400).json({
        success: false,
        message: "Course ID and training data are required",
      });
    }

    if (!aiTrainingData.courseContent[courseId]) {
      aiTrainingData.courseContent[courseId] = [];
    }

    aiTrainingData.courseContent[courseId].push({
      content: trainingData,
      feedback: feedback || "positive",
      timestamp: new Date(),
      userId: req.user.id,
    });

    if (!aiTrainingData.userInteractions[req.user.id]) {
      aiTrainingData.userInteractions[req.user.id] = [];
    }

    aiTrainingData.userInteractions[req.user.id].push({
      courseId,
      type: "training",
      data: trainingData,
      feedback,
      timestamp: new Date(),
    });

    res.status(200).json({
      success: true,
      message: "Training data stored successfully",
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   AI ANALYTICS
   GET /api/forum/ai-analytics
----------------------------------------------------------- */
router.get('/ai-analytics', protect, async (req, res, next) => {
  try {
    const { courseId } = req.query;

    const analytics = {
      totalConversations: Object.values(aiTrainingData.conversationHistory).reduce(
        (sum, convos) => sum + convos.length,
        0
      ),
      totalTrainingData: Object.values(aiTrainingData.courseContent).reduce(
        (sum, data) => sum + data.length,
        0
      ),
      usersTrained: Object.keys(aiTrainingData.userInteractions).length,
      courseSpecificData: courseId
        ? (aiTrainingData.courseContent[courseId] || []).length
        : null,
    };

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   GET forum posts for a course
   GET /api/forum/:courseId
----------------------------------------------------------- */
router.get('/:courseId', idMapper('courseId'), protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let posts, total;

    try {
      posts = await ForumPost.find({ courseId: req.params.courseId })
        .populate('userId', 'name profilePicture')
        .populate('replies.userId', 'name profilePicture')
        .sort({ isPinned: -1, lastActivity: -1 })
        .skip(skip)
        .limit(limit);

      total = await ForumPost.countDocuments({ courseId: req.params.courseId });
    } catch (error) {
      console.log('📚 Using fallback forum data');
      const courseId = parseInt(req.params.courseId) || req.params.courseId;

      const coursePosts = fallbackForumPosts.filter(
        (post) => post.courseId == courseId
      );

      coursePosts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity) - new Date(a.lastActivity);
      });

      total = coursePosts.length;
      posts = coursePosts.slice(skip, skip + limit);
    }

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   CREATE new forum post
   POST /api/forum/:courseId
----------------------------------------------------------- */
router.post('/:courseId', idMapper('courseId'), protect, async (req, res, next) => {
  try {
    const postData = {
      ...req.body,
      courseId: req.params.courseId,
      userId: req.user.id,
    };

    const post = await ForumPost.create(postData);
    await post.populate('userId', 'name profilePicture');

    const io = req.app.get('socketio');
    io.to(`forum-${req.params.courseId}`).emit('forum-post-added', post);

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   REPLY to a post
   POST /api/forum/posts/:postId/reply
----------------------------------------------------------- */
router.post('/posts/:postId/reply', protect, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const replyData = {
      userId: req.user.id,
      content: req.body.content,
    };

    await post.addReply(replyData);
    await post.populate('replies.userId', 'name profilePicture');

    const io = req.app.get('socketio');
    io.to(`forum-${post.courseId}`).emit('forum-reply-added', {
      postId: post._id,
      reply: replyData,
    });

    res.status(201).json({
      success: true,
      message: "Reply added successfully",
      data: post,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   VOTE on a post
   PUT /api/forum/posts/:postId/vote
----------------------------------------------------------- */
router.put('/posts/:postId/vote', protect, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    const { voteType } = req.body; // 'up', 'down', 'remove'

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (voteType === "up") {
      await post.addUpvote(req.user.id);
    } else if (voteType === "down") {
      await post.addDownvote(req.user.id);
    } else if (voteType === "remove") {
      await post.removeVote(req.user.id);
    }

    res.status(200).json({
      success: true,
      message: "Vote updated successfully",
      data: {
        upvotes: post.upvotes.length,
        downvotes: post.downvotes.length,
        voteScore: post.voteScore,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   LIVE CHAT: get messages
   GET /api/forum/:courseId/live-chat
----------------------------------------------------------- */
router.get('/:courseId/live-chat', protect, async (req, res, next) => {
  try {
    let recentActivity;

    try {
      recentActivity = await ForumPost.find({
        courseId: req.params.courseId,
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      })
        .populate('userId', 'name profilePicture')
        .sort({ createdAt: -1 })
        .limit(50);
    } catch (error) {
      console.log('📚 Using fallback live chat data');
      const courseId = parseInt(req.params.courseId) || req.params.courseId;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      recentActivity = fallbackForumPosts
        .filter(
          (post) =>
            post.courseId == courseId &&
            new Date(post.createdAt) >= oneDayAgo
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 50);
    }

    res.status(200).json({
      success: true,
      data: {
        messages: recentActivity.map((post) => ({
          id: post._id,
          user: {
            id: post.userId._id || post.userId.id,
            name: post.userId.name,
            avatar:
              post.userId.profilePicture ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                post.userId.name
              )}&background=3B82F6&color=FFFFFF`,
          },
          message: post.title,
          timestamp: post.createdAt,
          type: "forum-post",
        })),
        onlineUsers: [],
      },
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   LIVE CHAT: send message
   POST /api/forum/:courseId/live-chat
----------------------------------------------------------- */
router.post('/:courseId/live-chat', protect, async (req, res, next) => {
  try {
    const { message, type = "text" } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const user = await User.findById(req.user.id);

    const chatMessage = {
      id: new Date().getTime().toString(),
      user: {
        id: user._id,
        name: user.name,
        avatar:
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
          )}&background=3B82F6&color=FFFFFF`,
      },
      message: message.trim(),
      timestamp: new Date(),
      type,
    };

    const io = req.app.get('socketio');
    io.to(`chat-${req.params.courseId}`).emit('new-chat-message', chatMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chatMessage,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   START P2P CHAT
   POST /api/forum/p2p-chat/start
----------------------------------------------------------- */
router.post('/p2p-chat/start', protect, async (req, res, next) => {
  try {
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required",
      });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const sender = await User.findById(req.user.id);

    const chatRoomId = [req.user.id, recipientId].sort().join('-');

    const chatSession = {
      roomId: chatRoomId,
      participants: [
        {
          id: sender._id,
          name: sender.name,
          avatar:
            sender.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              sender.name
            )}&background=3B82F6&color=FFFFFF`,
        },
        {
          id: recipient._id,
          name: recipient.name,
          avatar:
            recipient.profilePicture ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              recipient.name
            )}&background=10B981&color=FFFFFF`,
        },
      ],
      createdAt: new Date(),
    };

    const io = req.app.get('socketio');
    io.to(`user-${recipientId}`).emit('p2p-chat-request', {
      ...chatSession,
      message,
      from: sender.name,
    });

    res.status(201).json({
      success: true,
      message: "Chat session started",
      data: chatSession,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   SEND P2P MESSAGE
   POST /api/forum/p2p-chat/:roomId/message
----------------------------------------------------------- */
router.post('/p2p-chat/:roomId/message', protect, async (req, res, next) => {
  try {
    const { message, type = "text" } = req.body;
    const { roomId } = req.params;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!roomId.includes(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat room",
      });
    }

    const user = await User.findById(req.user.id);

    const chatMessage = {
      id: new Date().getTime().toString(),
      roomId,
      user: {
        id: user._id,
        name: user.name,
        avatar:
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
          )}&background=3B82F6&color=FFFFFF`,
      },
      message: message.trim(),
      timestamp: new Date(),
      type,
    };

    const io = req.app.get('socketio');
    io.to(`p2p-${roomId}`).emit('p2p-message', chatMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: chatMessage,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   ONLINE USERS IN A COURSE
   GET /api/forum/:courseId/online-users
----------------------------------------------------------- */
router.get('/:courseId/online-users', protect, async (req, res, next) => {
  try {
    const enrolledUsers = await User.find({
      enrolledCourses: req.params.courseId,
    }).select('name profilePicture lastSeen');

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUsers = enrolledUsers
      .filter(
        (user) => user.lastSeen && user.lastSeen >= fiveMinutesAgo
      )
      .map((user) => ({
        id: user._id,
        name: user.name,
        avatar:
          user.profilePicture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name
          )}&background=3B82F6&color=FFFFFF`,
        status: "online",
      }));

    res.status(200).json({
      success: true,
      data: {
        onlineUsers,
        totalOnline: onlineUsers.length,
        totalEnrolled: enrolledUsers.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------------------------------------
   MARK POST AS HELPFUL
   PUT /api/forum/posts/:postId/mark-helpful
----------------------------------------------------------- */
router.put('/posts/:postId/mark-helpful', protect, async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.aiSuggestion) {
      post.aiSuggestion.helpful = true;
      post.aiSuggestion.helpfulMarkedBy = req.user.id;
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Marked as helpful",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
