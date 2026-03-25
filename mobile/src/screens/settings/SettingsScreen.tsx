/**
 * Settings Screen — Production-ready.
 * User info, venue, privacy, support, version, logout.
 */
import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { ScreenWrapper, ScreenHeader } from '../../components/ProductionUI';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import Constants from 'expo-constants';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { selectedVenue, clearVenue } = useVenue();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScreenWrapper testID="settings-screen">
      <ScreenHeader title="Settings" />

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
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {user?.email || 'User'}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{user?.role || 'Member'}</Text>
          </View>
        </View>
      </Card>

      {/* Active Venue */}
      {selectedVenue && (
        <Card style={{ marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            <Feather name="map-pin" size={16} color={colors.warning} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>Active Venue</Text>
          </View>
          <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>{selectedVenue.name}</Text>
          <TouchableOpacity
            onPress={clearVenue}
            activeOpacity={0.7}
            accessibilityLabel="Switch venue"
            style={{ marginTop: spacing.md }}
          >
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>Switch Venue</Text>
          </TouchableOpacity>
        </Card>
      )}

      {/* Menu Items */}
      <View style={{ marginBottom: spacing.xxl }}>
        <SettingsItem icon="shield" label="Privacy Policy" onPress={() => Linking.openURL('https://spetap.com/privacy')} />
        <SettingsItem icon="help-circle" label="Support" onPress={() => Linking.openURL('https://spetap.com/support')} />
        <SettingsItem icon="info" label="About" onPress={() => Alert.alert('SPET', `Version ${APP_VERSION}\n${Platform.OS} ${Platform.Version}`)} />
      </View>

      {/* Version */}
      <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xxl }}>
        SPET v{APP_VERSION}
      </Text>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Logout"
        data-testid="settings-logout-button"
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
          backgroundColor: colors.dangerBg, borderRadius: radius.lg, padding: spacing.lg,
          borderWidth: 1, borderColor: colors.danger + '30',
        }}
      >
        <Feather name="log-out" size={16} color={colors.danger} />
        <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.danger }}>Logout</Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

function SettingsItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Feather name={icon as any} size={18} color={colors.textSecondary} />
        <Text style={{ fontSize: fontSize.md, color: colors.text }}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
