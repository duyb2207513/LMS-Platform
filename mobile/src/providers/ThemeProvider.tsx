import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, darkColors, type AppPalette } from '../theme';

const THEME_KEY = 'lms.themePreference';
export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  palette: AppPalette;
  isDark: boolean;
  preference: ThemePreference;
  setPreference(preference: ThemePreference): Promise<void>;
  cycleTheme(): Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') setPreferenceState(saved);
    }).catch(() => undefined);
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
    await Haptics.selectionAsync().catch(() => undefined);
  }, []);

  const cycleTheme = useCallback(async () => {
    const next: ThemePreference = preference === 'system' ? 'light' : preference === 'light' ? 'dark' : 'system';
    await setPreference(next);
  }, [preference, setPreference]);

  const isDark = preference === 'dark' || (preference === 'system' && systemScheme === 'dark');
  const value = useMemo(() => ({ palette: isDark ? darkColors : colors, isDark, preference, setPreference, cycleTheme }), [cycleTheme, isDark, preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider');
  return value;
}

export const themePreferenceLabel: Record<ThemePreference, string> = {
  system: 'Theo thiết bị',
  light: 'Sáng',
  dark: 'Tối',
};
