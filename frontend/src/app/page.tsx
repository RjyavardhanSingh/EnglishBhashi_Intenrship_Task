'use client';

import { JSX, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { courseAPI, progressAPI, Course, UserProgress } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const { darkMode, toggleDarkMode, isLoaded: themeLoaded } = useTheme();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.role === 'admin') {
        const coursesResponse = await courseAPI.getCourses();
        setCourses(coursesResponse.data);
      } else {
        const [enrolledResponse, coursesResponse] = await Promise.all([
          progressAPI.getUserProgress(),
          courseAPI.getCourses()
        ]);
        setEnrolledCourses(enrolledResponse.data);
        setCourses(coursesResponse.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      await courseAPI.enrollCourse(courseId);
      loadDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Navigation items for different user roles
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home', current: true },
    { name: 'Courses', href: '/dashboard/courses', icon: 'academic-cap' },
    { name: 'Create Course', href: '/dashboard/create-course', icon: 'plus-circle' },
    { name: 'Users', href: '/dashboard/users', icon: 'users' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: 'chart-bar' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'cog' },
  ];

  const learnerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'home', current: true },
    { name: 'My Courses', href: '/dashboard/my-courses', icon: 'book-open' },
    { name: 'Browse Courses', href: '/dashboard/browse', icon: 'search' },
    { name: 'Progress', href: '/dashboard/progress', icon: 'chart-line' },
    { name: 'Certificates', href: '/dashboard/certificates', icon: 'badge-check' },
    { name: 'Profile', href: '/dashboard/profile', icon: 'user' },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : learnerNavigation;

  // Icon component
  const Icon = ({ name, className }: { name: string; className?: string }) => {
    const icons: { [key: string]: JSX.Element } = {
      home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      'academic-cap': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
      'plus-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
      users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />,
      'chart-bar': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      cog: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
      'book-open': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
      search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
      'chart-line': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
      'badge-check': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    };

    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name]}
      </svg>
    );
  };

  // Show loading until both auth and theme are loaded
  if (authLoading || loading || !themeLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="text-slate-600 dark:text-gray-300 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Something went wrong</h3>
          <p className="text-slate-600 dark:text-gray-300 mb-8">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-600 dark:bg-gray-800 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:transform-none`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">EB</span>
              </div>
              <span className="ml-3 text-xl font-bold text-slate-900 dark:text-white">EnglishBhashi</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  item.current
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                    : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon name={item.icon} className="w-5 h-5 mr-3" />
                {item.name}
              </button>
            ))}
          </nav>

          {/* Dark Mode Toggle */}
          <div className="px-4 py-4 border-t border-slate-200 dark:border-gray-700">
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {darkMode ? (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          </div>

          {/* Logout button */}
          <div className="p-4 border-t border-slate-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 dark:text-gray-400 hover:text-slate-600 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {user?.role === 'admin' ? 'Admin Dashboard' : 'My Learning'}
            </h1>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8">
            {/* Welcome section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back, {user?.name?.split(' ')[0] || 'there'}! 👋
              </h1>
              <p className="text-slate-600 dark:text-gray-300">
                {user?.role === 'admin' 
                  ? 'Manage your courses and monitor platform activity.' 
                  : "Let's continue your English learning journey."}
              </p>
            </div>

            {/* Debug info - Remove this after testing */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-800 dark:text-yellow-200">
                  <strong>Debug:</strong> Dark Mode = {darkMode ? 'ON' : 'OFF'} | 
                  Theme Loaded: {themeLoaded ? 'YES' : 'NO'} |
                  HTML Classes: {typeof document !== 'undefined' ? document.documentElement.className : 'N/A'} |
                  Saved Theme: {typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : 'N/A'}
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Total Users */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Total Users</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{/* Total users count */}</p>
                  </div>
                </div>
              </div>

              {/* Total Courses */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Total Courses</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{courses.length}</p>
                  </div>
                </div>
              </div>

              {/* Enrolled Courses */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Enrolled Courses</p>
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{enrolledCourses.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Management - Admin only */}
            {user?.role === 'admin' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Course Management</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div key={course._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{course.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">{course.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
                          Edit
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enrolled Courses List - Learner view */}
            {user?.role !== 'admin' && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">My Courses</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledCourses.map((enrollment) => {
                    let courseTitle: string = 'Course Title Unavailable';
                    let courseDescription: string = 'Course Description Unavailable';
                    let actualCourseId: string | undefined;

                    if (typeof enrollment.courseId === 'object' && enrollment.courseId !== null) {
                      // enrollment.courseId is CourseStub
                      const courseStub = enrollment.courseId; // Type assertion
                      actualCourseId = courseStub._id;
                      courseTitle = courseStub.title;
                      courseDescription = courseStub.description;
                    } else if (typeof enrollment.courseId === 'string') {
                      // enrollment.courseId is a string ID
                      actualCourseId = enrollment.courseId;
                      const fullCourse = courses.find(c => c._id === enrollment.courseId);
                      if (fullCourse) {
                        courseTitle = fullCourse.title;
                        courseDescription = fullCourse.description;
                      } else {
                        console.warn(`Full course details not found for ID: ${enrollment.courseId}`);
                      }
                    } else {
                      console.warn('Invalid courseId in enrollment:', enrollment);
                      return null; // Skip rendering this item if courseId is invalid
                    }

                    if (!actualCourseId) {
                      return null; // Skip if we couldn't determine a course ID
                    }

                    return (
                      <div key={enrollment._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{courseTitle}</h3>
                        <p className="text-sm text-slate-600 dark:text-gray-300 mb-4 line-clamp-3">{courseDescription}</p>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/courses/${actualCourseId}`} // Consider if this path should be /dashboard/course/
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                          >
                            Continue Learning
                          </Link>
                          <button
                            onClick={() => handleEnrollCourse(actualCourseId!)} // Using actualCourseId
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                          >
                            Unenroll {/* Note: handleEnrollCourse likely enrolls, not unenrolls. This might be a bug. */}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Browse Courses - Available to all users */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Browse Courses</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">{course.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/course/${course._id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                      >
                        View Details
                      </Link>
                      {user?.role !== 'admin' && (
                        <button
                          onClick={() => handleEnrollCourse(course._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-200"
                        >
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
