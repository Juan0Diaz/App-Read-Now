import { useState, useEffect } from 'react';

const getInitialDarkMode = () => {
  if (typeof window === 'undefined') return false;

  const saved = localStorage.getItem('darkMode');
  if (saved !== null) {
    return saved === 'true';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

let sharedDarkMode = getInitialDarkMode();
const listeners = new Set<() => void>();

const notifyDarkModeChange = (value: boolean) => {
  sharedDarkMode = value;
  listeners.forEach(listener => listener());
};

export function useDarkMode() {
  const [isDark, setIsDarkState] = useState<boolean>(() => sharedDarkMode);

  useEffect(() => {
    const listener = () => setIsDarkState(sharedDarkMode);
    listeners.add(listener);
    listener();

    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark]);

  const setIsDark = (value: boolean | ((prev: boolean) => boolean)) => {
    const nextValue = typeof value === 'function'
      ? value(sharedDarkMode)
      : value;

    notifyDarkModeChange(nextValue);
  };

  return { isDark, setIsDark };
}
