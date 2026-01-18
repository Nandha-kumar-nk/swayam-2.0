import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import io from 'socket.io-client';
import api from '../../utils/api';
import ChatbotWidget from '../../components/ChatbotWidget';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  HandThumbUpIcon,
  EyeIcon,
  ClockIcon,
  SparklesIcon,
  RocketLaunchIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import {
  CheckCircleIcon as CheckCircleSolid,
} from '@heroicons/react/24/solid';

const ForumPage = () => {
  const { courseId } = useParams();
  const { user } = useAuth();

  // Refs
  const socket = useRef(null);
  const chatScrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // State variables
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [forumPosts, setForumPosts] = useState([]);
  const [courseInfo, setCourseInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Live Chat State
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState([]);

  // P2P Chat State
  const [showP2PChat, setShowP2PChat] = useState(false);
  const [p2pChats, setP2pChats] = useState([]);
  const [activePeerChat, setActivePeerChat] = useState(null);
  const [peerChatMessages, setPeerChatMessages] = useState([]);
  const [peerMessage, setPeerMessage] = useState('');

  // Chatbot State
  const [showChatbot, setShowChatbot] = useState(false);
  // Demo users for testing P2P chat (keeping for reference)
  const demoUsers = [
    {
      id: 'user1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      profilePicture: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=3B82F6&color=FFFFFF&size=128'
    },
    {
      id: 'user2',
      name: 'Bob Smith',
      email: 'bob@example.com',
      profilePicture: 'https://ui-avatars.com/api/?name=Bob+Smith&background=10B981&color=FFFFFF&size=128'
    },
    {
      id: 'user3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      profilePicture: 'https://ui-avatars.com/api/?name=Carol+Davis&background=F59E0B&color=FFFFFF&size=128'
    },
    {
      id: 'user4',
      name: 'David Wilson',
      email: 'david@example.com',
      profilePicture: 'https://ui-avatars.com/api/?name=David+Wilson&background=8B5CF6&color=FFFFFF&size=128'
    }
  ];

  // Demo user switching for testing
  const switchToDemoUser = (demoUser) => {
    // Update the auth context with demo user
    if (window.confirm(`Switch to demo user: ${demoUser.name}? This will simulate logging in as a different user.`)) {
      // Create a mock user object
      const mockUser = {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        profilePicture: demoUser.profilePicture
      };

      // Update local storage to persist the demo user
      localStorage.setItem('demoUser', JSON.stringify(mockUser));

      // Force re-initialization of socket connection
      if (socket.current) {
        socket.current.disconnect();
      }

      // Update the user in auth context (if available) or trigger a refresh
      window.location.reload();
    }
  };

  // Get current demo user from localStorage
  useEffect(() => {
    const savedDemoUser = localStorage.getItem('demoUser');
    if (savedDemoUser) {
      try {
        const demoUser = JSON.parse(savedDemoUser);
        // You might need to update your auth context here
        console.log('Using demo user:', demoUser.name);
      } catch (error) {
        console.error('Error parsing demo user:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchCourseInfo();
    fetchForumPosts();
    initializeSocket();

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [courseId, user]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, peerChatMessages]);

  const fetchCourseInfo = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        setCourseInfo(response.data.data.course);
      }
    } catch (error) {
      console.error('Error fetching course info:', error);
      setCourseInfo({
        title: "Introduction to React.js",
        instructor: { name: "Dr. Sarah Johnson" },
        enrollmentCount: 1547
      });
    }
  };

  const fetchForumPosts = async () => {
    try {
      const response = await api.get(`/forum/${courseId}`);
      if (response.data.success) {
        setForumPosts(response.data.data.posts);
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error);
      setForumPosts([
        {
          id: 1,
          title: "How to handle state in functional components?",
          content: "I'm struggling with understanding useState hook. Can someone explain with examples?",
          author: {
            id: 1,
            name: "Alex Kumar",
            avatar: "https://via.placeholder.com/40/3B82F6/FFFFFF?text=AK",
            reputation: 85,
            badge: "Active Learner"
          },
          type: "question",
          tags: ["useState", "hooks", "state-management"],
          createdAt: "2024-10-10T10:30:00Z",
          lastActivity: "2024-10-12T14:22:00Z",
          upvotes: 12,
          downvotes: 1,
          views: 234,
          replies: [
            {
              id: 1,
              content: "useState is a React Hook that lets you add state to functional components. It returns an array with the current state value and a function to update it.",
              author: {
                name: "Sarah Chen",
                avatar: "https://via.placeholder.com/40/10B981/FFFFFF?text=SC",
                reputation: 342,
                badge: "Expert"
              },
              createdAt: "2024-10-10T11:15:00Z",
              upvotes: 8,
              downvotes: 0,
              isAccepted: true
            }
          ],
          isPinned: false,
          isClosed: false,
          hasAcceptedAnswer: true
        },
        {
          id: 2,
          title: "Best practices for component structure?",
          content: "What are the best practices for organizing React components in a large project?",
          author: {
            id: 2,
            name: "Priya Patel",
            avatar: "https://via.placeholder.com/40/8B5CF6/FFFFFF?text=PP",
            reputation: 210,
            badge: "Contributor"
          },
          type: "discussion",
          tags: ["best-practices", "project-structure", "components"],
          createdAt: "2024-10-11T09:45:00Z",
          lastActivity: "2024-10-12T16:10:00Z",
          upvotes: 18,
          downvotes: 2,
          views: 156,
          replies: [],
          isPinned: true,
          isClosed: false,
          hasAcceptedAnswer: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    if (!user) return;

    socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5555');

    socket.current.emit('authenticate', {
      userId: user.id,
      name: user.name,
      avatar: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=FFFFFF`
    });

    socket.current.emit('join-course-forum', courseId);
    socket.current.emit('join-live-chat', courseId);

    socket.current.on('new-chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.current.on('user-joined-chat', (data) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.name} joined the chat`,
        timestamp: data.timestamp
      }]);
    });

    socket.current.on('user-left-chat', (data) => {
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        type: 'system',
        message: `${data.name} left the chat`,
        timestamp: data.timestamp
      }]);
    });

    socket.current.on('course-online-users', (users) => {
      setOnlineUsers(users);
    });

    socket.current.on('online-users-update', (users) => {
      setOnlineUsers(users);
    });

    socket.current.on('user-typing', (data) => {
      if (data.type === 'start') {
        setTyping(prev => [...prev.filter(t => t.userId !== data.userId), data]);
      } else {
        setTyping(prev => prev.filter(t => t.userId !== data.userId));
      }
    });

    socket.current.on('p2p-chat-request', (data) => {
      setP2pChats(prev => [...prev, data]);
      alert(`${data.from} wants to chat with you!`);
    });

    socket.current.on('p2p-message', (message) => {
      setPeerChatMessages(prev => [...prev, message]);
    });

    socket.current.on('forum-post-added', (post) => {
      setForumPosts(prev => [post, ...prev]);
    });

    socket.current.on('forum-reply-added', (data) => {
      setForumPosts(prev => prev.map(post =>
        post._id === data.postId ? { ...post, replies: [...post.replies, data.reply] } : post
      ));
    });
  };

  const handleAskAI = async () => {
    if (!searchTerm.trim()) return;

    setAiLoading(true);
    try {
      const response = await api.post(`/forum/${courseId}/ai-chat`, {
        message: searchTerm
      });

      if (response.data.success) {
        setAiResponse(response.data.data.message);
        setShowAiHelper(true);

        socket.current?.emit('ai-chat-start', { courseId, query: searchTerm });
      }
    } catch (error) {
      const suggestion = getAiSuggestion(searchTerm);
      setAiResponse(suggestion);
      setShowAiHelper(true);
    } finally {
      setAiLoading(false);
    }
  };

  // Chat functions (defined before JSX to avoid hoisting issues)
  const handleChatTyping = (e) => {
    setChatMessage(e.target.value);

    if (!socket.current) return;

    socket.current.emit('typing-start', { roomId: courseId, type: 'course' });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('typing-stop', { roomId: courseId, type: 'course' });
    }, 1000);
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !socket.current) return;

    socket.current.emit('send-chat-message', {
      courseId,
      message: chatMessage,
      type: 'text'
    });

    setChatMessage('');
    socket.current.emit('typing-stop', { roomId: courseId, type: 'course' });
  };

  const sendPeerMessage = () => {
    if (!peerMessage.trim() || !activePeerChat || !socket.current) return;

    socket.current.emit('send-p2p-message', {
      roomId: activePeerChat.roomId,
      message: peerMessage,
      type: 'text'
    });

    setPeerMessage('');
    socket.current.emit('typing-stop', { roomId: activePeerChat.roomId, type: 'p2p' });
  };

  const handlePeerChatTyping = (e) => {
    setPeerMessage(e.target.value);

    if (!socket.current || !activePeerChat) return;

    socket.current.emit('typing-start', { roomId: activePeerChat.roomId, type: 'p2p' });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('typing-stop', { roomId: activePeerChat.roomId, type: 'p2p' });
    }, 1000);
  };
  const initiateP2PChat = (targetUser) => {
    const roomId = [user.id, targetUser.id].sort().join('-');

    socket.current?.emit('initiate-p2p-chat', {
      targetUserId: targetUser.id,
      roomId,
      message: `${user.name} wants to chat with you!`
    });

    setActivePeerChat({
      userId: targetUser.id,
      name: targetUser.name,
      avatar: targetUser.avatar,
      roomId
    });

    setShowLiveChat(false); // Close group chat when opening P2P
  };

  const acceptP2PChat = (chatRequest) => {
    socket.current?.emit('accept-p2p-chat', {
      roomId: chatRequest.roomId,
      fromUserId: chatRequest.from
    });

    setActivePeerChat({
      userId: chatRequest.from,
      name: chatRequest.fromName,
      avatar: chatRequest.fromAvatar,
      roomId: chatRequest.roomId
    });

    // Remove from pending chats
    setP2pChats(prev => prev.filter(chat => chat.roomId !== chatRequest.roomId));
  };

  const declineP2PChat = (roomId) => {
    socket.current?.emit('decline-p2p-chat', { roomId });
    setP2pChats(prev => prev.filter(chat => chat.roomId !== roomId));
  };

  const getAiSuggestion = (query) => {
    const lowercaseQuery = query.toLowerCase();
    for (const [keyword, response] of Object.entries(aiHelperResponses)) {
      if (lowercaseQuery.includes(keyword)) {
        return response;
      }
    }
    return "Hmm, I'm not quite sure about that specific React concept! 🤔 Could you try rephrasing your question or give me a bit more context? \n\nFor example, you could ask about:\n• useState, useEffect, or other React hooks\n• Props and component communication\n• Component lifecycle and mounting\n• Error handling and debugging\n• Project structure and best practices\n\nI'm here to help with any React questions you have - just let me know what you're working on! 😊";
  };

  const aiHelperResponses = {
    "usestate": `Hey there! 👋 I see you're asking about useState - that's one of the most fundamental React hooks and a great place to start!

**Let me break this down for you step by step:**

**🔑 What useState actually does:**
useState gives you the power to add state to your functional components. It returns an array with two elements:
- The current state value
- A function to update that state

**Here's a simple example:**
\`\`\`javascript
import { useState } from 'react';

function Counter() {
  // Declare state variable and setter function
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me!
      </button>
    </div>
  );
}
\`\`\`

**💡 Pro tip:** Notice how I'm using the functional update pattern \`setCount(count + 1)\`? That's often better than \`setCount(count + 1)\` because React batches multiple state updates together.

**Common patterns you'll use:**

**1. Multiple state variables:**
\`\`\`javascript
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
\`\`\`

**2. Objects and arrays:**
\`\`\`javascript
const [user, setUser] = useState({
  name: '',
  email: '',
  preferences: []
});

// ✅ Good - creating new object
const updateName = (newName) => {
  setUser(prevUser => ({
    ...prevUser,
    name: newName
  }));
};

// ❌ Bad - mutating existing object
// setUser(prevUser => { prevUser.name = newName; return prevUser; });
\`\`\`

**3. Lazy initial state (for expensive computations):**
\`\`\`javascript
const [expensiveData, setExpensiveData] = useState(() => {
  // This only runs once, not on every render
  return computeExpensiveValue();
});
\`\`\`

**🚨 Common mistakes to avoid:**
- Don't mutate state directly (always use the setter function)
- State updates are asynchronous - don't rely on immediate values
- For objects/arrays, always create new references

**What are you trying to build with useState? A form? A counter? A todo list? I can give you more specific examples if you tell me! 😊`,

    "useeffect": `Oh, useEffect! This is where things get really interesting in React. useEffect lets you "step outside" your component and interact with the world. Let me explain this properly!

**🌟 What makes useEffect special:**
It's React's way of handling side effects - basically anything that affects the world outside your component's render cycle.

**The basic structure:**
\`\`\`javascript
useEffect(() => {
  // Your side effect code goes here
  
  // Optional cleanup function
  return () => {
    // Cleanup code (timers, subscriptions, etc.)
  };
}, [dependencies]); // Array of values that trigger re-runs
\`\`\`

**Let's look at real-world examples:**

**1. Data fetching (most common use case):**
\`\`\`javascript
useEffect(() => {
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      setUsers(users);
    } catch (error) {
      setError('Failed to fetch users');
    }
  };

  fetchUsers();
}, []); // Empty array = run once on mount
\`\`\`

**2. Event listeners:**
\`\`\`javascript
useEffect(() => {
  const handleScroll = () => {
    setScrollPosition(window.scrollY);
  };

  window.addEventListener('scroll', handleScroll);
  
  // Don't forget cleanup!
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, []); // Empty array because we only want to set up the listener once
\`\`\`

**3. Timers and intervals:**
\`\`\`javascript
useEffect(() => {
  const timer = setInterval(() => {
    setTime(prevTime => prevTime + 1);
  }, 1000);

  return () => clearInterval(timer); // Cleanup is crucial!
}, []);
\`\`\`

**🔑 Dependency array rules:**
- **Empty array \`[]\`**: Runs once after component mounts
- **No array**: Runs after every single render (usually bad!)
- **Specific values \`[userId, searchTerm]\`**: Runs when those values change

**⚠️ Important gotchas:**
- Always clean up subscriptions, timers, and event listeners
- Be careful with objects and functions in dependencies (they create new references each render)
- useEffect runs AFTER the render, not before

**What kind of side effect are you trying to implement? API calls? Event handling? Something else? I'd love to help you with a specific example! 🚀`,

    "props": `Props are how React components talk to each other - they're like messages passed from parent to child components. Think of them as parameters for your component functions!

**Let's start with the basics:**

**Parent component:**
\`\`\`javascript
function App() {
  const user = {
    name: "Sarah",
    age: 28,
    isOnline: true
  };

  return <UserProfile user={user} showDetails={true} />;
}
\`\`\`

**Child component:**
\`\`\`javascript
function UserProfile({ user, showDetails }) {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      {showDetails && <p>Age: {user.age}</p>}
      <span className={user.isOnline ? 'online' : 'offline'}>
        {user.isOnline ? '🟢' : '🔴'}
      </span>
    </div>
  );
}
\`\`\`

**Types of props you can pass:**

**1. Primitive values:**
\`\`\`javascript
<UserCard name="John" age={25} isActive={true} />
\`\`\`

**2. Objects and arrays:**
\`\`\`javascript
<UserCard user={{name: "John", preferences: ["reading", "coding"]}} />
\`\`\`

**3. Functions (for child-to-parent communication):**
\`\`\`javascript
function TodoItem({ todo, onComplete, onDelete }) {
  return (
    <div>
      <span>{todo.text}</span>
      <button onClick={() => onComplete(todo.id)}>Complete</button>
      <button onClick={() => onDelete(todo.id)}>Delete</button>
    </div>
  );
}
\`\`\`

**4. React elements (children):**
\`\`\`javascript
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
\`\`\`

**Advanced props patterns:**

**Default props:**
\`\`\`javascript
function Button({ 
  text = 'Click me', 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick 
}) {
  return (
    <button 
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
}
\`\`\`

**Destructuring with rest:**
\`\`\`javascript
function Profile({ name, email, ...socialLinks }) {
  return (
    <div>
      <h1>{name}</h1>
      <p>{email}</p>
      <div className="social-links">
        {Object.entries(socialLinks).map(([platform, url]) => (
          <a key={platform} href={url}>{platform}</a>
        ))}
      </div>
    </div>
  );
}

// Usage:
<Profile 
  name="Alice" 
  email="alice@example.com"
  twitter="alice_dev"
  github="alice"
  linkedin="alice-profile"
/>
\`\`\`

**🚨 Common mistakes:**
- **Mutating props:** Props are read-only! Don't try to change them directly
- **Missing key props:** Always add keys when rendering lists
- **Over-passing props:** Only pass what you actually need

**What are you trying to build with props? A complex form? A data visualization component? Tell me more and I can help you design the perfect prop interface! 💭`,

    "map error": `Ah, the infamous "map is not a function" error! This happens to every React developer at some point. Don't worry - it's usually a quick fix!

**What's really happening:**
You're trying to call \`.map()\` on something that isn't an array. JavaScript's map function only works on arrays, so if you pass it undefined, null, or an object, you'll get this error.

**Most common causes:**
1. **API returns undefined/null** instead of an empty array
2. **Async data hasn't loaded yet** - you're mapping before the data arrives
3. **Wrong variable name** - maybe a typo?
4. **Data structure mismatch** - expecting an array but getting a single object

**Let's fix this with some practical solutions:**

**Solution 1: Optional Chaining (easiest fix)**
\`\`\`javascript
// ❌ This breaks if users is undefined
const userList = users.map(user => <li key={user.id}>{user.name}</li>);

// ✅ Safe with optional chaining
const userList = users?.map(user => <li key={user.id}>{user.name}</li>);
\`\`\`

**Solution 2: Defensive initialization**
\`\`\`javascript
// In your component state
const [users, setUsers] = useState([]); // Always start with array

// In your API response handler
const safeUsers = response?.data?.users || [];
setUsers(safeUsers);
\`\`\`

**Solution 3: Conditional rendering**
\`\`\`javascript
{users && users.length > 0 ? (
  <ul>
    {users.map(user => (
      <UserCard key={user.id} user={user} />
    ))}
  </ul>
) : (
  <p>No users found</p>
)}
\`\`\`

**Solution 4: Loading states (recommended)**
\`\`\`javascript
function UserList({ users, loading, error }) {
  if (loading) return <div>Loading users...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!users || users.length === 0) return <div>No users found</div>;

  return (
    <ul>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
}
\`\`\`

**Debugging tips:**
\`\`\`javascript
// Add this temporarily to see what's happening
console.log('users:', users);
console.log('typeof users:', typeof users);
console.log('Array.isArray(users):', Array.isArray(users));

// In your render
{Array.isArray(users) ? (
  users.map(user => <div key={user.id}>{user.name}</div>)
) : (
  <div>Expected array but got: {typeof users}</div>
)}
\`\`\`

**Pro tips to prevent this:**
- Always initialize state as empty arrays: \`useState([])\`
- Use TypeScript for better type safety
- Consider using data fetching libraries like SWR or React Query
- Add error boundaries around your components

**What specific situation are you running into? Is this happening in a particular component or with a specific API call? I can give you more targeted advice if you share more details! 🔍`,

    "component structure": `Great question about organizing your React project! A well-structured codebase makes development so much more enjoyable and scalable. Let me walk you through a battle-tested folder structure:

**🏗️ The ideal React project structure:**

\`\`\`
src/
├── components/           # Your reusable UI building blocks
│   ├── common/          # Shared components (Button, Input, Modal)
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   ├── forms/           # Form-related components
│   └── features/        # Feature-specific components
├── pages/              # Your route components (pages)
├── hooks/              # Custom hooks (useAuth, useApi, etc.)
├── utils/              # Helper functions and utilities
├── contexts/           # React contexts (Auth, Theme, etc.)
├── types/              # TypeScript definitions
├── constants/          # App constants and configuration
├── assets/             # Images, icons, fonts
└── styles/             # Global styles and themes
\`\`\`

**Let's break this down:**

**📦 Components organization:**

**common/ - Your UI primitives:**
\`\`\`
components/common/
├── Button.jsx          # Reusable button component
├── Input.jsx           # Input field with validation
├── Modal.jsx           # Modal dialog component
├── LoadingSpinner.jsx  # Loading indicator
└── index.js           # Export all components
\`\`\`

**features/ - Domain-specific components:**
\`\`\`
components/features/
├── products/
│   ├── ProductCard.jsx
│   ├── ProductList.jsx
│   └── ProductFilters.jsx
├── users/
│   ├── UserProfile.jsx
│   └── UserList.jsx
└── dashboard/
    ├── StatsCard.jsx
    └── ActivityFeed.jsx
\`\`\`

**📄 Pages structure:**
\`\`\`
pages/
├── HomePage.jsx
├── AboutPage.jsx
├── auth/
│   ├── LoginPage.jsx
│   └── RegisterPage.jsx
├── dashboard/
│   ├── DashboardPage.jsx
│   └── components/     # Dashboard-specific components
└── products/
    ├── ProductsPage.jsx
    └── ProductDetailPage.jsx
\`\`\`

**🎣 Custom hooks:**
\`\`\`
hooks/
├── useAuth.js         # Authentication logic
├── useApi.js          # API call wrapper
├── useLocalStorage.js # Local storage with React state
├── useDebounce.js     # Debounce user input
├── usePrevious.js     # Compare current vs previous value
└── useEventListener.js # Add/remove event listeners
\`\`\`

**🛠️ Utilities:**
\`\`\`
utils/
├── api.js             # API configuration
├── validators.js      # Form validation functions
├── formatters.js      # Date, number, currency formatting
├── constants.js       # API endpoints, app constants
└── helpers.js         # General utility functions
\`\`\`

**Best practices for clean code:**

**1. Component composition:**
\`\`\`javascript
// UserProfile.jsx - handles presentation
const UserProfile = ({ user, onEdit }) => {
  return (
    <Card>
      <Avatar src={user.avatar} />
      <UserInfo user={user} />
      <EditButton onClick={onEdit} />
    </Card>
  );
};

// UserProfileContainer.jsx - handles logic
const UserProfileContainer = ({ userId }) => {
  const { user, updateUser } = useUser(userId);
  
  return <UserProfile user={user} onEdit={updateUser} />;
};
\`\`\`

**2. Clean imports:**
\`\`\`javascript
// ✅ Group imports logically
import React from 'react';
import { useState, useEffect } from 'react';

// Third-party libraries
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Internal imports
import { Button } from '../components/common';
import { useAuth } from '../hooks/useAuth';
import './UserProfile.css';
\`\`\`

**3. Index files for clean imports:**
\`\`\`javascript
// components/common/index.js
export { default as Button } from './Button';
export { default as Input } from './Input';
export { default as Modal } from './Modal';

// Now import like:
import { Button, Input, Modal } from '../components/common';
\`\`\`

**4. Component patterns:**

**Presentational vs Container:**
- **Presentational:** Only renders UI, receives data via props
- **Container:** Handles logic, data fetching, state management

**Custom hooks for logic:**
\`\`\`javascript
// Extract complex logic into custom hooks
const useUserProfile = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading, updateUser };
};
\`\`\`

**What part of your project structure are you working on? Are you building a specific feature that needs better organization? I can help you design the perfect structure for your use case! 🏗️`
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading forum...</p>
        </div>
      </div>
    );
  }

  const filters = [
    { key: 'all', label: 'All Posts', count: (forumPosts || []).length },
    { key: 'questions', label: 'Questions', count: (forumPosts || []).filter(p => p && p.type === 'question').length },
    { key: 'discussions', label: 'Discussions', count: (forumPosts || []).filter(p => p && p.type === 'discussion').length },
    { key: 'help', label: 'Help', count: (forumPosts || []).filter(p => p && p.type === 'help').length },
    { key: 'unanswered', label: 'Unanswered', count: (forumPosts || []).filter(p => p && !p.hasAcceptedAnswer && (p.replies || []).length === 0).length }
  ];

  const filteredPosts = (forumPosts || []).filter(post => {
    if (!post) return false;

    const matchesSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = selectedFilter === 'all' ||
                         (selectedFilter === 'unanswered' && !post.hasAcceptedAnswer && (post.replies || []).length === 0) ||
                         post.type === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Expert': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'Mentor': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'Helper': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'Contributor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'Active Learner': return 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'question': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'discussion': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'help': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      case 'announcement': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/30 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-2">
                  {courseInfo?.title || 'Course'} - Community Forum
                </h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <span>Connect with fellow learners</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-semibold text-green-600 dark:text-green-400">{onlineUsers.length} online now</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Current User Info */}
              <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                <div className="relative">
                  <img
                    src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=3B82F6&color=FFFFFF`}
                    alt={user?.name || 'User'}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-md"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-700"></div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Online now
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowNewPostModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Post</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                💬 Chat Options
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowP2PChat(!showP2PChat);
                    setShowLiveChat(false);
                  }}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    showP2PChat
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Private Messages</span>
                  {p2pChats.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {p2pChats.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowLiveChat(!showLiveChat)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    showLiveChat
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Live Group Chat</span>
                </button>

                <button
                  onClick={() => setShowChatbot(!showChatbot)}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                    showChatbot
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>AI Study Helper</span>
                </button>
              </div>

              {/* Online Users Count */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Online Users:</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {onlineUsers.length} active
                  </span>
                </div>
              </div>
            </div>

            {/* Search and AI Helper */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🤖 AI Study Helper
              </h3>
              <div className="space-y-3">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ask AI about React..."
                    className="form-input pl-10 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                  />
                </div>
                <button
                  onClick={handleAskAI}
                  className="w-full btn-primary text-sm py-2 flex items-center justify-center space-x-2"
                  disabled={!searchTerm.trim()}
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Ask AI</span>
                </button>
              </div>

              {/* AI Response */}
              {showAiHelper && aiResponse && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-start space-x-2">
                    <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-full">
                      <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">AI Assistant</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="space-y-2">
                {filters.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setSelectedFilter(filter.key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedFilter === filter.key
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{filter.label}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                        {filter.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {['useState', 'useEffect', 'props', 'components', 'hooks', 'jsx', 'state-management', 'debugging'].map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800"
                    onClick={() => setSearchTerm(tag)}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Posts List */}
            <div className="space-y-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {post.isPinned && (
                            <span className="text-yellow-500">
                              📌
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(post.type)}`}>
                            {post.type}
                          </span>
                          {post.hasAcceptedAnswer && (
                            <CheckCircleSolid className="w-5 h-5 text-green-500" title="Has accepted answer" />
                          )}
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-blue-600 cursor-pointer">
                          {post.title}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                          {(post.content || '').substring(0, 200)}{(post.content || '').length > 200 ? '...' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(post.tags || []).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-md text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* AI Suggestion */}
                    {post.aiSuggestion && (
                      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-start space-x-2">
                          <RocketLaunchIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                              AI Quick Help (Confidence: {post.aiSuggestion.confidence}%)
                            </h4>
                            <p className="text-sm text-purple-800 dark:text-purple-200">
                              {post.aiSuggestion.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Post Footer */}
                    <div className="flex items-center justify-between">
                      {/* Author Info */}
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 dark:text-white">{post.author.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(post.author.badge)}`}>
                              {post.author.badge}
                            </span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">
                            {formatTimeAgo(post.createdAt)} • {post.author.reputation} rep
                          </div>
                        </div>
                      </div>

                      {/* Post Stats */}
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <HandThumbUpIcon className="w-4 h-4" />
                          <span>{post.upvotes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                          <span>{post.replies.length}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>Active {formatTimeAgo(post.lastActivity)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Show some replies */}
                    {(post.replies || []).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="space-y-3">
                          {(post.replies || []).slice(0, 2).map(reply => (
                            <div key={reply.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <img
                                src={reply.author.avatar}
                                alt={reply.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {reply.author.name}
                                  </span>
                                  {reply.isAccepted && (
                                    <CheckCircleSolid className="w-4 h-4 text-green-500" title="Accepted answer" />
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full text-xs ${getBadgeColor(reply.author.badge)}`}>
                                    {reply.author.badge}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {reply.content.substring(0, 150)}{reply.content.length > 150 ? '...' : ''}
                                </p>
                                <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{formatTimeAgo(reply.createdAt)}</span>
                                  <div className="flex items-center space-x-1">
                                    <HandThumbUpIcon className="w-3 h-3" />
                                    <span>{reply.upvotes}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {post.replies.length > 2 && (
                          <button className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            View {post.replies.length - 2} more replies →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Chatbot Widget */}
            <ChatbotWidget
              isOpen={showChatbot}
              onClose={() => setShowChatbot(false)}
              courseId={courseId}
              user={user}
            />
          </div>
        </div>
      </div>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-4 right-4 z-[55] rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-4 py-3 flex items-center space-x-2"
        aria-label="Open AI Chatbot"
      >
        <SparklesIcon className="w-5 h-5" />
        <span className="hidden sm:block text-sm font-medium">Open Chatbot</span>
      </button>

      {/* Live Chat Interface */}
      {showLiveChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md h-96 flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map((user, index) => (
                    <img
                      key={user.socketId}
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800"
                      style={{ zIndex: 3 - index }}
                    />
                  ))}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{onlineUsers.length} online</p>
                </div>
              </div>
              <button
                onClick={() => setShowLiveChat(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatScrollRef}>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'system' ? 'justify-center' : 'justify-start'}`}
                >
                  {message.type === 'system' ? (
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm px-3 py-1 rounded-full">
                      {message.message}
                    </div>
                  ) : (
                    <div className="flex items-start space-x-2 max-w-xs">
                      <img
                        src={message.user.avatar}
                        alt={message.user.name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                        <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                          {message.user.name}
                        </p>
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimeAgo(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {typing.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {typing[0]?.name} is typing...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={handleChatTyping}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 form-input text-sm"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* P2P Chat Interface */}
      {showP2PChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          {/* Online Users Sidebar */}
          <div className="w-80 bg-white dark:bg-gray-800 flex flex-col">
            {/* P2P Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Private Messages</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chat with other learners</p>
              </div>
              <button
                onClick={() => setShowP2PChat(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Pending Chat Requests */}
            {p2pChats.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Chat Requests</h4>
                <div className="space-y-2">
                  {p2pChats.map((chatRequest) => (
                    <div key={chatRequest.roomId} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={chatRequest.fromAvatar}
                          alt={chatRequest.fromName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {chatRequest.fromName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Wants to chat
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptP2PChat(chatRequest)}
                          className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineP2PChat(chatRequest.roomId)}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Online Users List */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Online Users ({onlineUsers.length})
              </h4>
              <div className="space-y-2">
                {onlineUsers
                  .filter(onlineUser => onlineUser.id !== user?.id)
                  .map((onlineUser) => (
                    <div
                      key={onlineUser.socketId}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                      onClick={() => initiateP2PChat(onlineUser)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <img
                            src={onlineUser.avatar}
                            alt={onlineUser.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {onlineUser.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Online now
                          </p>
                        </div>
                      </div>
                      <button className="btn-outline btn-sm">
                        Message
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Active P2P Chat */}
          {activePeerChat && (
            <div className="flex-1 bg-white dark:bg-gray-800 flex flex-col">
              {/* Active Chat Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <img
                    src={activePeerChat.avatar}
                    alt={activePeerChat.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {activePeerChat.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Private conversation
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePeerChat(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* P2P Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={chatScrollRef}>
                {peerChatMessages
                  .filter(msg => msg.roomId === activePeerChat.roomId)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${message.user.id === user?.id ? 'order-2' : 'order-1'}`}>
                        <div className={`flex items-start space-x-2 ${message.user.id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          <img
                            src={message.user.avatar}
                            alt={message.user.name}
                            className="w-6 h-6 rounded-full flex-shrink-0"
                          />
                          <div className={`rounded-lg px-3 py-2 ${
                            message.user.id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">
                              {message.message}
                            </p>
                            <p className={`text-xs mt-1 ${
                              message.user.id === user?.id
                                ? 'text-blue-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {formatTimeAgo(message.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* P2P Chat Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={peerMessage}
                    onChange={handlePeerChatTyping}
                    onKeyPress={(e) => e.key === 'Enter' && sendPeerMessage()}
                    placeholder={`Message ${activePeerChat.name}...`}
                    className="flex-1 form-input text-sm"
                  />
                  <button
                    onClick={sendPeerMessage}
                    disabled={!peerMessage.trim()}
                    className="btn-primary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* No Active Chat State */}
          {!activePeerChat && (
            <div className="flex-1 bg-white dark:bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Select a user to start chatting
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose someone from the list to begin a private conversation
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chatbot Widget */}
      <ChatbotWidget
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
        courseId={courseId}
        user={user}
      />

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        className="fixed bottom-4 right-4 z-[55] rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-4 py-3 flex items-center space-x-2"
        aria-label="Open AI Chatbot"
      >
        <SparklesIcon className="w-5 h-5" />
        <span className="hidden sm:block text-sm font-medium">Open Chatbot</span>
      </button>
    </div>
  );
};

export default ForumPage;
