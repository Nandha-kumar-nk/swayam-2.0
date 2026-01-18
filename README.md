# SWAYAM 2.0 – Enhanced Online Learning Platform

## 📌 Project Overview
**SWAYAM 2.0** is an enhanced and re-engineered version of the SWAYAM online learning platform, developed as part of an academic reverse engineering project.  
The aim of this project is to analyze limitations in the existing system and propose an improved solution with better usability, scalability, and student engagement.

This project focuses on improving user experience, real-time interaction, notification systems, and overall performance using modern web technologies.

---

## 🎯 Objectives
- Analyze functional and usability gaps in the existing SWAYAM application  
- Design an improved architecture using the MERN stack  
- Provide better interaction between students and instructors  
- Implement real-time features and automated notifications  
- Enhance responsiveness and performance

---

## 🛠️ Technologies Used

### Frontend
- React.js
- HTML5
- CSS3
- Tailwind CSS
- JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB

### Additional Tools & Libraries
- NodeMailer (for email notifications)
- WebSocket (for real-time updates)
- JWT (for authentication)
- Git & GitHub (version control)

---

## ✨ Key Features
- User Authentication (Student / Instructor)
- Course Enrollment and Management
- Assignment Upload and Submission
- Email Notifications for Assignments & Deadlines
- Real-Time Updates using WebSocket
- Responsive UI for mobile and desktop
- Secure Login and Session Management

---

## 🧩 System Architecture
- Frontend communicates with backend via REST APIs
- MongoDB stores user, course, and assignment data
- NodeMailer handles automated email alerts
- WebSocket enables real-time communication
- JWT ensures secure authentication

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js
- MongoDB
- Git

### Steps
```bash
# Clone the repository
git clone https://github.com/your-username/swayam-2.0.git

# Navigate to project folder
cd swayam-2.0

# Install backend dependencies
cd backend
npm install

# Start backend server
npm start

# Install frontend dependencies
cd ../frontend
npm install

# Start frontend server
npm start
