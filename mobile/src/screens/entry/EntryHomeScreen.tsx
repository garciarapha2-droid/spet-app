/**
 * Entry Home — redesigned per Pulse Mobile spec.
 * KPI row + Scan NFC input + Manual Entry + Guest List.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import TopNavbar from '../../components/TopNavbar';
import { useVenue } from '../../hooks/useVenue';
import { useWebSocket } from '../../hooks/useWebSocket';
import * as pulseService from '../../services/pulseService';
import { api } from '../../services/api';

export default function EntryHomeScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { selectedVenue, venueId } = useVenue();

  const [todayCount, setTodayCount] = useState(0);
  const [insideCount, setInsideCount] = useState(0);
  const [deniedCount, setDeniedCount] = useState(0);
  const [guests, setGuests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { connected } = useWebSocket(venueId, useCallback((event: any) => {
    if (event.type === 'guest_entered' || event.type === 'nfc_scanned') {
      loadData();
    }
  }, []));

  const loadData = useCallback(async () => {
    if (!venueId) return;
    try {
      const [entries, inside] = await Promise.all([
        pulseService.getTodayEntries(venueId),
        api.get(`/pulse/inside?venue_id=${venueId}`).catch(() => ({ guests: [] })),
      ]);
      const entryList = entries.entries || [];
      setTodayCount(entryList.length);
      const insideGuests = inside.guests || inside || [];
      setInsideCount(insideGuests.length);
      setGuests(insideGuests.slice(0, 20));
      setDeniedCount(entryList.filter((e: any) => e.decision === 'denied').length);
    } catch {}
  }, [venueId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const tierColor = (tier: string) => {
    const t = (tier || '').toLowerCase();
    if (t === 'gold') return { bg: colors.tierGoldBg, text: colors.tierGoldText };
    if (t === 'silver') return { bg: colors.tierSilverBg, text: colors.tierSilverText };
    if (t === 'bronze') return { bg: colors.tierBronzeBg, text: colors.tierBronzeText };
    if (t === 'platinum') return { bg: colors.tierPlatinumBg, text: colors.tierPlatinumText };
    return { bg: colors.primaryBg, text: colors.primary };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="entry-screen">
      {/* Top Navbar */}
      <TopNavbar
        title="Entry"
        rightContent={
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: connected ? colors.emerald400 : colors.destructive }} />
        }
      />

      <FlatList
        data={guests}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            {/* KPI Row */}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
              <KpiCard colors={colors} label="GUESTS INSIDE" value={insideCount} barColor={colors.primary} showPulse />
              <KpiCard colors={colors} label="TOTAL ENTRIES" value={todayCount} barColor={colors.emerald500} />
              <KpiCard colors={colors} label="DENIED" value={deniedCount} barColor={colors.destructive} />
            </View>

            {/* Scan NFC + Search */}
            <View style={{ marginBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NfcScan')}
                activeOpacity={0.8}
                data-testid="scan-nfc-button"
                style={{
                  backgroundColor: colors.card,
                  borderRadius: radius.xl,
                  borderWidth: 1,
                  borderColor: colors.border + '80',
                  padding: spacing.lg,
                  paddingLeft: 44,
                  minHeight: 52,
                  justifyContent: 'center',
                }}
              >
                <Feather name="search" size={16} color={colors.mutedForeground} style={{ position: 'absolute', left: spacing.lg }} />
                <Text style={{ fontSize: fontSize.sm, color: colors.placeholder }}>
                  Scan NFC or type name...
                </Text>
                <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }}>
                  Place tag on reader or search manually
                </Text>
              </TouchableOpacity>
            </View>

            {/* Manual Entry */}
            <TouchableOpacity
              onPress={() => navigation.navigate('GuestIntake')}
              activeOpacity={0.7}
              data-testid="manual-entry-button"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.sm,
                padding: spacing.md,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: colors.border + '99',
                marginBottom: spacing.xxl,
              }}
            >
              <Feather name="user-plus" size={18} color={colors.primary} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.mutedForeground }}>
                Manual Entry
              </Text>
              <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>Without NFC</Text>
            </TouchableOpacity>

            {/* Guest List Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground }}>Guests Today</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>{guests.length} guests</Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const tc = tierColor(item.tier);
          const initials = (item.name || 'G').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
          const isInside = (item.status || '').toLowerCase() === 'inside';
          const time = item.entered_at || item.checked_in_at;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border + '30',
                backgroundColor: colors.card,
                marginBottom: 1,
                borderRadius: radius.xl,
              }}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: tc.bg, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md,
              }}>
                <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: tc.text }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>{item.name || 'Guest'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 }}>
                  {item.tier && (
                    <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: tc.text, textTransform: 'uppercase' }}>{item.tier}</Text>
                  )}
                  {time && (
                    <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, fontVariant: ['tabular-nums'] }}>
                      {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
                  backgroundColor: isInside ? colors.insideBg : colors.exitedBg,
                }}>
                  <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: isInside ? colors.insideText : colors.exitedText }}>
                    {isInside ? 'Inside' : 'Exited'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>No guests yet today</Text>
          </View>
        }
      />
    </View>
  );
}

function KpiCard({ colors, label, value, barColor, showPulse }: any) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
      padding: spacing.md, borderWidth: 1, borderColor: colors.border + '80',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
        <View style={{ width: 3, height: 20, borderRadius: 2, backgroundColor: barColor }} />
        <Text style={{ fontSize: fontSize.micro, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
        {showPulse && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald400 }} />}
      </View>
    </View>
  );
}
