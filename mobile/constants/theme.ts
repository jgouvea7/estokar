/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    background: '#f5f7fb',
    card: '#ffffff',
    text: '#0f172a',
    textMuted: '#64748b',
    primary: '#3b82f6',
    border: '#e2e8f0',
    icon: '#64748b',
    ok: '#10b981',
    low: '#f59e0b',
    critical: '#ef4444',
    tabIconDefault: '#64748b',
    tabIconSelected: '#3b82f6',
    soft: '#f1f5f9',
    surface: '#f8fafc',
  },
  dark: {
    background: '#0f172a',
    card: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#3b82f6',
    border: '#334155',
    icon: '#94a3b8',
    ok: '#10b981',
    low: '#f59e0b',
    critical: '#ef4444',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#3b82f6',
    soft: '#1e293b',
    surface: '#0f172a',
  },
};

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 4,
  },
  strong: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
