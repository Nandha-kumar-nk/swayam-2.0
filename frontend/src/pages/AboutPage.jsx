import React from 'react';
import {
  AcademicCapIcon,
  GlobeAltIcon,
  LightBulbIcon,
  UsersIcon,
  StarIcon,
  TrophyIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const AboutPage = () => {
  const features = [
    {
      icon: AcademicCapIcon,
      title: "Expert-Led Courses",
      description: "Learn from industry professionals and academic experts who bring real-world experience to every lesson."
    },
    {
      icon: UsersIcon,
      title: "Community Learning",
      description: "Connect with fellow learners, share insights, and grow together in our vibrant community forums."
    },
    {
      icon: LightBulbIcon,
      title: "AI-Powered Assistance",
      description: "Get instant help with our intelligent study assistant that adapts to your learning style."
    },
    {
      icon: TrophyIcon,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and achievement tracking."
    },
    {
      icon: ClockIcon,
      title: "Flexible Learning",
      description: "Study at your own pace with 24/7 access to all course materials and resources."
    },
    {
      icon: BookOpenIcon,
      title: "Rich Content Library",
      description: "Access thousands of interactive lessons, quizzes, and hands-on projects."
    }
  ];

  const stats = [
    { number: "50,000+", label: "Active Learners" },
    { number: "500+", label: "Expert Instructors" },
    { number: "2,000+", label: "Courses Available" },
    { number: "95%", label: "Completion Rate" }
  ];

  const team = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chief Education Officer",
      bio: "Former MIT professor with 15+ years in educational technology and curriculum design.",
      image: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=3B82F6&color=FFFFFF&size=128"
    },
    {
      name: "Raj Kumar",
      role: "Head of Engineering",
      bio: "Full-stack developer and machine learning expert passionate about educational innovation.",
      image: "https://ui-avatars.com/api/?name=Raj+Kumar&background=10B981&color=FFFFFF&size=128"
    },
    {
      name: "Priya Patel",
      role: "Learning Experience Designer",
      bio: "UX researcher focused on creating engaging and accessible learning experiences for all.",
      image: "https://ui-avatars.com/api/?name=Priya+Patel&background=F59E0B&color=FFFFFF&size=128"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                SWAYAM 2.0
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              The next generation of online learning - where artificial intelligence meets human expertise
              to create personalized, engaging, and effective educational experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Start Learning Today
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
                Explore Courses
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 dark:text-gray-300 text-lg font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Why Choose SWAYAM 2.0?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We've reimagined online education by combining the best of human expertise
              with cutting-edge AI technology to deliver exceptional learning outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 group hover:-translate-y-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8 leading-tight">
                Our Mission to Transform Education
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                At SWAYAM 2.0, we believe that quality education should be accessible to everyone,
                regardless of their background, location, or circumstances. Our platform bridges
                the gap between traditional learning and modern technology.
              </p>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Accessibility First</h4>
                    <p className="text-gray-600 dark:text-gray-300">Making world-class education available to learners worldwide.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Innovation Driven</h4>
                    <p className="text-gray-600 dark:text-gray-300">Leveraging AI and machine learning to personalize learning experiences.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Community Focused</h4>
                    <p className="text-gray-600 dark:text-gray-300">Building supportive learning communities that foster growth and collaboration.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <SparklesIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    The Future of Learning
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    We're not just another online learning platform. We're building the future of education
                    where technology enhances human potential, making learning more effective, engaging, and accessible than ever before.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Meet Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              The passionate individuals behind SWAYAM 2.0, dedicated to revolutionizing online education.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 text-center group hover:-translate-y-2">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {member.name}
                </h3>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-4">
                  {member.role}
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
            Ready to Transform Your Learning Journey?
          </h2>
          <p className="text-xl mb-10 text-blue-100 leading-relaxed">
            Join thousands of learners who are already experiencing the future of education.
            Start your journey with SWAYAM 2.0 today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started Free
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
