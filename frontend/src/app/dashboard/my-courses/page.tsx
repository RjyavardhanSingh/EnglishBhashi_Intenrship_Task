'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import { progressAPI, courseAPI, UserProgress } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const { darkMode } = useTheme();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const loadEnrolledCourses = useCallback(async () => {
    try {
      setLoading(true);
      const progressResponse = await progressAPI.getUserProgress();
      setEnrolledCourses(progressResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load your courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      loadEnrolledCourses();
    }
  }, [user, authLoading, router, loadEnrolledCourses]);

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
      title="My Courses"
      description="Track your learning progress"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Enrolled Courses</h1>
          <Link
            href="/dashboard/browse" // Changed from "/courses"
            className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700"
          >
            Browse More Courses
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {enrolledCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((progress) => {
              // Type guard: Check if courseId is an object (CourseStub)
              if (typeof progress.courseId === 'string' || !progress.courseId) {
                // Handle cases where courseId might be a string or undefined/null
                // For now, we'll skip rendering this item or you can show a placeholder
                console.warn('Encountered progress item with string or invalid courseId:', progress);
                return null; 
              }

              // If we reach here, TypeScript knows progress.courseId is a CourseStub
              const courseDetails = progress.courseId; // Now courseDetails is of type CourseStub

              return (
                <div 
                  key={progress._id} 
                  className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        progress.completed 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      }`}>
                        {progress.completed ? 'Completed' : 'In Progress'}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {progress.lastAccessed ? new Date(progress.lastAccessed).toLocaleDateString() : 'Not started'}
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {courseDetails.title} {/* Use courseDetails here */}
                    </h2>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                      {courseDetails.description} {/* Use courseDetails here */}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress.overallProgress || 0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${Math.round(progress.overallProgress || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <Link
                      href={`/courses/${courseDetails._id}`}
                      className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2 px-4 rounded-md"
                    >
                      {progress.completed ? 'Review Course' : 'Continue Learning'}
                    </Link>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">No enrolled courses</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              You haven't enrolled in any courses yet.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/browse" // Changed from "/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Courses
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}