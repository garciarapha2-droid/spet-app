/**
 * Entry Home — main operational screen.
 * Two actions: Scan NFC or Search Guest.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { useWebSocket } from '../../hooks/useWebSocket';
import { SectionHeader, StatCard } from '../../components/ui';
import * as pulseService from '../../services/pulseService';

export default function EntryHomeScreen() {
  const navigation = useNavigation<any>();
  const { selectedVenue, venueId } = useVenue();
  const [todayCount, setTodayCount] = useState(0);

  // WebSocket for real-time updates
  const { connected } = useWebSocket(venueId, useCallback((event: any) => {
    if (event.type === 'guest_entered' || event.type === 'nfc_scanned') {
      setTodayCount(c => c + 1);
    }
  }, []));

  // Load today's count on focus
  React.useEffect(() => {
    if (!venueId) return;
    pulseService.getTodayEntries(venueId).then(d => {
      setTodayCount(d.entries?.length || 0);
    }).catch(() => {});
  }, [venueId]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xxl }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xxxl }}>
        <View>
          <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>
            Entry
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
            {selectedVenue?.name || 'No venue'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: connected ? colors.success : colors.danger,
            }}
          />
          <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
            {connected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxxl }}>
        <StatCard label="Today" value={todayCount} color={colors.primary} />
      </View>

      {/* Action Cards */}
      <View style={{ gap: spacing.lg, flex: 1, justifyContent: 'center' }}>
        {/* NFC Scan */}
        <TouchableOpacity
          onPress={() => navigation.navigate('NfcScan')}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.primaryBg,
            borderRadius: radius.xl,
            padding: spacing.xxl,
            borderWidth: 1,
            borderColor: colors.primary,
            minHeight: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>
            {'\u{1F4F6}'}
          </Text>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.primary }}>
            Scan NFC
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            Tap a wristband to identify guest
          </Text>
        </TouchableOpacity>

        {/* Search Guest */}
        <TouchableOpacity
          onPress={() => navigation.navigate('GuestSearch')}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            padding: spacing.xxl,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 120,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 40, marginBottom: spacing.md }}>
            {'\u{1F50D}'}
          </Text>
          <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
            Search Guest
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
            Find by name, phone, or email
          </Text>
        </TouchableOpacity>

        {/* New Guest */}
        <TouchableOpacity
          onPress={() => navigation.navigate('GuestIntake')}
          activeOpacity={0.7}
          style={{
            backgroundColor: colors.bgCard,
            borderRadius: radius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            minHeight: 56,
          }}
        >
          <Text style={{ fontSize: fontSize.lg, color: colors.textSecondary }}>+</Text>
          <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary }}>
            New Guest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
