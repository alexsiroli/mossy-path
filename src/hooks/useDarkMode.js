import { useEffect, useState } from 'react';

export default function useDarkMode() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return true; // Default to dark mode
    const ls = localStorage.getItem('theme');
    if (ls) return ls === 'dark';
    return true; // Default to dark mode instead of system preference
  });

  useEffect(() => {
    const root = document.documentElement;
    if (enabled) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [enabled]);

  return [enabled, setEnabled];
} 