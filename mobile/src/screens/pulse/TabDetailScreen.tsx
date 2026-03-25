/**
 * Tab Detail — themed. View items, add items, close tab.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Alert, RefreshControl } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import { Button, Card, SectionHeader } from '../../components/ui';
import * as tapService from '../../services/tapService';

export default function TabDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const session: tapService.TabSession = route.params?.session;

  const [items, setItems] = useState<tapService.TabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    if (!session?.id) return;
    try { setItems((await tapService.getTabItems(session.id)).items || []); } catch { setItems([]); }
    setLoading(false);
  }, [session?.id]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const onRefresh = async () => { setRefreshing(true); await loadItems(); setRefreshing(false); };

  const handleClose = () => {
    Alert.alert('Close Tab', `Close this tab? Total: $${Number(session.total).toFixed(2)}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Card', onPress: () => doClose('card') },
      { text: 'Cash', onPress: () => doClose('cash') },
      { text: 'Pix', onPress: () => doClose('pix') },
    ]);
  };

  const doClose = async (method: string) => {
    setClosing(true);
    try {
      await tapService.closeTab(session.id, method);
      Alert.alert('Tab Closed', `Payment: ${method.toUpperCase()}`, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to close tab'); }
    setClosing(false);
  };

  const tabNum = session?.meta?.tab_number || session?.tab_number;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <>
            <View style={{ marginBottom: spacing.xxl }}>
              <Text style={{ fontSize: fontSize.title, fontWeight: '800', color: colors.foreground }}>
                {session?.guest_name || `Tab ${tabNum || '?'}`}
              </Text>
              {tabNum && <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>Tab #{tabNum}</Text>}
            </View>
            <Card style={{ marginBottom: spacing.xxl, alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }}>Running Total</Text>
              <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary, marginTop: spacing.sm, fontVariant: ['tabular-nums'] }}>
                ${Number(session?.total || 0).toFixed(2)}
              </Text>
            </Card>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
              Items ({items.length})
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.foreground }}>{item.name}</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>{item.quantity}x ${Number(item.unit_price).toFixed(2)}</Text>
            </View>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.foreground, fontVariant: ['tabular-nums'] }}>${Number(item.total).toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={loading ? null : (
          <View style={{ alignItems: 'center', paddingTop: 20 }}>
            <Text style={{ fontSize: fontSize.md, color: colors.mutedForeground }}>No items yet</Text>
          </View>
        )}
      />
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.xxl, paddingBottom: spacing.xxxl,
        backgroundColor: colors.background, borderTopWidth: 1, borderColor: colors.border, gap: spacing.md,
      }}>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button title="Add Item" onPress={() => navigation.navigate('AddItem', { sessionId: session.id })} style={{ flex: 1 }} />
          <Button title="Close Tab" variant="danger" onPress={handleClose} loading={closing} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}
