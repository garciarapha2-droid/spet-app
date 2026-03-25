/**
 * Settings Screen — app config, venue info, logout.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { selectedVenue, clearVenue } = useVenue();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSwitchVenue = () => {
    if (clearVenue) clearVenue();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
        {/* Header */}
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.xxxl }}>Settings</Text>

        {/* User Info */}
        <Card style={{ marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <View style={{
              width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryBg,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Feather name="user" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{user?.email || 'User'}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{user?.role || 'Member'}</Text>
            </View>
          </View>
        </Card>

        {/* Venue Info */}
        {selectedVenue && (
          <Card style={{ marginBottom: spacing.xxl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
              <Feather name="map-pin" size={16} color={colors.warning} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.text }}>Active Venue</Text>
            </View>
            <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>{selectedVenue.name}</Text>
            <TouchableOpacity onPress={handleSwitchVenue} style={{ marginTop: spacing.md }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>Switch Venue</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Menu Items */}
        <SettingsItem icon="shield" label="Privacy Policy" onPress={() => Linking.openURL('https://spetap.com/privacy')} />
        <SettingsItem icon="help-circle" label="Support" onPress={() => Linking.openURL('https://spetap.com/support')} />
        <SettingsItem icon="info" label="About" onPress={() => Alert.alert('SPET Mobile', 'Version 1.0.0')} />

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
            backgroundColor: colors.dangerBg, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xxl,
            borderWidth: 1, borderColor: colors.danger + '30',
          }}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.danger }}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SettingsItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border + '40',
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Feather name={icon as any} size={18} color={colors.textSecondary} />
        <Text style={{ fontSize: fontSize.md, color: colors.text }}>{label}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}
