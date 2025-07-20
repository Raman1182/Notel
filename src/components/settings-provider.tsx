'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { SettingsContext, type SettingsContextProps } from '@/contexts/settings-context';

const DEFAULT_FONT_SIZE = 16; // Default base font size in pixels

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const storedFontSize = localStorage.getItem('Notel-fontSize');
      return storedFontSize ? parseInt(storedFontSize, 10) : DEFAULT_FONT_SIZE;
    }
    return DEFAULT_FONT_SIZE;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedHighContrast = localStorage.getItem('Notel-highContrast');
      return storedHighContrast === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('Notel-fontSize', fontSize.toString());
      document.documentElement.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('Notel-highContrast', highContrast.toString());
      if (highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    }
  }, [highContrast]);
  
  // Ensure initial classes and styles are set on mount for SSR consistency
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, []);


  const value: SettingsContextProps = {
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
