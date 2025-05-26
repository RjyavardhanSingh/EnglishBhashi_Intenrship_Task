'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Form settings
  const [settings, setSettings] = useState({
    siteTitle: 'EnglishBhashi',
    siteDescription: 'Learn English effectively with our interactive platform',
    enableRegistration: true,
    enablePublicCourses: true,
    maintenanceMode: false,
    emailNotifications: true
  });

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
    // Store preference in localStorage
    localStorage.setItem('sidebarCollapsed', !isSidebarCollapsed ? 'true' : 'false');
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }
      
      setLoading(false);
    }
  }, [user, authLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would send settings to an API in a real app
    alert('Settings saved successfully.');
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
      title="Platform Settings"
      description="Configure your EnglishBhashi platform settings"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
                {/* General Settings */}
                <div className="space-y-6 pt-8 sm:pt-10">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      General Settings
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Basic platform configuration
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-4">
                      <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Platform Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="siteTitle"
                          id="siteTitle"
                          value={settings.siteTitle}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Platform Description
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="siteDescription"
                          name="siteDescription"
                          rows={3}
                          value={settings.siteDescription}
                          onChange={handleInputChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Brief description for your platform.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Platform Toggles */}
                <div className="space-y-6 pt-8 sm:pt-10">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      Platform Controls
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Enable or disable key platform features
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="enableRegistration"
                          name="enableRegistration"
                          type="checkbox"
                          checked={settings.enableRegistration}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="enableRegistration" className="font-medium text-gray-700 dark:text-gray-300">
                          Enable User Registration
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Allow new users to register for accounts
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="enablePublicCourses"
                          name="enablePublicCourses"
                          type="checkbox"
                          checked={settings.enablePublicCourses}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="enablePublicCourses" className="font-medium text-gray-700 dark:text-gray-300">
                          Enable Public Courses
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Allow non-registered users to browse available courses
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="maintenanceMode"
                          name="maintenanceMode"
                          type="checkbox"
                          checked={settings.maintenanceMode}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="maintenanceMode" className="font-medium text-gray-700 dark:text-gray-300">
                          Enable Maintenance Mode
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Put the site in maintenance mode (only admins can access)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="emailNotifications"
                          name="emailNotifications"
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={handleInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="emailNotifications" className="font-medium text-gray-700 dark:text-gray-300">
                          Enable Email Notifications
                        </label>
                        <p className="text-gray-500 dark:text-gray-400">
                          Send email notifications for system events
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  type="button"
                  className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Demo notice */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-400 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm">
                This is a demo settings page. In a real application, these settings would be saved to your database.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
