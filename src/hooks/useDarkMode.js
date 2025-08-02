import { useEffect, useState } from 'react';

export default function useDarkMode() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ls = localStorage.getItem('theme');
    if (ls) return ls === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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