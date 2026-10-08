import { useCallback, useEffect, useState } from 'react';

// Also read by the inline script in index.html (applies the class before first paint).
const DARK_MODE_KEY = 'rb-dark-mode';

const prefersDark = (): boolean => window.matchMedia('(prefers-color-scheme: dark)').matches;

const readInitialDarkMode = (): boolean => {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    return saved === null ? prefersDark() : saved === 'true';
  } catch {
    return prefersDark();
  }
};

/**
 * Dark mode. Follows the OS setting until the user picks a mode explicitly;
 * only an explicit choice is saved, so a later OS change still applies otherwise.
 */
export const useTheme = () => {
  const [isDarkMode, setIsDarkModeState] = useState(readInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const setIsDarkMode = useCallback((dark: boolean) => {
    setIsDarkModeState(dark);
    try {
      localStorage.setItem(DARK_MODE_KEY, String(dark));
    } catch {
      /* storage blocked — preference applies to this session only */
    }
  }, []);

  return { isDarkMode, setIsDarkMode };
};
