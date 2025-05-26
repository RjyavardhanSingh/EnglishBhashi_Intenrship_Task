'use client';

import { useEffect } from 'react';

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Apply the transition override class immediately
    document.documentElement.classList.add('page-transition-override');
    
    // Force layout recalculation
    document.body.offsetHeight;
    
    // Remove the override class after a short delay
    const timeoutId = setTimeout(() => {
      document.documentElement.classList.remove('page-transition-override');
    }, 300);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="course-layout-wrapper">
      {children}
    </div>
  );
}