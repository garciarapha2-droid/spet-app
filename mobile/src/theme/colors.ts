// SPET dark theme — premium nightlife aesthetic
export const colors = {
  // Backgrounds
  bg: '#0A0A0F',
  bgCard: '#14141C',
  bgElevated: '#1C1C28',
  bgInput: '#1C1C28',
  bgOverlay: 'rgba(0,0,0,0.6)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#8E8EA0',
  textMuted: '#5C5C6E',
  textPlaceholder: '#4A4A5C',

  // Primary (purple accent)
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryBg: 'rgba(124,58,237,0.12)',

  // Status
  success: '#1FAA6B',
  successBg: 'rgba(31,170,107,0.12)',
  warning: '#F59F00',
  warningBg: 'rgba(245,159,0,0.12)',
  danger: '#E03131',
  dangerBg: 'rgba(224,49,49,0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.12)',

  // Borders
  border: '#2A2A38',
  borderLight: '#1E1E2C',

  // Special
  vip: '#F59F00',
  nfc: '#3B82F6',
} as const;

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
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  title: 28,
} as const;
