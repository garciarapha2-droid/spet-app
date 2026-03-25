/**
 * Tabs Main Screen — full POS ordering experience.
 * Mode toggle + Search + Open Tabs + Categories + Drinks + Order Panel + Close Tab modal.
 *
 * Flow: Scan/Search → Select Guest Tab → Add Items → Send Order → Close Tab
 */
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView, FlatList,
  Modal, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import TopNavbar from '../../components/TopNavbar';
import { useVenue } from '../../hooks/useVenue';
import * as tapService from '../../services/tapService';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  category?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  cocktails: '\uD83C\uDF78',
  beers: '\uD83C\uDF7A',
  spirits: '\uD83E\uDD43',
  wines: '\uD83C\uDF77',
  shots: '\uD83E\uDD43',
  soft: '\uD83E\uDDC3',
  food: '\uD83C\uDF54',
  other: '\uD83C\uDF79',
};

export default function TabsMainScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { venueId, selectedVenue } = useVenue();

  const [mode, setMode] = useState<'tap' | 'table'>('tap');
  const [search, setSearch] = useState('');
  const [openTabs, setOpenTabs] = useState<tapService.TabSession[]>([]);
  const [selectedTab, setSelectedTab] = useState<tapService.TabSession | null>(null);
  const [catalog, setCatalog] = useState<tapService.CatalogItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);

  // Close tab state
  const [showCloseTab, setShowCloseTab] = useState(false);
  const [closeTabStep, setCloseTabStep] = useState<'choose' | 'tip' | 'done'>('choose');
  const [selectedTip, setSelectedTip] = useState<number | null>(20);
  const [customTipMode, setCustomTipMode] = useState<'percent' | 'dollar'>('percent');
  const [customTipInput, setCustomTipInput] = useState('');

  const loadData = useCallback(async () => {
    if (!venueId) return;
    try {
      const [tabsData, catalogData] = await Promise.all([
        tapService.getOpenTabs(venueId),
        tapService.getCatalog(venueId),
      ]);
      setOpenTabs(tabsData.sessions || []);
      const items = catalogData.items || [];
      setCatalog(items);
      if (items.length > 0 && !activeCategory) {
        setActiveCategory(items[0].category || 'Other');
      }
    } catch {}
    setLoading(false);
  }, [venueId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(catalog.map(i => i.category || 'Other'))];
    return cats;
  }, [catalog]);

  const categoryItems = useMemo(() => {
    return catalog.filter(i => (i.category || 'Other') === activeCategory);
  }, [catalog, activeCategory]);

  const filteredTabs = useMemo(() => {
    if (!search.trim()) return openTabs;
    const q = search.toLowerCase();
    return openTabs.filter(t =>
      (t.guest_name || '').toLowerCase().includes(q) ||
      String(t.tab_number || '').includes(q)
    );
  }, [openTabs, search]);

  const orderTotal = useMemo(() => orderItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0), [orderItems]);
  const tabSubtotal = selectedTab ? Number(selectedTab.total || 0) : 0;

  const addToOrder = (item: tapService.CatalogItem) => {
    if (!selectedTab) {
      Alert.alert('Select a Tab', 'Please select or scan a guest tab first.');
      return;
    }
    setOrderItems(prev => {
      const existing = prev.find(o => o.id === item.id);
      if (existing) return prev.map(o => o.id === item.id ? { ...o, quantity: o.quantity + 1 } : o);
      return [...prev, { id: item.id, name: item.name, quantity: 1, unitPrice: item.price, category: item.category }];
    });
  };

  const removeFromOrder = (id: string) => {
    setOrderItems(prev => prev.filter(o => o.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setOrderItems(prev => prev.map(o => {
      if (o.id !== id) return o;
      const newQty = o.quantity + delta;
      return newQty <= 0 ? o : { ...o, quantity: newQty };
    }).filter(o => o.quantity > 0));
  };

  const handleSendOrder = async () => {
    if (!selectedTab || orderItems.length === 0) return;
    setSending(true);
    try {
      for (const item of orderItems) {
        await tapService.addTabItem(selectedTab.id, {
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          category: item.category,
        });
      }
      setOrderItems([]);
      Alert.alert('Order Sent', `${orderItems.length} items added to tab.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send order');
    }
    setSending(false);
  };

  const tipAmount = useMemo(() => {
    if (selectedTip !== null) return tabSubtotal * (selectedTip / 100);
    const val = parseFloat(customTipInput) || 0;
    return customTipMode === 'percent' ? tabSubtotal * (val / 100) : val;
  }, [selectedTip, customTipInput, customTipMode, tabSubtotal]);

  const handleCloseTab = async (method: string) => {
    if (!selectedTab) return;
    try {
      await tapService.closeTab(selectedTab.id, method, tipAmount);
      setCloseTabStep('done');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to close tab');
    }
  };

  const resetCloseTab = () => {
    setShowCloseTab(false);
    setCloseTabStep('choose');
    setSelectedTip(20);
    setCustomTipInput('');
    if (closeTabStep === 'done') {
      setSelectedTab(null);
      setOrderItems([]);
      loadData();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="tabs-screen">
      {/* Top Navbar */}
      <TopNavbar
        title="Bar"
        rightContent={
          <View style={{
            backgroundColor: colors.primaryBg, paddingHorizontal: 8, paddingVertical: 3,
            borderRadius: radius.full,
          }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.primary }}>
              Tabs: {openTabs.length}
            </Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Mode Toggle */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          marginBottom: spacing.lg,
        }}>
          <View style={{
            flexDirection: 'row', backgroundColor: colors.muted + '50', borderRadius: radius.full,
            borderWidth: 1, borderColor: colors.border + '30', padding: 3, flex: 1,
          }}>
            {(['tap', 'table'] as const).map(m => (
              <TouchableOpacity
                key={m}
                onPress={() => setMode(m)}
                style={{
                  flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full,
                  backgroundColor: mode === m ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontSize: fontSize.sm, fontWeight: '700',
                  color: mode === m ? colors.primaryForeground : colors.mutedForeground,
                }}>
                  {m === 'tap' ? 'TAP' : 'TABLE'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Entry', { screen: 'NfcScan' })}
            data-testid="quick-scan-nfc"
            style={{
              flex: 1, backgroundColor: colors.primaryBg, borderRadius: radius.xl,
              padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.primary + '30',
            }}
          >
            <Feather name="wifi" size={18} color={colors.primary} />
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: colors.primary, marginTop: 4 }}>Scan NFC</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Entry', { screen: 'GuestSearch' })}
            data-testid="quick-search-guest"
            style={{
              flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
              padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border + '80',
            }}
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: colors.mutedForeground, marginTop: 4 }}>Search</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Entry', { screen: 'GuestIntake' })}
            data-testid="quick-create-guest"
            style={{
              flex: 1, backgroundColor: colors.card, borderRadius: radius.xl,
              padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border + '80',
            }}
          >
            <Feather name="user-plus" size={18} color={colors.mutedForeground} />
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: colors.mutedForeground, marginTop: 4 }}>Create</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs }}>
            SCAN / SEARCH
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
            borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border + '80',
            paddingHorizontal: spacing.md, height: 42,
          }}>
            <Feather name="search" size={14} color={colors.mutedForeground} />
            <TextInput
              placeholder="Name or #tab..."
              placeholderTextColor={colors.placeholder}
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, color: colors.foreground, fontSize: fontSize.sm, marginLeft: spacing.sm }}
            />
          </View>
        </View>

        {/* Open Tabs */}
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }}>
              OPEN TABS ({filteredTabs.length})
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Entry', { screen: 'GuestIntake' })}
              style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Feather name="plus" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
          ) : filteredTabs.length === 0 ? (
            <View style={{
              backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxl,
              borderWidth: 1, borderColor: colors.border + '80', alignItems: 'center',
            }}>
              <Feather name="credit-card" size={24} color={colors.mutedForeground + '40'} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.mutedForeground, marginTop: spacing.sm }}>No open tabs</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>Scan NFC or create a guest to open a tab</Text>
            </View>
          ) : (
            filteredTabs.slice(0, 5).map(tab => {
              const isSelected = selectedTab?.id === tab.id;
              const tabNum = tab.meta?.tab_number || tab.tab_number;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setSelectedTab(isSelected ? null : tab)}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: isSelected ? colors.primaryBg : colors.card,
                    borderRadius: radius.xl,
                    padding: spacing.lg,
                    marginBottom: spacing.sm,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary + '40' : colors.border + '80',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald400 }} />
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
                        {tab.guest_name || `Tab ${tabNum || '?'}`}
                      </Text>
                      {tabNum && (
                        <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontFamily: 'monospace' }}>#{tabNum}</Text>
                      )}
                    </View>
                    <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
                    <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
                      Tab #{tabNum || '?'}
                    </Text>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] }}>
                      ${Number(tab.total || 0).toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
              MENU
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {categories.map(cat => {
                const isActive = activeCategory === cat;
                const emoji = CATEGORY_EMOJIS[cat.toLowerCase()] || CATEGORY_EMOJIS.other;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={{
                      paddingHorizontal: isActive ? spacing.xl : spacing.lg,
                      paddingVertical: isActive ? spacing.lg : spacing.md,
                      borderRadius: isActive ? radius.xxl : radius.lg,
                      backgroundColor: isActive ? colors.primaryBg : colors.card,
                      borderWidth: 1,
                      borderColor: isActive ? colors.primary + '30' : colors.border + '80',
                      alignItems: 'center',
                      minWidth: isActive ? 100 : undefined,
                    }}
                  >
                    <Text style={{ fontSize: isActive ? 24 : 20 }}>{emoji}</Text>
                    <Text style={{
                      fontSize: isActive ? fontSize.sm : fontSize.xs,
                      fontWeight: '600',
                      color: isActive ? colors.primary : colors.mutedForeground,
                      marginTop: 2,
                    }}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Drink Cards Grid */}
        {categoryItems.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg }}>
            {categoryItems.map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => addToOrder(item)}
                activeOpacity={0.7}
                style={{
                  width: '48%',
                  backgroundColor: colors.card,
                  borderRadius: radius.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border + '80',
                }}
              >
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>{item.name}</Text>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'], marginTop: spacing.xs }}>
                  ${item.price.toFixed(2)}
                </Text>
                {item.description && (
                  <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>{item.description}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Order Panel */}
        <View style={{
          backgroundColor: colors.card, borderRadius: radius.xxl,
          padding: spacing.xl, borderWidth: 1, borderColor: colors.border + '80',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
            <Feather name="shopping-cart" size={18} color={colors.foreground} />
            <Text style={{ fontSize: fontSize.lg, fontWeight: '700', color: colors.foreground }}>Order</Text>
          </View>

          {!selectedTab ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
              <Feather name="shopping-cart" size={40} color={colors.mutedForeground + '30'} />
              <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.mutedForeground, marginTop: spacing.md }}>No active order</Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>Select a tab or scan NFC</Text>
            </View>
          ) : (
            <>
              {/* Selected guest header */}
              <View style={{
                backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.md,
                marginBottom: spacing.md,
              }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>
                  {selectedTab.guest_name || 'Guest'} — #{selectedTab.meta?.tab_number || selectedTab.tab_number || '?'}
                </Text>
              </View>

              {/* Order items */}
              {orderItems.length === 0 ? (
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, textAlign: 'center', paddingVertical: spacing.md }}>
                  Tap a drink to add to order
                </Text>
              ) : (
                orderItems.map(item => (
                  <View key={item.id} style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '20',
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.foreground }}>{item.name}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={{ padding: 4 }}>
                        <Feather name="minus" size={14} color={colors.mutedForeground} />
                      </TouchableOpacity>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground, fontVariant: ['tabular-nums'], minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={{ padding: 4 }}>
                        <Feather name="plus" size={14} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, fontVariant: ['tabular-nums'], marginLeft: spacing.sm, minWidth: 50, textAlign: 'right' }}>
                        ${(item.unitPrice * item.quantity).toFixed(2)}
                      </Text>
                      <TouchableOpacity onPress={() => removeFromOrder(item.id)} style={{ padding: 4, marginLeft: spacing.xs }}>
                        <Feather name="x" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Totals + Buttons */}
              {orderItems.length > 0 && (
                <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border + '30', paddingTop: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.foreground }}>Order Total</Text>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                      ${orderTotal.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleSendOrder}
                    disabled={sending}
                    style={{
                      backgroundColor: colors.emerald500, borderRadius: radius.xl, height: 48,
                      alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm,
                    }}
                  >
                    {sending ? <ActivityIndicator color="#000" /> : (
                      <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: '#000' }}>Send Order</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={() => { setShowCloseTab(true); setCloseTabStep('choose'); }}
                style={{
                  backgroundColor: colors.primary, borderRadius: radius.xl, height: 48,
                  alignItems: 'center', justifyContent: 'center', marginTop: orderItems.length > 0 ? 0 : spacing.md,
                }}
              >
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primaryForeground }}>Close Tab</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Close Tab Modal */}
      <Modal visible={showCloseTab} transparent animationType="fade" onRequestClose={resetCloseTab}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{
            width: '100%', maxWidth: 400, borderRadius: radius.xxl,
            backgroundColor: colors.card, padding: spacing.xxl, borderWidth: 1, borderColor: colors.border + '30',
          }}>
            {/* Close button */}
            <TouchableOpacity
              onPress={resetCloseTab}
              style={{ position: 'absolute', top: spacing.lg, right: spacing.lg, width: 32, height: 32, borderRadius: radius.xl, backgroundColor: colors.muted + '80', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
            >
              <Feather name="x" size={16} color={colors.foreground} />
            </TouchableOpacity>

            {closeTabStep === 'choose' && (
              <>
                <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground, marginBottom: 2 }}>Close Tab</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.xxl }}>
                  {selectedTab?.guest_name} — #{selectedTab?.meta?.tab_number || selectedTab?.tab_number}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Tab Total</Text>
                  <Text style={{ fontSize: fontSize['3xl'], fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                    ${tabSubtotal.toFixed(2)}
                  </Text>
                </View>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
                  HOW WOULD YOU LIKE TO PAY?
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <TouchableOpacity
                    onPress={() => setCloseTabStep('tip')}
                    data-testid="pay-here-button"
                    style={{
                      flex: 1, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border + '50',
                      padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
                    }}
                  >
                    <Feather name="credit-card" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground }}>Pay Here</Text>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>Card / Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCloseTabStep('tip')}
                    data-testid="pay-register-button"
                    style={{
                      flex: 1, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border + '50',
                      padding: spacing.xl, alignItems: 'center', gap: spacing.sm,
                    }}
                  >
                    <Feather name="dollar-sign" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground }}>Pay at Register</Text>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>Send to cashier</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {closeTabStep === 'tip' && (
              <>
                <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground, marginBottom: 2 }}>Add Tip</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
                  {selectedTab?.guest_name} — #{selectedTab?.meta?.tab_number || selectedTab?.tab_number}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.lg }}>
                  Subtotal: ${tabSubtotal.toFixed(2)}
                </Text>

                {/* Tip presets */}
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                  {[18, 20, 22].map(pct => (
                    <TouchableOpacity
                      key={pct}
                      onPress={() => { setSelectedTip(pct); setCustomTipInput(''); }}
                      style={{
                        flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl,
                        borderWidth: 1,
                        borderColor: selectedTip === pct ? colors.primary + '60' : colors.border + '50',
                        backgroundColor: selectedTip === pct ? colors.primaryBg : 'transparent',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{
                        fontSize: fontSize.sm, fontWeight: '700',
                        color: selectedTip === pct ? colors.primary : colors.mutedForeground,
                      }}>
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => { setSelectedTip(null); }}
                    style={{
                      flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl,
                      borderWidth: 1,
                      borderColor: selectedTip === null ? colors.primary + '60' : colors.border + '50',
                      backgroundColor: selectedTip === null ? colors.primaryBg : 'transparent',
                      alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4,
                    }}
                  >
                    <Feather name="edit-2" size={12} color={selectedTip === null ? colors.primary : colors.mutedForeground} />
                    <Text style={{
                      fontSize: fontSize.sm, fontWeight: '700',
                      color: selectedTip === null ? colors.primary : colors.mutedForeground,
                    }}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Custom tip input */}
                {selectedTip === null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {(['percent', 'dollar'] as const).map(m => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setCustomTipMode(m)}
                          style={{
                            paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm,
                            backgroundColor: customTipMode === m ? colors.primaryBg : colors.muted + '50',
                          }}
                        >
                          <Text style={{
                            fontSize: fontSize.xs, fontWeight: '700',
                            color: customTipMode === m ? colors.primary : colors.mutedForeground,
                          }}>
                            {m === 'percent' ? '%' : '$'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      value={customTipInput}
                      onChangeText={setCustomTipInput}
                      placeholder="e.g. 25"
                      placeholderTextColor={colors.placeholder}
                      keyboardType="numeric"
                      style={{
                        flex: 1, color: colors.foreground, fontWeight: '700',
                        fontSize: fontSize.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
                        paddingVertical: spacing.xs,
                      }}
                    />
                  </View>
                )}

                {/* Summary */}
                <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Subtotal</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontVariant: ['tabular-nums'] }}>${tabSubtotal.toFixed(2)}</Text>
                  </View>
                  {tipAmount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>
                        Tip {selectedTip ? `(${selectedTip}%)` : ''}
                      </Text>
                      <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontVariant: ['tabular-nums'] }}>${tipAmount.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={{ height: 1, backgroundColor: colors.border + '30', marginVertical: spacing.sm }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.foreground }}>Total</Text>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
                      ${(tabSubtotal + tipAmount).toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Charge button */}
                <TouchableOpacity
                  onPress={() => handleCloseTab('card')}
                  style={{
                    backgroundColor: colors.primary, borderRadius: radius.xxl, height: 56,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
                  }}
                >
                  <Feather name="credit-card" size={20} color={colors.primaryForeground} />
                  <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primaryForeground }}>
                    Charge ${(tabSubtotal + tipAmount).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {closeTabStep === 'done' && (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
                <View style={{
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: colors.emerald500 + '30', alignItems: 'center', justifyContent: 'center',
                  marginBottom: spacing.lg,
                }}>
                  <Feather name="check" size={32} color={colors.emerald400} />
                </View>
                <Text style={{ fontSize: fontSize['2xl'], fontWeight: '800', color: colors.foreground }}>Tab Closed!</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>Payment processed successfully</Text>
                <TouchableOpacity
                  onPress={resetCloseTab}
                  style={{
                    marginTop: spacing.xxl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
                    borderRadius: radius.xl, backgroundColor: colors.muted + '80',
                  }}
                >
                  <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
