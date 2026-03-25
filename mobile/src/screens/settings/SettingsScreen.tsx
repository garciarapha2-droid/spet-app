/**
 * Settings Screen — redesigned with theme toggle + premium style.
 * Part of the "More" tab.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import TopNavbar from '../../components/TopNavbar';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { ScreenWrapper } from '../../components/ProductionUI';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function SettingsScreen() {
  const { colors, mode, isDark, setThemeMode } = useTheme();
  const { user, logout } = useAuth();
  const { selectedVenue, clearVenue } = useVenue();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const themeOptions: { key: ThemeMode; label: string; icon: string }[] = [
    { key: 'dark', label: 'Dark', icon: 'moon' },
    { key: 'light', label: 'Light', icon: 'sun' },
    { key: 'system', label: 'System', icon: 'smartphone' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="settings-screen">
      {/* Top Navbar */}
      <TopNavbar title="Settings" />

      <ScreenWrapper padTop={false}>
        <View style={{ paddingTop: spacing.xxl }}>
          {/* User Info */}
          <Card style={{ marginBottom: spacing.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <View style={{
                width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryBg,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.primary }}>
                  {(user?.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
                  {user?.email || 'User'}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>{user?.role || 'Member'}</Text>
              </View>
            </View>
          </Card>

          {/* Theme Toggle */}
          <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Appearance
          </Text>
          <Card style={{ marginBottom: spacing.xxl, padding: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {themeOptions.map(opt => {
                const active = mode === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => setThemeMode(opt.key)}
                    activeOpacity={0.7}
                    data-testid={`theme-${opt.key}`}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.xs,
                      paddingVertical: spacing.md,
                      borderRadius: radius.md,
                      backgroundColor: active ? colors.primaryBg : 'transparent',
                      borderWidth: active ? 1 : 0,
                      borderColor: colors.primary + '40',
                    }}
                  >
                    <Feather name={opt.icon as any} size={14} color={active ? colors.primary : colors.mutedForeground} />
                    <Text style={{
                      fontSize: fontSize.sm, fontWeight: active ? '700' : '500',
                      color: active ? colors.primary : colors.mutedForeground,
                    }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Active Venue */}
          {selectedVenue && (
            <Card style={{ marginBottom: spacing.xxl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
                <Feather name="map-pin" size={16} color={colors.warning} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>Active Venue</Text>
              </View>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground }}>{selectedVenue.name}</Text>
              <TouchableOpacity onPress={clearVenue} activeOpacity={0.7} style={{ marginTop: spacing.md }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>Switch Venue</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Menu Items */}
          <View style={{ marginBottom: spacing.xxl }}>
            <SettingsItem colors={colors} icon="shield" label="Privacy Policy" onPress={() => Linking.openURL('https://spetap.com/privacy')} />
            <SettingsItem colors={colors} icon="help-circle" label="Support" onPress={() => Linking.openURL('https://spetap.com/support')} />
            <SettingsItem colors={colors} icon="info" label="About" onPress={() => Alert.alert('SPET', `Version ${APP_VERSION}\n${Platform.OS} ${Platform.Version}`)} />
          </View>

          {/* Version */}
          <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, textAlign: 'center', marginBottom: spacing.xxl }}>
            SPET v{APP_VERSION}
          </Text>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            data-testid="settings-logout-button"
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
              backgroundColor: colors.destructiveBg, borderRadius: radius.lg, padding: spacing.lg,
              borderWidth: 1, borderColor: colors.destructive + '30',
            }}
          >
            <Feather name="log-out" size={16} color={colors.destructive} />
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.destructive }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    </View>
  );
}

function SettingsItem({ colors, icon, label, onPress }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Feather name={icon} size={18} color={colors.mutedForeground} />
        <Text style={{ fontSize: fontSize.md, color: colors.foreground }}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}
