export const colors = {
  primary: '#6335f5',
  primaryDark: '#4a28c9',
  magenta: '#b20cff',
  amber: '#ffbd22',
  green: '#18d69b',
  ink: '#17223b',
  muted: '#667085',
  border: '#e8e9f2',
  surface: '#ffffff',
  background: '#f7f7fc',
  danger: '#dc3545',
  warning: '#f59e0b',
  success: '#16a34a',
} as const;

export type AppPalette = { [Key in keyof typeof colors]: string };

export const darkColors: AppPalette = {
  primary: '#9b7cff',
  primaryDark: '#c3b2ff',
  magenta: '#d568ff',
  amber: '#ffd166',
  green: '#42e2b8',
  ink: '#f4f5fb',
  muted: '#aeb4c3',
  border: '#303548',
  surface: '#202431',
  background: '#141720',
  danger: '#ff6b78',
  warning: '#ffbd4a',
  success: '#45d690',
};

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '900' as const },
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '900' as const },
  title: { fontSize: 18, lineHeight: 25, fontWeight: '800' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '700' as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '500' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
} as const;

export const shadows = {
  soft: {
    shadowColor: '#17223b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#3a228c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// Backwards-compatible alias for existing screens while they migrate to tokens.
export const shadow = shadows.elevated;
