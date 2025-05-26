'use client';

import React, { useEffect, useState, useCallback } from 'react'; 
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { courseAPI, progressAPI, Course, UserProgress, CourseStub } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadDashboardData();
    }
  }, [user, authLoading, router, loadDashboardData]);

  const handleEnrollCourse = async (courseId: string) => {
    try {
      await courseAPI.enrollCourse(courseId);
      loadDashboardData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    }
  };

  // Icon component
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
    };

    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[name]}
      </svg>
    );
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="text-slate-600 dark:text-gray-300 mt-4 font-medium">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={user?.role === 'admin' ? 'Admin Dashboard' : 'My Learning Dashboard'}>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {user?.role === 'admin' ? (
            <>
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
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Enrolled Courses</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{enrolledCourses.length}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                    <Icon name="book-open" className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{enrolledCourses.filter(c => c.overallProgress === 100).length}</p>
                  </div>
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                    <Icon name="badge-check" className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Average Progress</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                      {enrolledCourses.length > 0 
                        ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.overallProgress, 0) / enrolledCourses.length)
                        : 0}%
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center">
                    <Icon name="chart-line" className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Study Streak</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">7 days</p>
                  </div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Course Management Section for Admin */}
        {user?.role === 'admin' && (
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
                        <Link
                          href={`/dashboard/courses/${course._id}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold transition-colors flex items-center"
                        >
                          Edit Course
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learning Progress Section for Learners */}
        {user?.role !== 'admin' && enrolledCourses.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 mb-8">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Continue Learning</h2>
              <p className="text-slate-600 dark:text-gray-300 text-sm mt-1">Pick up where you left off</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {enrolledCourses.map((progress) => {
                  let courseTitle: string | undefined;
                  let courseDescription: string | undefined;
                  let courseIdForLink: string | undefined;

                  if (typeof progress.courseId === 'object' && progress.courseId !== null) {
                    const stub = progress.courseId as CourseStub;
                    courseTitle = stub.title;
                    courseDescription = stub.description;
                    courseIdForLink = stub._id;
                  } else if (typeof progress.courseId === 'string') {
                    const foundCourse = courses.find(c => c._id === progress.courseId);
                    if (foundCourse) {
                      courseTitle = foundCourse.title;
                      courseDescription = foundCourse.description;
                      courseIdForLink = foundCourse._id;
                    } else {
                      return null; 
                    }
                  } else {
                    return null; 
                  }

                  if (!courseIdForLink) {
                      return null;
                  }

                  return (
                    <div key={progress._id} className="group bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
                      <div className="mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-lg">
                          {courseTitle || 'Course Title'}
                        </h3>
                        <p className="text-slate-600 dark:text-gray-300 text-sm line-clamp-2">
                          {courseDescription || 'Course Description'}
                        </p>
                      </div>
                      
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-slate-600 dark:text-gray-300">Progress</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {Math.min(Math.max(Math.round(progress.overallProgress || 0), 0), 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(Math.max(progress.overallProgress || 0, 0), 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-gray-400 font-medium">
                          {new Date(progress.lastAccessed).toLocaleDateString()}
                        </span>
                        <Link
                          href={`/courses/${courseIdForLink}`}
                          className={`text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
                            progress.overallProgress === 100
                              ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30'
                          }`}
                        >
                          {progress.overallProgress === 100 ? 'Review' : 'Continue'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Explore Courses Section for Learners */}
        {user?.role !== 'admin' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700">
            <div className="px-8 py-6 border-b border-slate-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Explore Courses</h2>
              <p className="text-slate-600 dark:text-gray-300 text-sm mt-1">Discover new learning opportunities</p>
            </div>
            <div className="p-8">
              {courses.filter(course => 
                !enrolledCourses.some(ec => 
                  (typeof ec.courseId === 'string' ? ec.courseId === course._id : ec.courseId?._id === course._id)
                )
              ).length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Icon name="badge-check" className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">All caught up!</h3>
                  <p className="text-slate-600 dark:text-gray-300 max-w-md mx-auto">You are enrolled in all available courses. Keep learning and check back for new content!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.filter(course => 
                    !enrolledCourses.some(ec => 
                      (typeof ec.courseId === 'string' ? ec.courseId === course._id : ec.courseId?._id === course._id)
                    )
                  ).map((course) => (
                    <div key={course._id} className="group bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-2xl p-6 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
                      <div className="mb-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 text-lg">
                          {course.title}
                        </h3>
                        <p className="text-slate-600 dark:text-gray-300 text-sm line-clamp-3">{course.description}</p>
                      </div>
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
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 bg-white dark:bg-gray-800 border-t border-slate-200 dark:border-gray-700">
        <div className="px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EB</span>
              </div>
              <span className="ml-3 text-lg font-bold text-slate-900 dark:text-white">EnglishBhashi</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              © 2025 EnglishBhashi. Made with ❤️ for English learners worldwide.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
