/**
 * NFC Result Screen — Post-scan decision point.
 *
 * Shows guest info + historical data (visits, lifetime spend).
 * Current session ALWAYS starts at $0.
 * Actions: "Open Tab & Go to Menu" or "View Profile"
 * If tag is unregistered → prompt to register.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { useVenue } from '../../hooks/useVenue';
import * as tapService from '../../services/tapService';

export default function NfcResultScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();

  const guest = route.params?.guest;
  const source: string = route.params?.source || 'nfc';
  const tagUid: string | undefined = route.params?.tagUid;
  const isUnregistered: boolean = route.params?.unregistered || false;

  const [openingTab, setOpeningTab] = useState(false);

  // --- Unregistered tag ---
  if (isUnregistered) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, alignSelf: 'flex-start' }}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.xxl }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: colors.warningBg, borderWidth: 2, borderColor: colors.warning + '40',
            alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl,
          }}>
            <Feather name="wifi" size={36} color={colors.warning} />
          </View>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground, textAlign: 'center' }}>
            New NFC Tag
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }}>
            This tag isn't registered yet.{'\n'}Assign it to an existing or new guest.
          </Text>
          {tagUid && (
            <View style={{
              marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
              borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
            }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, fontFamily: 'monospace' }}>
                {tagUid}
              </Text>
            </View>
          )}
          <View style={{ width: '100%', gap: spacing.md, marginTop: spacing.xxxl }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('GuestIntake', { tagUid })}
              data-testid="nfc-register-new-guest"
              style={{
                backgroundColor: colors.primary, borderRadius: radius.xl, height: 56,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm,
              }}
            >
              <Feather name="user-plus" size={18} color={colors.primaryForeground} />
              <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primaryForeground }}>
                Register New Guest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('GuestSearch', { tagUid, mode: 'assign' })}
              data-testid="nfc-assign-existing"
              style={{
                backgroundColor: colors.card, borderRadius: radius.xl, height: 56,
                borderWidth: 1, borderColor: colors.border,
                alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: spacing.sm,
              }}
            >
              <Feather name="search" size={18} color={colors.foreground} />
              <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.foreground }}>
                Assign to Existing Guest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- Guest found ---
  if (!guest) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>No guest data</Text>
      </View>
    );
  }

  const tierColor = () => {
    const t = (guest.tier || guest.tags?.find((tag: string) => ['gold', 'silver', 'bronze', 'platinum'].includes(tag.toLowerCase())) || '').toLowerCase();
    if (t === 'gold') return { bg: colors.tierGoldBg, text: colors.tierGoldText, label: 'GOLD' };
    if (t === 'silver') return { bg: colors.tierSilverBg, text: colors.tierSilverText, label: 'SILVER' };
    if (t === 'bronze') return { bg: colors.tierBronzeBg, text: colors.tierBronzeText, label: 'BRONZE' };
    if (t === 'platinum') return { bg: colors.tierPlatinumBg, text: colors.tierPlatinumText, label: 'PLATINUM' };
    return null;
  };

  const tier = tierColor();
  const isVip = guest.tags?.includes('vip');
  const isBlocked = guest.flags?.includes('blocked');
  const isFlagged = guest.flags?.includes('flagged');
  const initials = (guest.name || 'G').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleOpenTabAndGoToMenu = async () => {
    if (isBlocked) {
      Alert.alert('Blocked', 'This guest is blocked and cannot open a tab.');
      return;
    }
    setOpeningTab(true);
    try {
      const result = await tapService.openTab({
        venue_id: venueId,
        guest_name: guest.name,
        guest_id: guest.id,
        nfc_card_id: tagUid,
        session_type: 'nfc',
      });
      const sessionId = result.session_id || result.id;
      const tabNumber = result.tab_number;
      // Navigate to Tabs tab with the menu screen, passing session context
      navigation.navigate('Tabs', {
        screen: 'TabsMain',
        params: {
          activeSessionId: sessionId,
          activeGuestName: guest.name,
          activeTabNumber: tabNumber,
        },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to open tab');
    }
    setOpeningTab(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="nfc-result-screen">
      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {source === 'nfc' ? 'NFC Scan' : 'Guest Found'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 180 }}>
        {/* Guest Avatar + Name */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: isBlocked ? colors.destructiveBg : isFlagged ? colors.warningBg : colors.primaryBg,
            borderWidth: 3, borderColor: isBlocked ? colors.destructive : isFlagged ? colors.warning : colors.primary + '40',
            alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
          }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: isBlocked ? colors.destructive : colors.primary }}>
              {initials}
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground }}>
            {guest.name}
          </Text>
          {guest.phone && (
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>
              {guest.phone}
            </Text>
          )}

          {/* Badges */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
            {tier && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: tier.bg }}>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: tier.text }}>{tier.label}</Text>
              </View>
            )}
            {isVip && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.warningBg }}>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.warning }}>VIP</Text>
              </View>
            )}
            {isBlocked && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.destructiveBg }}>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.destructive }}>BLOCKED</Text>
              </View>
            )}
            {isFlagged && (
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.warningBg }}>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.warning }}>FLAGGED</Text>
              </View>
            )}
          </View>
        </View>

        {/* Historical Stats — clearly labeled */}
        <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
          LIFETIME STATS
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border + '60', alignItems: 'center',
          }}>
            <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] }}>
              {guest.visits || 0}
            </Text>
            <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }}>Visits</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border + '60', alignItems: 'center',
          }}>
            <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.emerald500, fontVariant: ['tabular-nums'] }}>
              ${Number(guest.spend_total || 0).toFixed(0)}
            </Text>
            <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }}>Total Spend</Text>
          </View>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border + '60', alignItems: 'center',
          }}>
            <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
              ${guest.visits > 0 ? (Number(guest.spend_total || 0) / guest.visits).toFixed(0) : '0'}
            </Text>
            <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }}>Avg/Visit</Text>
          </View>
        </View>

        {/* New Session Banner */}
        <View style={{
          backgroundColor: colors.primaryBg, borderRadius: radius.xl, padding: spacing.lg,
          borderWidth: 1, borderColor: colors.primary + '25', marginBottom: spacing.xxl,
          flexDirection: 'row', alignItems: 'center', gap: spacing.md,
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center',
          }}>
            <Feather name="zap" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }}>
              New Session
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
              Starts at $0.00 — history stays separate
            </Text>
          </View>
          <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
            $0
          </Text>
        </View>

        {/* Risk/Value chips if any */}
        {(guest.risk_chips?.length > 0 || guest.value_chips?.length > 0) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
            {guest.risk_chips?.map((chip: any, i: number) => (
              <View key={`r-${i}`} style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
                backgroundColor: chip.severity === 'critical' ? colors.destructiveBg : colors.warningBg,
              }}>
                <Text style={{
                  fontSize: fontSize.tiny, fontWeight: '600',
                  color: chip.severity === 'critical' ? colors.destructive : colors.warning,
                }}>
                  {chip.label}
                </Text>
              </View>
            ))}
            {guest.value_chips?.map((chip: any, i: number) => (
              <View key={`v-${i}`} style={{
                paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
                backgroundColor: chip.type === 'vip' ? colors.warningBg : colors.primaryBg,
              }}>
                <Text style={{
                  fontSize: fontSize.tiny, fontWeight: '600',
                  color: chip.type === 'vip' ? colors.warning : colors.primary,
                }}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Last visit info */}
        {guest.last_visit && (
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.border + '50', marginBottom: spacing.lg,
          }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs }}>
              LAST VISIT
            </Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.foreground }}>
              {new Date(guest.last_visit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: spacing.xxl, paddingBottom: insets.bottom + 16, paddingTop: spacing.lg,
        backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border + '40',
        gap: spacing.md,
      }}>
        {!isBlocked && (
          <TouchableOpacity
            onPress={handleOpenTabAndGoToMenu}
            disabled={openingTab}
            data-testid="open-tab-go-menu"
            style={{
              backgroundColor: colors.emerald500, borderRadius: radius.xl, height: 56,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
              opacity: openingTab ? 0.6 : 1,
            }}
          >
            {openingTab ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Feather name="plus" size={20} color="#000" />
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: '#000' }}>
                  Open Tab & Go to Menu
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CustomerProfile', { guest })}
            data-testid="view-profile-btn"
            style={{
              flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, height: 48,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
            }}
          >
            <Feather name="user" size={16} color={colors.foreground} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('EntryDecision', {
                guest: { ...guest, risk_chips: guest.risk_chips || [], value_chips: guest.value_chips || [] },
                tab: { number: null, total: 0, has_open_tab: false },
                source,
              });
            }}
            data-testid="entry-decision-btn"
            style={{
              flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, height: 48,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
            }}
          >
            <Feather name="check-circle" size={16} color={colors.foreground} />
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>Entry Decision</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
