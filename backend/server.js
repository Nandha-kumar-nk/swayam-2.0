const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const forumRoutes = require('./routes/forum');
const assignmentRoutes = require('./routes/assignments');
const reminderRoutes = require('./routes/reminders');
const calendarRoutes = require('./routes/calendar');
const debugRoutes = require('./routes/debug');
const emailTestRoutes = require('./routes/emailTest');
const chatRoutes = require('./routes/chatRoute');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

// Import utilities
const emailScheduler = require('./utils/emailScheduler');

const app = express();
const server = http.createServer(app);

// Socket.io setup for real-time features
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://127.0.0.1:54654',
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/localhost:\d+$/
    ],
    methods: ['GET', 'POST']
  }
});

// Make io accessible throughout the app
app.set('socketio', io);

// CORS configuration
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3003',
      'http://127.0.0.1:3003',
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/localhost:\d+$/
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 1000, // Increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Body parsing middleware (with limit)
app.use(express.json({ limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

// Database connection
mongoose
  .connect(
    process.env.MONGODB_URI ||
      'mongodb+srv://kumar4112005:Nandy19@gopal.dibirkd.mongodb.net/?retryWrites=true&w=majority&appName=Gopal',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // Start email scheduler after DB connection
    emailScheduler.startScheduler();
  })
  .catch((error) => {
    console.warn('⚠️  MongoDB connection failed, using fallback mode:', error.message);
    console.log('📝 User data will be stored in memory (not persistent)');
    // Continue without MongoDB - fallback mode enabled
    // Start email scheduler even in fallback mode
    emailScheduler.startScheduler();
  });

// API root endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'SWAYAM 2.0 API',
    version: '2.0',
    description:
      'Educational platform API with course management, forums, assignments, and more',
    endpoints: {
      auth: '/api/auth',
      courses: '/api/courses',
      progress: '/api/progress',
      forum: '/api/forum',
      assignments: '/api/assignments',
      reminders: '/api/reminders',
      calendar: '/api/calendar',
      debug: '/api/debug',
      emailTest: '/api/email-test',
      health: '/api/health'
    },
    documentation: '/api/debug',
    status: 'running'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/email-test', emailTestRoutes);
app.use('/api', chatRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'SWAYAM 2.0 API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Favicon endpoint
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content response for favicon
});

// Socket.io connection handling
let onlineUsers = new Map(); // Store online users

io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User authentication and tracking
  socket.on('authenticate', (data) => {
    const { userId, name, avatar } = data;
    socket.userId = userId;
    socket.userName = name;

    onlineUsers.set(userId, {
      socketId: socket.id,
      name,
      avatar,
      lastSeen: new Date()
    });

    console.log(`✅ User authenticated: ${name} (${userId})`);

    // Join user-specific room for notifications
    socket.join(`user-${userId}`);

    // Notify all courses about user coming online
    socket.broadcast.emit('user-online', { userId, name, avatar });
  });

  // Join course-specific forum rooms
  socket.on('join-course-forum', (courseId) => {
    socket.join(`forum-${courseId}`);
    console.log(`User ${socket.id} joined forum for course ${courseId}`);

    // Send current online users for this course
    const courseOnlineUsers = Array.from(onlineUsers.values()).filter(
      (user) => user.socketId !== socket.id
    );
    socket.emit('course-online-users', courseOnlineUsers);
  });

  // Join course-specific live chat rooms
  socket.on('join-live-chat', (courseId) => {
    socket.join(`chat-${courseId}`);
    socket.courseId = courseId;
    console.log(`User ${socket.id} joined live chat for course ${courseId}`);

    // Notify others in the chat room
    if (socket.userId) {
      socket.to(`chat-${courseId}`).emit('user-joined-chat', {
        userId: socket.userId,
        name: socket.userName,
        timestamp: new Date()
      });
    }
  });

  // Handle live chat messages
  socket.on('send-chat-message', (data) => {
    const { courseId, message, type = 'text' } = data;

    const initialLetter = (socket.userName || 'U').charAt(0);

    const chatMessage = {
      id: new Date().getTime().toString(),
      user: {
        id: socket.userId,
        name: socket.userName,
        avatar:
          onlineUsers.get(socket.userId)?.avatar ||
          `https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=${encodeURIComponent(
            initialLetter
          )}`
      },
      message,
      timestamp: new Date(),
      type
    };

    // Broadcast to all users in the chat room
    io.to(`chat-${courseId}`).emit('new-chat-message', chatMessage);
    console.log(`💬 Chat message from ${socket.userName} in course ${courseId}`);
  });

  // Handle P2P chat room joining
  socket.on('join-p2p-chat', (roomId) => {
    socket.join(`p2p-${roomId}`);
    socket.p2pRoom = roomId;
    console.log(`User ${socket.id} joined P2P chat room ${roomId}`);

    // Notify the other participant
    socket.to(`p2p-${roomId}`).emit('peer-joined', {
      userId: socket.userId,
      name: socket.userName,
      timestamp: new Date()
    });
  });

  // Handle P2P chat messages
  socket.on('send-p2p-message', (data) => {
    const { roomId, message, type = 'text' } = data;

    const initialLetter = (socket.userName || 'U').charAt(0);

    const chatMessage = {
      id: new Date().getTime().toString(),
      roomId,
      user: {
        id: socket.userId,
        name: socket.userName,
        avatar:
          onlineUsers.get(socket.userId)?.avatar ||
          `https://via.placeholder.com/100x100/3B82F6/FFFFFF?text=${encodeURIComponent(
            initialLetter
          )}`
      },
      message,
      timestamp: new Date(),
      type
    };

    // Send to both participants
    io.to(`p2p-${roomId}`).emit('p2p-message', chatMessage);
    console.log(`👥 P2P message from ${socket.userName} in room ${roomId}`);
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    const { roomId, type = 'course' } = data;
    const roomName = type === 'p2p' ? `p2p-${roomId}` : `chat-${roomId}`;

    socket.to(roomName).emit('user-typing', {
      userId: socket.userId,
      name: socket.userName,
      type: 'start'
    });
  });

  socket.on('typing-stop', (data) => {
    const { roomId, type = 'course' } = data;
    const roomName = type === 'p2p' ? `p2p-${roomId}` : `chat-${roomId}`;

    socket.to(roomName).emit('user-typing', {
      userId: socket.userId,
      name: socket.userName,
      type: 'stop'
    });
  });

  // Handle AI chat sessions (for logging/analytics)
  socket.on('ai-chat-start', (data) => {
    console.log(`🤖 AI chat started by ${socket.userName} in course ${data.courseId}`);
  });

  // Handle new forum posts
  socket.on('new-forum-post', (data) => {
    socket.to(`forum-${data.courseId}`).emit('forum-post-added', data);
  });

  // Handle forum post replies
  socket.on('new-forum-reply', (data) => {
    socket.to(`forum-${data.courseId}`).emit('forum-reply-added', data);
  });

  // Handle assignment submission notifications
  socket.on('assignment-submitted', (data) => {
    const { courseId, assignmentId, studentName } = data;
    // Notify instructors or course moderators
    socket.to(`course-staff-${courseId}`).emit('assignment-submitted', {
      assignmentId,
      studentName,
      timestamp: new Date()
    });
  });

  // Handle user going offline
  socket.on('going-offline', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        name: socket.userName
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);

    // Remove from online users
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      socket.broadcast.emit('user-offline', {
        userId: socket.userId,
        name: socket.userName
      });

      // Notify course chat if user was in one
      if (socket.courseId) {
        socket.to(`chat-${socket.courseId}`).emit('user-left-chat', {
          userId: socket.userId,
          name: socket.userName,
          timestamp: new Date()
        });
      }

      // Notify P2P chat partner if user was in one
      if (socket.p2pRoom) {
        socket.to(`p2p-${socket.p2pRoom}`).emit('peer-disconnected', {
          userId: socket.userId,
          name: socket.userName,
          timestamp: new Date()
        });
      }
    }
  });

  // Periodic online users update
  const onlineUsersInterval = setInterval(() => {
    if (socket.courseId) {
      const courseOnlineUsers = Array.from(onlineUsers.values());
      socket.emit('online-users-update', courseOnlineUsers);
    }
  }, 30000); // Update every 30 seconds

  socket.on('disconnect', () => {
    clearInterval(onlineUsersInterval);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5555;

server.listen(PORT, () => {
  console.log(`🚀 SWAYAM 2.0 Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
