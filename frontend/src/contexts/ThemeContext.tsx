'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeType = 'light' | 'dark' | null;

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setForcedTheme: (theme: ThemeType) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
  setForcedTheme: () => {},
  isLoaded: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [forcedTheme, setForcedTheme] = useState<ThemeType>(null);

  useEffect(() => {
    // Run after hydration
    setIsLoaded(true);
    
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      
      setDarkMode(shouldBeDark);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    
    const theme = forcedTheme || (darkMode ? 'dark' : 'light');
    
    if (typeof document !== 'undefined') {
      const html = document.documentElement;
      
      if (theme === 'dark') {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
      } else {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
      }
    }
  }, [darkMode, forcedTheme, isLoaded]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const handleSetForcedTheme = (theme: ThemeType) => {
    setForcedTheme(theme);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        darkMode: forcedTheme === 'dark' || (forcedTheme === null && darkMode), 
        toggleDarkMode, 
        setForcedTheme: handleSetForcedTheme,
        isLoaded
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}