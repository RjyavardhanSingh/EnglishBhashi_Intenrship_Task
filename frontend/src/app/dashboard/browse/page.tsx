'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { courseAPI, progressAPI, Course, UserProgress } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function BrowseCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  // Initialize sidebar state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      setIsSidebarCollapsed(true);
    }
  }, []);

  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    localStorage.setItem('sidebarCollapsed', !isSidebarCollapsed ? 'true' : 'false');
  };

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get all published courses
      const coursesResponse = await courseAPI.getCourses();
      const publishedCourses = coursesResponse.data.filter((course: { isPublished: any; }) => course.isPublished);
      setCourses(publishedCourses);
      
      // Get user enrollments to determine which courses the user is already enrolled in
      if (user) {
        const progressResponse = await progressAPI.getUserProgress();
        const enrolledIds = progressResponse.data.map((progress: UserProgress) => 
          typeof progress.courseId === 'string' ? progress.courseId : progress.courseId._id
        );
        setEnrolledCourseIds(enrolledIds);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load courses');
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
      loadCourses();
    }
  }, [user, authLoading, router, loadCourses]);

  const handleEnrollCourse = async (courseId: string) => {
    try {
      setEnrolling(courseId);
      await courseAPI.enrollCourse(courseId);
      // Add this course to enrolled courses
      setEnrolledCourseIds(prev => [...prev, courseId]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to enroll in course');
    } finally {
      setEnrolling(null);
    }
  };

  if (authLoading || loading) {
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

  return (
    <DashboardLayout
      isCollapsed={isSidebarCollapsed}
      onToggleCollapse={toggleSidebar}
      title="Browse Courses"
      description="Discover new learning opportunities"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Available Courses</h1>
          <Link
            href="/dashboard/my-courses"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            View My Courses
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.includes(course._id);
              
              return (
                <div 
                  key={course._id} 
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-5">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {course.title}
                    </h2>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 h-16">
                      {course.description}
                    </p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">{course.sections?.length || 0}</span> sections
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {isEnrolled ? (
                      <Link
                        href={`/courses/${course._id}`}
                        className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-4 rounded-md"
                      >
                        Continue Learning
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleEnrollCourse(course._id)}
                        disabled={enrolling === course._id}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md disabled:opacity-75"
                      >
                        {enrolling === course._id ? 'Enrolling...' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 mx-auto rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">No courses available</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              There are no published courses available at the moment.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}