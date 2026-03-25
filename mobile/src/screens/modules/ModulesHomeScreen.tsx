/**
 * Modules Hub — access all dashboards and operational modules.
 * Replaces the web's VenueHomePage module grid.
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { useAuth } from '../../hooks/useAuth';

interface ModuleItem {
  key: string;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  screen: string;
}

const OPERATIONS: ModuleItem[] = [
  { key: 'entry', label: 'Entry', subtitle: 'Guest check-in & NFC', icon: 'log-in', color: colors.primary, screen: 'Entry' },
  { key: 'tabs', label: 'Tabs', subtitle: 'Open tabs & orders', icon: 'credit-card', color: colors.info, screen: 'Pulse' },
  { key: 'tables', label: 'Tables', subtitle: 'Table management', icon: 'grid', color: colors.success, screen: 'TablesStack' },
  { key: 'kitchen', label: 'Kitchen', subtitle: 'KDS ticket board', icon: 'coffee', color: colors.warning, screen: 'KitchenStack' },
];

const DASHBOARDS: ModuleItem[] = [
  { key: 'manager', label: 'Manager', subtitle: 'Staff, shifts, reports', icon: 'bar-chart-2', color: '#3B82F6', screen: 'ManagerDashboard' },
  { key: 'ceo', label: 'CEO', subtitle: 'Revenue, pipeline, users', icon: 'trending-up', color: '#8B5CF6', screen: 'CeoDashboard' },
  { key: 'owner', label: 'Owner', subtitle: 'Finance, insights, growth', icon: 'briefcase', color: '#F59E0B', screen: 'OwnerDashboard' },
];

const SYSTEM: ModuleItem[] = [
  { key: 'settings', label: 'Settings', subtitle: 'App & venue config', icon: 'settings', color: colors.textSecondary, screen: 'SettingsScreen' },
];

export default function ModulesHomeScreen() {
  const nav = useNavigation<any>();
  const { selectedVenue } = useVenue();
  const { logout } = useAuth();

  const handleNav = (screen: string) => {
    nav.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const renderSection = (title: string, items: ModuleItem[]) => (
    <View style={{ marginBottom: spacing.xxl }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.md, paddingHorizontal: spacing.xxl }}>
        {title}
      </Text>
      <View style={{ paddingHorizontal: spacing.lg }}>
        {items.map(item => (
          <TouchableOpacity
            key={item.key}
            onPress={() => handleNav(item.screen)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
              backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg,
              marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
            }}
            data-testid={`module-${item.key}`}
          >
            <View style={{
              width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: item.color + '18',
            }}>
              <Feather name={item.icon as any} size={20} color={item.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{item.label}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>{item.subtitle}</Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: spacing.xxl, paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.xxl, marginBottom: spacing.xxxl }}>
          <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Modules</Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
            {selectedVenue?.name || 'No venue selected'}
          </Text>
        </View>

        {renderSection('Operations', OPERATIONS)}
        {renderSection('Dashboards', DASHBOARDS)}
        {renderSection('System', SYSTEM)}

        {/* Logout */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
              backgroundColor: colors.dangerBg, borderRadius: radius.lg, padding: spacing.lg,
              borderWidth: 1, borderColor: colors.danger + '30',
            }}
          >
            <Feather name="log-out" size={16} color={colors.danger} />
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.danger }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
