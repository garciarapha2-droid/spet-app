/**
 * Backward-compatible color exports.
 * Screens not yet migrated to useTheme() still import from here.
 * Uses dark theme values as the static fallback.
 */
import { darkTheme, spacing as sp, radius as rad, fontSize as fs } from './themes';

export const colors = {
  bg: darkTheme.background,
  bgCard: darkTheme.card,
  bgElevated: darkTheme.muted,
  bgInput: darkTheme.muted,
  bgOverlay: darkTheme.overlay,
  text: darkTheme.foreground,
  textSecondary: darkTheme.mutedForeground,
  textMuted: darkTheme.mutedForeground,
  textPlaceholder: darkTheme.placeholder,
  primary: darkTheme.primary,
  primaryLight: darkTheme.primaryLight,
  primaryDark: darkTheme.primaryDark,
  primaryBg: darkTheme.primaryBg,
  success: darkTheme.success,
  successBg: darkTheme.successBg,
  warning: darkTheme.warning,
  warningBg: darkTheme.warningBg,
  danger: darkTheme.destructive,
  dangerBg: darkTheme.destructiveBg,
  info: darkTheme.info,
  infoBg: darkTheme.infoBg,
  border: darkTheme.border,
  borderLight: darkTheme.borderLight,
  vip: darkTheme.warning,
  nfc: darkTheme.info,
} as const;

export const spacing = sp;
export const radius = rad;
export const fontSize = fs;
