'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'dark' | 'light'; // The resolved theme (system resolved to actual theme)
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  actualTheme: 'dark',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get theme from localStorage on initial load (client-side only)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        return (stored as Theme) || defaultTheme;
      } catch {
        // Fallback if localStorage is not available
        return defaultTheme;
      }
    }
    return defaultTheme;
  });

  const [mounted, setMounted] = useState(false);

  // Get the actual resolved theme (system -> dark/light)
  const getResolvedTheme = (): 'dark' | 'light' => {
    if (theme === 'system' && enableSystem && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'system' ? 'dark' : theme; // Default to dark if system but no window
  };

  const [actualTheme, setActualTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return getResolvedTheme();
    }
    return 'dark'; // Default for SSR
  });

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Update actualTheme when theme changes or system preference changes
  useEffect(() => {
    const resolved = getResolvedTheme();
    setActualTheme(resolved);

    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Remove both theme classes
      root.classList.remove('light', 'dark');
      
      // Add the resolved theme class
      if (attribute === 'class') {
        root.classList.add(resolved);
      } else if (attribute === 'data-theme') {
        root.setAttribute('data-theme', resolved);
      }
    }
  }, [theme, enableSystem, attribute]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || theme !== 'system' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      const resolved = getResolvedTheme();
      setActualTheme(resolved);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      
      if (attribute === 'class') {
        root.classList.add(resolved);
      } else if (attribute === 'data-theme') {
        root.setAttribute('data-theme', resolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, enableSystem, attribute]);

  const value: ThemeProviderState = {
    theme,
    actualTheme,
    setTheme: (newTheme: Theme) => {
      setTheme(newTheme);
      
      // Try to save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, newTheme);
        } catch {
          // Ignore localStorage errors
          console.warn('Failed to save theme to localStorage');
        }
      }
    },
  };

  // Always render children, but with a fallback theme for SSR
  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};