'use client';

import React, { useEffect, useState, useCallback } from 'react'; // Import React
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { courseAPI, progressAPI, Course, UserProgress, CourseStub, User } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

// Icon component moved to module scope
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const icons: { [key: string]: React.ReactNode } = { // Changed JSX.Element to React.ReactNode
    home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    'academic-cap': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />,
    'book-open': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    'chart-bar': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    'chart-line': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
    'badge-check': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
    'plus-circle': <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />,
    chevronLeft: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />,
    chevronRight: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />,
    moon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />,
    sun: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />,
    logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  };

  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
};

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth(); // Added logout for completeness if needed later
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', !isSidebarCollapsed ? 'true' : 'false');
  };

  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!user) return; // Ensure user exists before fetching data
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      if (user.role === 'admin') {
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
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [user, authLoading, router, loadDashboardData]);

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setError('');
      await courseAPI.enrollCourse(courseId);
      loadDashboardData(); // Refresh data after enrollment
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    }
  };

  if (authLoading || (loading && !error)) {
    return (
      <DashboardLayout
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        title="Error"
      >
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3">Oops! Something went wrong.</h2>
          <p className="text-slate-600 dark:text-gray-300 mb-8 max-w-md mx-auto">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={toggleSidebar}
      title={user?.role === 'admin' ? "Admin Dashboard" : "Learner Dashboard"}
    >
      <div className="p-6 lg:p-8">
        
        {user?.role === 'admin' ? (
          <AdminDashboard courses={courses} />
        ) : (
          user && <LearnerDashboard
            user={user}
            enrolledCourses={enrolledCourses}
            courses={courses}
            handleEnrollCourse={handleEnrollCourse}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function AdminDashboard({ courses }: { courses: Course[] }) {
  const router = useRouter();
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Total Courses</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{courses.length}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="book-open" className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{courses.filter(c => c.isPublished).length}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="badge-check" className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Drafts</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{courses.filter(c => !c.isPublished).length}</p>
            </div>
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">42</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="users" className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Management Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-8">
        <div className="px-8 py-6 border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Course Management</h2>
              <p className="text-slate-600 dark:text-gray-300 text-sm mt-1">Manage and monitor all courses</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/create-course')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md"
            >
              Create Course
            </button>
          </div>
        </div>
        <div className="p-8">
          {courses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="book-open" className="w-10 h-10 text-slate-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No courses yet</h3>
              <p className="text-slate-600 dark:text-gray-300 mb-8 max-w-md mx-auto">Create your first course to get started with the platform and begin sharing knowledge with learners.</p>
              <button
                onClick={() => router.push('/dashboard/create-course')}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Create Your First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course._id} className="group bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-lg">
                        {course.title}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        course.isPublished 
                          ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300' 
                          : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'
                      }`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm mb-6 line-clamp-3">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-600 px-3 py-1 rounded-full font-medium">
                      {course.sections?.length || 0} sections
                    </span>
                    <button
                      onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors flex items-center"
                    >
                      Edit Course
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LearnerDashboard({
  user,
  enrolledCourses,
  courses,
  handleEnrollCourse
}: {
  user: User; 
  enrolledCourses: UserProgress[];
  courses: Course[];
  handleEnrollCourse: (courseId: string) => Promise<void>;
}) {
  const router = useRouter();

  const coursesCompleted = enrolledCourses.filter(p => p.completed).length;
  const averageProgress = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, p) => acc + (p.overallProgress || 0), 0) / enrolledCourses.length)
    : 0;
  const activeCoursesCount = enrolledCourses.filter(p => !p.completed).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Welcome back, {user.name?.split(' ')[0] || 'Learner'}! 👋
        </h1>
        <p className="text-slate-600 dark:text-gray-300">
          Let's continue your English learning journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Overall Progress</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{averageProgress}%</p>
            </div>
            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="chart-line" className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Courses Completed</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{coursesCompleted}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="badge-check" className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Active Courses</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{activeCoursesCount}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <Icon name="book-open" className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {enrolledCourses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-8">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Learning Progress</h2>
            <p className="text-slate-600 dark:text-gray-300 text-sm mt-1">Continue where you left off</p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrolledCourses.map((progress) => {
                let courseTitle = 'Course Title Missing';
                let courseIdForLink: string | undefined = undefined;

                if (typeof progress.courseId === 'object' && progress.courseId !== null && '_id' in progress.courseId) {
                  const courseStub = progress.courseId as CourseStub;
                  courseTitle = courseStub.title || 'Course Title Missing';
                  courseIdForLink = courseStub._id;
                } else if (typeof progress.courseId === 'string') {
                  const foundCourse = courses.find(c => c._id === progress.courseId);
                  courseTitle = foundCourse?.title || 'Course Title Missing';
                  courseIdForLink = progress.courseId;
                }
                
                if(!courseIdForLink) {
                    return null;
                }
                const courseLink = `/courses/${courseIdForLink}`;

                return (
                  <div key={progress._id} className="group bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-2xl p-5 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {courseTitle}
                      </h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        (progress.overallProgress || 0) === 100 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {(progress.overallProgress || 0) === 100 ? 'Completed' : `${Math.round(progress.overallProgress || 0)}%`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-2.5 mb-4">
                      <div 
                        className={`h-2.5 rounded-full ${(progress.overallProgress || 0) === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.round(progress.overallProgress || 0)}%` }}
                      ></div>
                    </div>
                    <Link
                      href={courseLink}
                      className={`w-full text-center block py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-md ${
                        (progress.overallProgress || 0) === 100 
                          ? 'bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-gray-500'
                          : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white'
                      }`}
                    >
                      {(progress.overallProgress || 0) === 100 ? 'Review' : 'Continue'}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {enrolledCourses.length === 0 && (
         <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-8">
            <div className="w-20 h-20 bg-slate-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="book-open" className="w-10 h-10 text-slate-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">No Enrolled Courses Yet</h3>
            <p className="text-slate-600 dark:text-gray-300 mb-8 max-w-md mx-auto">Start your learning journey by exploring and enrolling in courses.</p>
             <Link href="/dashboard/browse" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-md">
                Browse Courses
            </Link>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
        <div className="px-8 py-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Explore Courses</h2>
          <p className="text-slate-600 dark:text-gray-300 text-sm mt-1">Discover new learning opportunities</p>
        </div>
        <div className="p-8">
          {courses.filter(course =>
            course.isPublished &&
            !enrolledCourses.some(ec => {
              const ecCourseId = typeof ec.courseId === 'string' ? ec.courseId : (ec.courseId as CourseStub)?._id;
              return ecCourseId === course._id;
            })
          ).length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Icon name="badge-check" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">All caught up!</h3>
              <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto">You are enrolled in all available published courses or no new courses are available. Keep learning and check back for new content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.filter(course =>
                course.isPublished &&
                !enrolledCourses.some(ec => {
                  const ecCourseId = typeof ec.courseId === 'string' ? ec.courseId : (ec.courseId as CourseStub)?._id;
                  return ecCourseId === course._id;
                })
              ).map((course) => (
                <div key={course._id} className="group bg-slate-50 dark:bg-gray-700/50 border border-slate-200 dark:border-gray-600 rounded-2xl p-5 hover:shadow-lg transition-all duration-200">
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-lg">
                    {course.title}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-600 px-3 py-1 rounded-full font-medium">
                      {course.sections?.length || 0} sections
                    </span>
                    <button
                      onClick={() => handleEnrollCourse(course._id)}
                      className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ... Icon component definition ...