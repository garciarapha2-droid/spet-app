/**
 * Pulse Rewards — Production-ready. Loyalty program overview.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { ScreenWrapper, ErrorState, EmptyState, SkeletonList, useAsyncData } from '../../components/ProductionUI';
import { api } from '../../services/api';

export default function PulseRewardsScreen() {
  const { venueId } = useVenue();
  const { data, loading, error, refresh } = useAsyncData(
    () => api.get(`/rewards/config?venue_id=${venueId}`),
    [venueId],
  );

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }}><SkeletonList count={4} /></View>;
  if (error) return <ErrorState message={error} onRetry={refresh} />;

  const config = data;

  if (!config) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState
          icon="gift"
          title="No Rewards Config"
          message="Set up your loyalty rewards program from the Manager dashboard."
        />
      </View>
    );
  }

  return (
    <ScreenWrapper onRefresh={refresh}>
      <Card style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
        <View style={{
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: config.enabled ? colors.successBg : colors.bgElevated,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
        }}>
          <Feather name="gift" size={28} color={config.enabled ? colors.success : colors.textMuted} />
        </View>
        <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text }}>
          {config.enabled ? 'Program Active' : 'Program Disabled'}
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
          {config.points_per_dollar || 1} points per $1
        </Text>
      </Card>

      {config.tiers?.map((tier: any, i: number) => {
        const tierColors = ['#92400E', '#9CA3AF', '#F59E0B', '#8B5CF6'];
        return (
          <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: (tierColors[i] || colors.primary) + '18',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Feather name="award" size={18} color={tierColors[i] || colors.primary} />
              </View>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{tier.name}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{tier.min_points} pts minimum</Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{tier.discount_pct}% off</Text>
          </Card>
        );
      })}
    </ScreenWrapper>
  );
}
