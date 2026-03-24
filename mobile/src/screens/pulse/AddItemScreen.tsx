/**
 * Add Item Screen — browse catalog, add item to tab.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize, radius } from '../../theme/colors';
import { Input, Button } from '../../components/ui';
import { useVenue } from '../../hooks/useVenue';
import * as tapService from '../../services/tapService';

export default function AddItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { venueId } = useVenue();
  const sessionId: string = route.params?.sessionId;

  const [catalog, setCatalog] = useState<tapService.CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    tapService.getCatalog(venueId).then(data => {
      setCatalog(data.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [venueId]);

  const filtered = useMemo(() => {
    if (!search) return catalog;
    const q = search.toLowerCase();
    return catalog.filter(
      i => i.name.toLowerCase().includes(q) || i.category?.toLowerCase().includes(q),
    );
  }, [catalog, search]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, tapService.CatalogItem[]>();
    filtered.forEach(item => {
      const cat = item.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleAdd = async (item: tapService.CatalogItem) => {
    setAdding(item.id);
    try {
      await tapService.addTabItem(sessionId, {
        product_id: item.id,
        name: item.name,
        quantity: 1,
        unit_price: item.price,
        category: item.category,
      });
      Alert.alert('Added', `${item.name} added to tab`, [
        { text: 'Add More' },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add item');
    }
    setAdding(null);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing.xxl, paddingBottom: spacing.md }}>
        <Input placeholder="Search menu..." value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={grouped}
        keyExtractor={([cat]) => cat}
        contentContainerStyle={{ padding: spacing.xxl, paddingTop: 0 }}
        renderItem={({ item: [category, items] }) => (
          <View style={{ marginBottom: spacing.xxl }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
              {category}
            </Text>
            {items.map(catalogItem => (
              <TouchableOpacity
                key={catalogItem.id}
                onPress={() => handleAdd(catalogItem)}
                disabled={adding === catalogItem.id || !catalogItem.available}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.bgCard,
                  borderRadius: radius.md,
                  padding: spacing.lg,
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  opacity: catalogItem.available ? 1 : 0.4,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.md, fontWeight: '500', color: colors.text }}>
                    {catalogItem.name}
                  </Text>
                  {catalogItem.description && (
                    <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 }}>
                      {catalogItem.description}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: fontSize.lg, fontWeight: '600', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                    ${catalogItem.price.toFixed(2)}
                  </Text>
                  {adding === catalogItem.id && (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Text style={{ fontSize: fontSize.md, color: colors.textSecondary }}>
              {search ? 'No items match' : 'No catalog items'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
