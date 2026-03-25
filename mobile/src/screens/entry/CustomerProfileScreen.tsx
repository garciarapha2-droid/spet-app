/**
 * Customer Profile Screen — HISTORICAL data only.
 *
 * Shows lifetime stats, visit history, tags, tier info.
 * This screen does NOT display or mix with the active session.
 * It exists for staff to review a guest's history on demand.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { useVenue } from '../../hooks/useVenue';
import * as pulseService from '../../services/pulseService';

export default function CustomerProfileScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { venueId } = useVenue();

  const guest = route.params?.guest;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guest?.id) { setLoading(false); return; }
    (async () => {
      try {
        const data = await pulseService.getGuestProfile(guest.id, venueId);
        setProfile(data);
      } catch {
        // Fall back to passed guest data
        setProfile(guest);
      }
      setLoading(false);
    })();
  }, [guest?.id, venueId]);

  const data = profile || guest;
  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>No guest data</Text>
      </View>
    );
  }

  const initials = (data.name || 'G').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const tierInfo = () => {
    const t = (data.tier || '').toLowerCase();
    if (t === 'gold') return { bg: colors.tierGoldBg, text: colors.tierGoldText, label: 'GOLD' };
    if (t === 'silver') return { bg: colors.tierSilverBg, text: colors.tierSilverText, label: 'SILVER' };
    if (t === 'bronze') return { bg: colors.tierBronzeBg, text: colors.tierBronzeText, label: 'BRONZE' };
    if (t === 'platinum') return { bg: colors.tierPlatinumBg, text: colors.tierPlatinumText, label: 'PLATINUM' };
    return null;
  };

  const tier = tierInfo();
  const isVip = data.tags?.includes('vip');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="customer-profile-screen">
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: colors.border + '40',
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Guest Profile
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: insets.bottom + 40 }}>
          {/* Avatar + Name */}
          <View style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: colors.primaryBg, borderWidth: 2, borderColor: colors.primary + '30',
              alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
            }}>
              <Text style={{ fontSize: 28, fontWeight: '800', color: colors.primary }}>{initials}</Text>
            </View>
            <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground }}>{data.name}</Text>
            {data.email && (
              <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>{data.email}</Text>
            )}
            {data.phone && (
              <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: 2 }}>{data.phone}</Text>
            )}
            {/* Tier + VIP badges */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
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
            </View>
          </View>

          {/* Historical Banner */}
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.md,
            borderWidth: 1, borderColor: colors.border + '50', marginBottom: spacing.xxl,
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          }}>
            <Feather name="clock" size={14} color={colors.mutedForeground} />
            <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
              Historical data only — not linked to active session
            </Text>
          </View>

          {/* Lifetime Stats */}
          <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            LIFETIME STATS
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl }}>
            <StatBox colors={colors} label="Visits" value={String(data.visits || 0)} color={colors.primary} />
            <StatBox colors={colors} label="Total Spend" value={`$${Number(data.spend_total || 0).toFixed(0)}`} color={colors.emerald500} />
            <StatBox colors={colors} label="Avg/Visit" value={`$${data.visits > 0 ? (Number(data.spend_total || 0) / data.visits).toFixed(0) : '0'}`} color={colors.info} />
          </View>

          {/* Last Visit */}
          {data.last_visit && (
            <>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                LAST VISIT
              </Text>
              <View style={{
                backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
                borderWidth: 1, borderColor: colors.border + '50', marginBottom: spacing.xxl,
              }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.foreground }}>
                  {new Date(data.last_visit).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
            </>
          )}

          {/* Tags */}
          {data.tags && data.tags.length > 0 && (
            <>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                TAGS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
                {data.tags.map((tag: string, i: number) => (
                  <View key={i} style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                    backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border + '50',
                  }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.foreground }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Flags */}
          {data.flags && data.flags.length > 0 && (
            <>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                FLAGS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
                {data.flags.map((flag: string, i: number) => {
                  const isBlocked = flag === 'blocked';
                  return (
                    <View key={i} style={{
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                      backgroundColor: isBlocked ? colors.destructiveBg : colors.warningBg,
                    }}>
                      <Text style={{ fontSize: fontSize.xs, fontWeight: '600', color: isBlocked ? colors.destructive : colors.warning }}>
                        {flag.toUpperCase()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Risk + Value Chips */}
          {(data.risk_chips?.length > 0 || data.value_chips?.length > 0) && (
            <>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                RISK & VALUE INDICATORS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xxl }}>
                {data.risk_chips?.map((chip: any, i: number) => (
                  <View key={`r-${i}`} style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                    backgroundColor: chip.severity === 'critical' ? colors.destructiveBg : colors.warningBg,
                  }}>
                    <Text style={{
                      fontSize: fontSize.xs, fontWeight: '600',
                      color: chip.severity === 'critical' ? colors.destructive : colors.warning,
                    }}>
                      {chip.label}
                    </Text>
                  </View>
                ))}
                {data.value_chips?.map((chip: any, i: number) => (
                  <View key={`v-${i}`} style={{
                    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
                    backgroundColor: chip.type === 'vip' ? colors.warningBg : colors.primaryBg,
                  }}>
                    <Text style={{
                      fontSize: fontSize.xs, fontWeight: '600',
                      color: chip.type === 'vip' ? colors.warning : colors.primary,
                    }}>
                      {chip.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* NFC Info */}
          {data.nfc_id && (
            <>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                NFC WRISTBAND
              </Text>
              <View style={{
                backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
                borderWidth: 1, borderColor: colors.border + '50', marginBottom: spacing.xxl,
                flexDirection: 'row', alignItems: 'center', gap: spacing.md,
              }}>
                <Feather name="wifi" size={18} color={colors.primary} />
                <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontFamily: 'monospace' }}>
                  {data.nfc_id}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatBox({ colors, label, value, color }: { colors: any; label: string; value: string; color: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg,
      borderWidth: 1, borderColor: colors.border + '60', alignItems: 'center',
    }}>
      <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color, fontVariant: ['tabular-nums'] }}>
        {value}
      </Text>
      <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
