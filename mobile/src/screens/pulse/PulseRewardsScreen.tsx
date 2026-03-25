/**
 * Pulse Rewards — loyalty program overview.
 * Mirrors web PulseRewardsPage.js.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { useVenue } from '../../hooks/useVenue';
import { Card } from '../../components/ui';
import { api } from '../../services/api';

export default function PulseRewardsScreen() {
  const { venueId } = useVenue();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!venueId) return;
    api.get(`/rewards/config?venue_id=${venueId}`).then(d => setConfig(d)).catch(() => {}).finally(() => setLoading(false));
  }, [venueId]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xxl }}>
        <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>Rewards</Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xxl }}>
          Loyalty program configuration
        </Text>

        {config ? (
          <>
            <Card style={{ alignItems: 'center', marginBottom: spacing.xxl }}>
              <Feather name="gift" size={32} color={config.enabled ? colors.success : colors.textMuted} />
              <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md }}>
                {config.enabled ? 'Program Active' : 'Program Disabled'}
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs }}>
                {config.points_per_dollar || 1} points per $1
              </Text>
            </Card>

            {/* Tiers */}
            {config.tiers?.map((tier: any, i: number) => (
              <Card key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <Feather name="award" size={18} color={i === 0 ? '#92400E' : i === 1 ? '#9CA3AF' : '#F59E0B'} />
                  <View>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>{tier.name}</Text>
                    <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>{tier.min_points} pts minimum</Text>
                  </View>
                </View>
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primary }}>{tier.discount_pct}% off</Text>
              </Card>
            ))}
          </>
        ) : (
          <Card style={{ alignItems: 'center' }}>
            <Feather name="gift" size={32} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.md }}>No Rewards Config</Text>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }}>
              Set up rewards from the Manager dashboard.
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
