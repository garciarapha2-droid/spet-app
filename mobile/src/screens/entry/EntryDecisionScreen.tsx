/**
 * Entry Decision Screen — themed. Allow or Deny guest entry.
 * After allowing: opens tab → navigates to Menu directly.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { Button, Card, Chip, LoadingOverlay } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as pulseService from '../../services/pulseService';
import * as tapService from '../../services/tapService';
import type { ScanGuest } from '../../services/nfcService';

export default function EntryDecisionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { venueId } = useVenue();
  const [loading, setLoading] = useState(false);

  const guest: ScanGuest = route.params?.guest;
  const tab = route.params?.tab;
  const source: string = route.params?.source || 'search';

  if (!guest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>No guest data</Text>
      </View>
    );
  }

  const isBlocked = guest.flags?.includes('blocked');
  const isFlagged = guest.flags?.includes('flagged');

  const handleDecision = async (decision: 'allowed' | 'denied') => {
    setLoading(true);
    try {
      await pulseService.recordEntryDecision({
        guest_id: guest.id, venue_id: venueId, decision,
        entry_type: guest.tags?.includes('vip') ? 'vip' : 'consumption_only',
      });
      if (decision === 'allowed') {
        // Auto-open tab and go directly to Menu
        try {
          const tabResult = await tapService.openTab({
            venue_id: venueId,
            guest_name: guest.name,
            guest_id: guest.id,
            session_type: source === 'nfc' ? 'nfc' : 'walk_in',
          });
          const sessionId = tabResult.session_id || tabResult.id;
          const tabNumber = tabResult.tab_number;
          Alert.alert('Entry Allowed', `${guest.name} is in. Tab #${tabNumber || '?'} opened.`, [{
            text: 'Go to Menu',
            onPress: () => {
              navigation.navigate('Tabs', {
                screen: 'TabsMain',
                params: {
                  activeSessionId: sessionId,
                  activeGuestName: guest.name,
                  activeTabNumber: tabNumber,
                },
              });
            },
          }]);
        } catch {
          // Tab creation failed — still allowed entry
          Alert.alert('Entry Allowed', `${guest.name} is in. (Tab could not be auto-created)`, [{ text: 'OK', onPress: () => navigation.popToTop() }]);
        }
      } else {
        Alert.alert('Entry Denied', `${guest.name} was denied entry.`, [{ text: 'OK', onPress: () => navigation.popToTop() }]);
      }
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to record decision'); }
    setLoading(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LoadingOverlay visible={loading} />
      <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 120 }}>
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40, backgroundColor: colors.muted,
            justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
            borderWidth: 2, borderColor: isBlocked ? colors.destructive : isFlagged ? colors.warning : colors.border,
          }}>
            <Text style={{ fontSize: 32, color: colors.foreground, fontWeight: '700' }}>{guest.name?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.foreground }}>{guest.name}</Text>
          {guest.phone && <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>{guest.phone}</Text>}
        </View>

        {(guest.risk_chips?.length > 0 || guest.value_chips?.length > 0) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl, justifyContent: 'center' }}>
            {guest.risk_chips?.map((chip: any, i: number) => (
              <Chip key={`risk-${i}`} label={chip.label} color={chip.severity === 'critical' ? colors.destructive : colors.warning} bgColor={chip.severity === 'critical' ? colors.destructiveBg : colors.warningBg} />
            ))}
            {guest.value_chips?.map((chip: any, i: number) => (
              <Chip key={`val-${i}`} label={chip.label} color={chip.type === 'vip' ? colors.warning : colors.primary} bgColor={chip.type === 'vip' ? colors.warningBg : colors.primaryBg} />
            ))}
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl }}>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.foreground, fontVariant: ['tabular-nums'] }}>{guest.visits}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>Visits</Text>
          </Card>
          <Card style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.success, fontVariant: ['tabular-nums'] }}>${guest.spend_total}</Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>Spent</Text>
          </Card>
        </View>

        {tab?.has_open_tab && (
          <Card style={{ marginBottom: spacing.xl, borderColor: colors.info, borderWidth: 1 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: fontSize.sm, color: colors.info, fontWeight: '600' }}>Open Tab</Text>
                <Text style={{ fontSize: fontSize.xxl, fontWeight: '700', color: colors.foreground, marginTop: 2, fontVariant: ['tabular-nums'] }}>#{tab.number}</Text>
              </View>
              <Text style={{ fontSize: fontSize.xl, fontWeight: '600', color: colors.foreground, fontVariant: ['tabular-nums'] }}>${tab.total.toFixed(2)}</Text>
            </View>
          </Card>
        )}

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
            Identified via {source === 'nfc' ? 'NFC wristband' : 'manual search'}
          </Text>
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xxl, paddingBottom: spacing.xxxl,
        backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border, gap: spacing.md,
      }}>
        {isBlocked ? (
          <>
            <Card style={{ backgroundColor: colors.destructiveBg, borderColor: colors.destructive, alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.destructive }}>This guest is BLOCKED</Text>
            </Card>
            <Button title="Deny Entry" variant="danger" onPress={() => handleDecision('denied')} />
          </>
        ) : (
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button title="Deny" variant="danger" onPress={() => handleDecision('denied')} style={{ flex: 1 }} />
            <Button title="Allow Entry" variant="success" onPress={() => handleDecision('allowed')} style={{ flex: 2 }} />
          </View>
        )}
      </View>
    </View>
  );
}
