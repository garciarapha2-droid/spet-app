/**
 * Theme tokens — Dark & Light
 * Source of truth for all colors. Based on the Pulse Mobile designer spec.
 * Theming only changes colors, never layout or structure.
 */

export interface ThemeColors {
  background: string;
  card: string;
  cardTranslucent: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  borderLight: string;

  primary: string;
  primaryForeground: string;
  primaryBg: string;
  primaryLight: string;
  primaryDark: string;

  destructive: string;
  destructiveBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  info: string;
  infoBg: string;

  emerald400: string;
  emerald500: string;
  amber400: string;
  amber500: string;

  placeholder: string;
  overlay: string;

  tierGoldBg: string;
  tierGoldText: string;
  tierSilverBg: string;
  tierSilverText: string;
  tierBronzeBg: string;
  tierBronzeText: string;
  tierPlatinumBg: string;
  tierPlatinumText: string;

  insideBg: string;
  insideText: string;
  exitedBg: string;
  exitedText: string;
}

export const darkTheme: ThemeColors = {
  background: '#0A0A0F',
  card: '#141420',
  cardTranslucent: 'rgba(20,20,32,0.95)',
  foreground: '#FAFAFA',
  muted: '#1E1E2E',
  mutedForeground: '#8888AA',
  border: '#2A2A3E',
  borderLight: '#1E1E2C',

  primary: '#7C3AED',
  primaryForeground: '#FFFFFF',
  primaryBg: 'rgba(124,58,237,0.12)',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',

  destructive: '#E03131',
  destructiveBg: 'rgba(224,49,49,0.12)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.12)',

  emerald400: '#34D399',
  emerald500: '#10B981',
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  placeholder: '#4A4A5C',
  overlay: 'rgba(0,0,0,0.6)',

  tierGoldBg: 'rgba(217,119,6,0.15)',
  tierGoldText: '#FBBF24',
  tierSilverBg: 'rgba(156,163,175,0.2)',
  tierSilverText: '#D1D5DB',
  tierBronzeBg: 'rgba(234,88,12,0.15)',
  tierBronzeText: '#FB923C',
  tierPlatinumBg: 'rgba(139,92,246,0.15)',
  tierPlatinumText: '#A78BFA',

  insideBg: 'rgba(52,211,153,0.15)',
  insideText: '#34D399',
  exitedBg: 'rgba(136,136,170,0.12)',
  exitedText: '#8888AA',
};

export const lightTheme: ThemeColors = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  cardTranslucent: 'rgba(255,255,255,0.95)',
  foreground: '#0F172A',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  primary: '#7C3AED',
  primaryForeground: '#FFFFFF',
  primaryBg: 'rgba(124,58,237,0.08)',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',

  destructive: '#DC2626',
  destructiveBg: 'rgba(220,38,38,0.08)',
  success: '#10B981',
  successBg: 'rgba(16,185,129,0.08)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.08)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.08)',

  emerald400: '#34D399',
  emerald500: '#10B981',
  amber400: '#FBBF24',
  amber500: '#F59E0B',

  placeholder: '#94A3B8',
  overlay: 'rgba(0,0,0,0.4)',

  tierGoldBg: '#FEF3C7',
  tierGoldText: '#B45309',
  tierSilverBg: '#F3F4F6',
  tierSilverText: '#4B5563',
  tierBronzeBg: '#FFEDD5',
  tierBronzeText: '#C2410C',
  tierPlatinumBg: '#EDE9FE',
  tierPlatinumText: '#6D28D9',

  insideBg: '#D1FAE5',
  insideText: '#065F46',
  exitedBg: '#F1F5F9',
  exitedText: '#64748B',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const fontSize = {
  micro: 9,
  tiny: 10,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  '2xl': 24,
  '3xl': 30,
  title: 28,
} as const;
