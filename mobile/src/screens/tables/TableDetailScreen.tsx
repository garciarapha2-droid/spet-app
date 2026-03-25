/**
 * Table Detail — items, total, guest info, close/pay.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import * as tableService from '../../services/tableService';
import type { TableDetail as TDetail } from '../../services/tableService';

export default function TableDetailScreen() {
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { tableId } = route.params;
  const [table, setTable] = useState<TDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setTable(await tableService.getTableDetail(tableId)); }
    catch { setTable(null); }
    setLoading(false);
  }, [tableId]);

  useEffect(() => { load(); }, [load]);

  const handleClose = () => {
    Alert.alert('Close Table', 'Are you sure you want to close this table?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        try {
          await tableService.closeTable(tableId, table?.id || '');
          nav.goBack();
        } catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  if (!table) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="loader" size={24} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header Card */}
      <View style={{ margin: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: fontSize.xl, fontWeight: '700', color: colors.text }}>
              Table #{table.number || table.name}
            </Text>
            {table.server_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs }}>
                <Feather name="user" size={12} color={colors.textSecondary} />
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{table.server_name}</Text>
              </View>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fontSize.title, fontWeight: '800', color: colors.primary }}>
              ${(table.total || 0).toFixed(2)}
            </Text>
            <Text style={{ fontSize: fontSize.xs, color: colors.textMuted }}>
              {table.items?.length || 0} items
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <TouchableOpacity
            onPress={() => nav.navigate('AddItem', { tableId, mode: 'table' })}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
              backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 12 }}
          >
            <Feather name="plus" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: fontSize.sm }}>Add Item</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleClose}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs,
              backgroundColor: colors.dangerBg, borderRadius: radius.md, paddingVertical: 12, borderWidth: 1, borderColor: colors.danger }}
          >
            <Feather name="x" size={16} color={colors.danger} />
            <Text style={{ color: colors.danger, fontWeight: '600', fontSize: fontSize.sm }}>Close Table</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List */}
      <FlatList
        data={table.items || []}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: spacing.lg }}
        renderItem={({ item }) => (
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }}>{item.name}</Text>
              {item.notes && <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>{item.notes}</Text>}
            </View>
            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginRight: spacing.md }}>x{item.quantity}</Text>
            <Text style={{ fontSize: fontSize.md, fontWeight: '600', color: colors.text }}>${item.total.toFixed(2)}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: spacing.xxxl, alignItems: 'center' }}>
            <Feather name="coffee" size={32} color={colors.textMuted} />
            <Text style={{ fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.md }}>No items yet</Text>
          </View>
        }
      />
    </View>
  );
}
