import type { Dispatch, SetStateAction } from 'react';
import { createContext, useContext } from 'react';

export interface SettingsContextProps {
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  highContrast: boolean;
  setHighContrast: Dispatch<SetStateAction<boolean>>;
}

export const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export function useSettings(): SettingsContextProps {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
