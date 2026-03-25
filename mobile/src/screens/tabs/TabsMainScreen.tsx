/**
 * Tabs Main Screen — full POS ordering experience.
 * Mode toggle + Search + Open Tabs + Categories + Drinks + Extras Modal + Order Panel + Close Tab modal.
 *
 * Flow: Scan/Search → Select Guest Tab → Tap Drink → Customize Extras → Add → Send Order → Close Tab → Tip
 */
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  Modal, Alert, RefreshControl, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, fontSize, radius } from '../../theme/themes';
import TopNavbar from '../../components/TopNavbar';
import { useVenue } from '../../hooks/useVenue';
import * as tapService from '../../services/tapService';

interface OrderItem {
  id: string;
  catalogItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  extras: tapService.ItemExtra[];
  notes?: string;
  category?: string;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  cocktails: '\uD83C\uDF78', beers: '\uD83C\uDF7A', spirits: '\uD83E\uDD43',
  wines: '\uD83C\uDF77', shots: '\uD83E\uDD43', 'non-alcoholic': '\uD83E\uDDC3',
  snacks: '\uD83C\uDF7F', starters: '\uD83E\uDD57', mains: '\uD83C\uDF54',
  food: '\uD83C\uDF54', other: '\uD83C\uDF79',
};

const COMMON_EXTRAS: tapService.ItemExtra[] = [
  { name: 'Double shot', price: 3.00 },
  { name: 'Extra ice', price: 0 },
  { name: 'No ice', price: 0 },
  { name: 'Extra lime', price: 0.50 },
  { name: 'Premium spirit upgrade', price: 4.00 },
  { name: 'Extra garnish', price: 1.00 },
];

export default function TabsMainScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { venueId } = useVenue();

  // Route params from NFC/Table flow — pre-select a session
  const activeSessionId: string | undefined = route.params?.activeSessionId;
  const activeGuestName: string | undefined = route.params?.activeGuestName;
  const activeTabNumber: number | undefined = route.params?.activeTabNumber;

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
  const [showTabsList, setShowTabsList] = useState(false);

  // Extras modal
  const [extrasItem, setExtrasItem] = useState<tapService.CatalogItem | null>(null);
  const [extrasQty, setExtrasQty] = useState(1);
  const [extrasSelected, setExtrasSelected] = useState<Set<string>>(new Set());
  const [extrasNotes, setExtrasNotes] = useState('');

  // Close tab state
  const [showCloseTab, setShowCloseTab] = useState(false);
  const [closeTabStep, setCloseTabStep] = useState<'choose' | 'tip' | 'done'>('choose');
  const [selectedTip, setSelectedTip] = useState<number | null>(20);
  const [customTipMode, setCustomTipMode] = useState<'percent' | 'dollar'>('percent');
  const [customTipInput, setCustomTipInput] = useState('');
  const [paymentLocation, setPaymentLocation] = useState('pay_here');

  // Track if we already auto-selected from route params
  const autoSelectedRef = React.useRef(false);

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

  // Auto-select session from route params (NFC / Table flow)
  useEffect(() => {
    if (activeSessionId && openTabs.length > 0 && !autoSelectedRef.current) {
      const match = openTabs.find(t => t.id === activeSessionId || t.session_id === activeSessionId);
      if (match) {
        setSelectedTab(match);
        autoSelectedRef.current = true;
      } else if (activeGuestName) {
        // Session just opened — create a virtual tab placeholder
        setSelectedTab({
          id: activeSessionId,
          session_id: activeSessionId,
          guest_name: activeGuestName,
          tab_number: activeTabNumber,
          status: 'open',
          total: 0,
          opened_at: new Date().toISOString(),
        } as tapService.TabSession);
        autoSelectedRef.current = true;
      }
    }
  }, [activeSessionId, openTabs, activeGuestName, activeTabNumber]);

  // Keep selectedTab in sync with fresh data from backend
  useEffect(() => {
    if (selectedTab) {
      const updated = openTabs.find(t => t.id === selectedTab.id);
      if (updated) {
        setSelectedTab(updated);
      } else if (openTabs.length > 0 && autoSelectedRef.current) {
        // Keep the tab selected even if not yet in list (just opened)
      } else if (!activeSessionId) {
        setSelectedTab(null);
      }
    }
  }, [openTabs]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const categories = useMemo(() => [...new Set(catalog.map(i => i.category || 'Other'))], [catalog]);
  const categoryItems = useMemo(() => catalog.filter(i => (i.category || 'Other') === activeCategory), [catalog, activeCategory]);
  const filteredTabs = useMemo(() => {
    if (!search.trim()) return openTabs;
    const q = search.toLowerCase();
    return openTabs.filter(t => (t.guest_name || '').toLowerCase().includes(q) || String(t.tab_number || '').includes(q));
  }, [openTabs, search]);

  const orderTotal = useMemo(() => orderItems.reduce((sum, i) => {
    const extrasTotal = i.extras.reduce((s, e) => s + e.price, 0);
    return sum + (i.unitPrice + extrasTotal) * i.quantity;
  }, 0), [orderItems]);

  const tabSubtotal = selectedTab ? Number(selectedTab.total || 0) : 0;

  // ─── Extras modal logic ────────────────────────────
  const openExtrasModal = (item: tapService.CatalogItem) => {
    if (!selectedTab) {
      Alert.alert('Select a Tab', 'Please select or scan a guest tab first.');
      return;
    }
    setExtrasItem(item);
    setExtrasQty(1);
    setExtrasSelected(new Set());
    setExtrasNotes('');
  };

  const getActiveExtras = (): tapService.ItemExtra[] => {
    return COMMON_EXTRAS.filter(e => extrasSelected.has(e.name));
  };

  const extrasTotal = useMemo(() => {
    if (!extrasItem) return 0;
    const extras = getActiveExtras();
    return (extrasItem.price + extras.reduce((s, e) => s + e.price, 0)) * extrasQty;
  }, [extrasItem, extrasSelected, extrasQty]);

  const toggleExtra = (name: string) => {
    setExtrasSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const confirmExtras = () => {
    if (!extrasItem) return;
    const extras = getActiveExtras();
    const key = `${extrasItem.id}-${extras.map(e => e.name).sort().join(',')}`;
    setOrderItems(prev => {
      const existing = prev.find(o => o.id === key);
      if (existing) {
        return prev.map(o => o.id === key ? { ...o, quantity: o.quantity + extrasQty } : o);
      }
      return [...prev, {
        id: key,
        catalogItemId: extrasItem.id,
        name: extrasItem.name,
        quantity: extrasQty,
        unitPrice: extrasItem.price,
        extras,
        notes: extrasNotes || undefined,
        category: extrasItem.category,
      }];
    });
    setExtrasItem(null);
  };

  // ─── Order management ──────────────────────────────
  const removeFromOrder = (id: string) => setOrderItems(prev => prev.filter(o => o.id !== id));

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
          product_id: item.catalogItemId,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.extras.length > 0 ? { extras: item.extras } : undefined,
        });
      }
      setOrderItems([]);
      Alert.alert('Order Sent', `${orderItems.length} item(s) sent to bar.`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send order');
    }
    setSending(false);
  };

  // ─── Tip calculation ───────────────────────────────
  const tipAmount = useMemo(() => {
    if (selectedTip !== null) return tabSubtotal * (selectedTip / 100);
    const val = parseFloat(customTipInput) || 0;
    return customTipMode === 'percent' ? tabSubtotal * (val / 100) : val;
  }, [selectedTip, customTipInput, customTipMode, tabSubtotal]);

  const handleCloseTab = async (location: string) => {
    if (!selectedTab) return;
    setPaymentLocation(location);
    try {
      await tapService.closeTab(selectedTab.id, 'card', location);
      if (tipAmount > 0) {
        await tapService.recordTip(selectedTab.id, tipAmount);
      }
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

  // ─── RENDER ────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} data-testid="tabs-screen">
      <TopNavbar
        title="Bar"
        rightContent={
          <View style={{ backgroundColor: colors.primaryBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.primary }}>Tabs: {openTabs.length}</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Mode Toggle */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', backgroundColor: colors.muted + '50', borderRadius: radius.full, borderWidth: 1, borderColor: colors.border + '30', padding: 3, flex: 1 }}>
            {(['tap', 'table'] as const).map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: mode === m ? colors.primary : 'transparent', alignItems: 'center' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: mode === m ? colors.primaryForeground : colors.mutedForeground }}>{m === 'tap' ? 'TAP' : 'TABLE'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Tab Banner (when pre-selected from NFC/Table) */}
        {selectedTab && (
          <View style={{
            backgroundColor: colors.primaryBg, borderRadius: radius.xl, padding: spacing.lg,
            borderWidth: 1, borderColor: colors.primary + '30', marginBottom: spacing.lg,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }} data-testid="active-tab-banner">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald400 }} />
              <View>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.primary }} numberOfLines={1}>
                  {selectedTab.guest_name || `Tab ${selectedTab.tab_number || '?'}`}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground }}>
                  Tab #{selectedTab.tab_number || '?'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>
              ${Number(selectedTab.total || 0).toFixed(2)}
            </Text>
            <TouchableOpacity onPress={() => { setSelectedTab(null); autoSelectedRef.current = false; }} style={{ marginLeft: spacing.sm, padding: 4 }}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions Row */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          {[
            { icon: 'wifi', label: 'Scan NFC', color: colors.primary, bg: colors.primaryBg, border: colors.primary + '30', nav: () => navigation.navigate('Entry', { screen: 'NfcScan' }), testId: 'quick-scan-nfc' },
            { icon: 'search', label: 'Search', color: colors.mutedForeground, bg: colors.card, border: colors.border + '80', nav: () => navigation.navigate('Entry', { screen: 'GuestSearch' }), testId: 'quick-search-guest' },
            { icon: 'list', label: `Tabs (${openTabs.length})`, color: colors.mutedForeground, bg: colors.card, border: colors.border + '80', nav: () => setShowTabsList(!showTabsList), testId: 'toggle-tabs-list' },
          ].map(a => (
            <TouchableOpacity key={a.label} onPress={a.nav} data-testid={a.testId} style={{ flex: 1, backgroundColor: a.bg, borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: a.border }}>
              <Feather name={a.icon as any} size={18} color={a.color} />
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '600', color: a.color, marginTop: 4 }}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Collapsible Open Tabs (not first thing shown — menu-first) */}
        {showTabsList && (
          <View style={{ marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1 }}>OPEN TABS ({filteredTabs.length})</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Entry', { screen: 'GuestIntake' })} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="plus" size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {/* Search within tabs */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border + '80', paddingHorizontal: spacing.md, height: 42, marginBottom: spacing.sm }}>
              <Feather name="search" size={14} color={colors.mutedForeground} />
              <TextInput placeholder="Name or #tab..." placeholderTextColor={colors.placeholder} value={search} onChangeText={setSearch} style={{ flex: 1, color: colors.foreground, fontSize: fontSize.sm, marginLeft: spacing.sm }} />
              {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={14} color={colors.mutedForeground} /></TouchableOpacity>}
            </View>
            {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} /> : filteredTabs.length === 0 ? (
              <View style={{ backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxl, borderWidth: 1, borderColor: colors.border + '80', alignItems: 'center' }}>
                <Feather name="credit-card" size={24} color={colors.mutedForeground + '40'} />
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.mutedForeground, marginTop: spacing.sm }}>No open tabs</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>Scan NFC or create a guest</Text>
              </View>
            ) : filteredTabs.slice(0, 8).map(tab => {
              const isSelected = selectedTab?.id === tab.id;
              return (
                <TouchableOpacity key={tab.id} onPress={() => { setSelectedTab(isSelected ? null : tab); if (!isSelected) setShowTabsList(false); }} activeOpacity={0.7}
                  style={{ backgroundColor: isSelected ? colors.primaryBg : colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: isSelected ? colors.primary + '40' : colors.border + '80' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emerald400 }} />
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>{tab.guest_name || `Tab ${tab.tab_number || '?'}`}</Text>
                      {tab.tab_number != null && <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>#{tab.tab_number}</Text>}
                    </View>
                    <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] }}>${Number(tab.total || 0).toFixed(2)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>MENU</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {categories.map(cat => {
                const isActive = activeCategory === cat;
                const emoji = CATEGORY_EMOJIS[cat.toLowerCase()] || CATEGORY_EMOJIS.other;
                return (
                  <TouchableOpacity key={cat} onPress={() => setActiveCategory(cat)} style={{
                    paddingHorizontal: isActive ? spacing.xl : spacing.lg, paddingVertical: isActive ? spacing.lg : spacing.md,
                    borderRadius: isActive ? radius.xxl : radius.lg, backgroundColor: isActive ? colors.primaryBg : colors.card,
                    borderWidth: 1, borderColor: isActive ? colors.primary + '30' : colors.border + '80', alignItems: 'center', minWidth: isActive ? 100 : undefined,
                  }}>
                    <Text style={{ fontSize: isActive ? 24 : 20 }}>{emoji}</Text>
                    <Text style={{ fontSize: isActive ? fontSize.sm : fontSize.xs, fontWeight: '600', color: isActive ? colors.primary : colors.mutedForeground, marginTop: 2 }}>{cat}</Text>
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
              <TouchableOpacity key={item.id} onPress={() => openExtrasModal(item)} activeOpacity={0.7}
                style={{ width: '48%', backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border + '80' }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>{item.name}</Text>
                <Text style={{ fontSize: fontSize.lg, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'], marginTop: spacing.xs }}>${item.price.toFixed(2)}</Text>
                {item.default_ingredients && item.default_ingredients.length > 0 && (
                  <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 2 }} numberOfLines={1}>{item.default_ingredients.length} ingredients</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Order Panel */}
        <View style={{ backgroundColor: colors.card, borderRadius: radius.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border + '80' }}>
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
              <View style={{ backgroundColor: colors.primaryBg, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary }}>{selectedTab.guest_name || 'Guest'} — #{selectedTab.tab_number || '?'}</Text>
              </View>
              {orderItems.length === 0 ? (
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, textAlign: 'center', paddingVertical: spacing.md }}>Tap a drink to add to order</Text>
              ) : orderItems.map(item => {
                const extrasPrice = item.extras.reduce((s, e) => s + e.price, 0);
                const lineTotal = (item.unitPrice + extrasPrice) * item.quantity;
                return (
                  <View key={item.id} style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '20' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.foreground }}>{item.name}</Text>
                        {item.extras.length > 0 && (
                          <Text style={{ fontSize: fontSize.tiny, color: colors.primary, marginTop: 1 }}>
                            {item.extras.map(e => e.price > 0 ? `${e.name} +$${e.price.toFixed(2)}` : e.name).join(', ')}
                          </Text>
                        )}
                        {item.notes && <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground, marginTop: 1 }}>{item.notes}</Text>}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={{ padding: 6 }}><Feather name="minus" size={14} color={colors.mutedForeground} /></TouchableOpacity>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground, fontVariant: ['tabular-nums'], minWidth: 20, textAlign: 'center' }}>{item.quantity}</Text>
                        <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={{ padding: 6 }}><Feather name="plus" size={14} color={colors.primary} /></TouchableOpacity>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground, fontVariant: ['tabular-nums'], marginLeft: spacing.xs, minWidth: 50, textAlign: 'right' }}>${lineTotal.toFixed(2)}</Text>
                        <TouchableOpacity onPress={() => removeFromOrder(item.id)} style={{ padding: 6, marginLeft: 2 }}><Feather name="x" size={14} color={colors.destructive} /></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
              {orderItems.length > 0 && (
                <View style={{ marginTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border + '30', paddingTop: spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.foreground }}>Order Total</Text>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>${orderTotal.toFixed(2)}</Text>
                  </View>
                  <TouchableOpacity onPress={handleSendOrder} disabled={sending} data-testid="send-order-btn"
                    style={{ backgroundColor: colors.emerald500, borderRadius: radius.xl, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
                    {sending ? <ActivityIndicator color="#000" /> : <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: '#000' }}>Send Order</Text>}
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={() => { setShowCloseTab(true); setCloseTabStep('choose'); }} data-testid="close-tab-btn"
                style={{ backgroundColor: colors.primary, borderRadius: radius.xl, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: orderItems.length > 0 ? 0 : spacing.md }}>
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primaryForeground }}>Close Tab</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* ═══════ EXTRAS / CUSTOMIZATION MODAL ═══════ */}
      <Modal visible={!!extrasItem} transparent animationType="slide" onRequestClose={() => setExtrasItem(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setExtrasItem(null)} />
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border + '50', maxHeight: '80%' }}>
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}><View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} /></View>

            <ScrollView contentContainerStyle={{ padding: spacing.xxl, paddingBottom: spacing.xxxl }} bounces={false}>
              {/* Item header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground }}>{extrasItem?.name}</Text>
                  <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 }}>{extrasItem?.category}</Text>
                </View>
                <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>${extrasItem?.price.toFixed(2)}</Text>
              </View>

              {/* Base ingredients */}
              {extrasItem?.default_ingredients && extrasItem.default_ingredients.length > 0 && (
                <View style={{ marginBottom: spacing.lg }}>
                  <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>INGREDIENTS</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {extrasItem.default_ingredients.map(ing => (
                      <View key={ing} style={{ backgroundColor: colors.muted, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full }}>
                        <Text style={{ fontSize: fontSize.xs, color: colors.foreground }}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Extras / Modifiers */}
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>EXTRAS & MODIFIERS</Text>
              <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
                {COMMON_EXTRAS.map(extra => {
                  const active = extrasSelected.has(extra.name);
                  return (
                    <TouchableOpacity key={extra.name} onPress={() => toggleExtra(extra.name)} activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderRadius: radius.lg, backgroundColor: active ? colors.primaryBg : colors.muted + '50', borderWidth: 1, borderColor: active ? colors.primary + '40' : colors.border + '30' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {active && <Feather name="check" size={14} color={colors.primaryForeground} />}
                        </View>
                        <Text style={{ fontSize: fontSize.sm, fontWeight: '500', color: colors.foreground }}>{extra.name}</Text>
                      </View>
                      {extra.price > 0 && <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, fontVariant: ['tabular-nums'] }}>+${extra.price.toFixed(2)}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notes */}
              <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>NOTES</Text>
              <TextInput
                placeholder="Special requests..." placeholderTextColor={colors.placeholder}
                value={extrasNotes} onChangeText={setExtrasNotes} multiline
                style={{ backgroundColor: colors.muted + '50', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border + '30', padding: spacing.md, color: colors.foreground, fontSize: fontSize.sm, minHeight: 44, textAlignVertical: 'top', marginBottom: spacing.lg }}
              />

              {/* Quantity */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
                <Text style={{ fontSize: fontSize.sm, fontWeight: '600', color: colors.foreground }}>Quantity</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <TouchableOpacity onPress={() => setExtrasQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="minus" size={16} color={colors.foreground} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'], minWidth: 32, textAlign: 'center' }}>{extrasQty}</Text>
                  <TouchableOpacity onPress={() => setExtrasQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="plus" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Add button */}
              <TouchableOpacity onPress={confirmExtras} data-testid="extras-add-btn"
                style={{ backgroundColor: colors.emerald500, borderRadius: radius.xxl, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
                <Feather name="plus" size={20} color="#000" />
                <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: '#000' }}>Add to Order — ${extrasTotal.toFixed(2)}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══════ CLOSE TAB MODAL ═══════ */}
      <Modal visible={showCloseTab} transparent animationType="fade" onRequestClose={resetCloseTab}>
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ width: '100%', maxWidth: 400, borderRadius: radius.xxl, backgroundColor: colors.card, padding: spacing.xxl, borderWidth: 1, borderColor: colors.border + '30' }}>
            <TouchableOpacity onPress={resetCloseTab} style={{ position: 'absolute', top: spacing.lg, right: spacing.lg, width: 32, height: 32, borderRadius: radius.xl, backgroundColor: colors.muted + '80', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <Feather name="x" size={16} color={colors.foreground} />
            </TouchableOpacity>

            {closeTabStep === 'choose' && (
              <>
                <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground, marginBottom: 2 }}>Close Tab</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginBottom: spacing.xxl }}>{selectedTab?.guest_name} — #{selectedTab?.tab_number}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
                  <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Tab Total</Text>
                  <Text style={{ fontSize: fontSize['3xl'], fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>${tabSubtotal.toFixed(2)}</Text>
                </View>
                <Text style={{ fontSize: fontSize.tiny, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>HOW WOULD YOU LIKE TO PAY?</Text>
                <View style={{ flexDirection: 'row', gap: spacing.md }}>
                  <TouchableOpacity onPress={() => { setPaymentLocation('pay_here'); setCloseTabStep('tip'); }} data-testid="pay-here-button"
                    style={{ flex: 1, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border + '50', padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
                    <Feather name="credit-card" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground }}>Pay Here</Text>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>Card / Cash</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setPaymentLocation('pay_at_register'); setCloseTabStep('tip'); }} data-testid="pay-register-button"
                    style={{ flex: 1, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border + '50', padding: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
                    <Feather name="dollar-sign" size={24} color={colors.mutedForeground} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: colors.foreground }}>Pay at Register</Text>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.mutedForeground }}>Send to cashier</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {closeTabStep === 'tip' && (
              <>
                <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground, marginBottom: 2 }}>Add Tip</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>{selectedTab?.guest_name} — #{selectedTab?.tab_number}</Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.mutedForeground, marginBottom: spacing.lg }}>Subtotal: ${tabSubtotal.toFixed(2)}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
                  {[18, 20, 22].map(pct => (
                    <TouchableOpacity key={pct} onPress={() => { setSelectedTip(pct); setCustomTipInput(''); }}
                      style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: selectedTip === pct ? colors.primary + '60' : colors.border + '50', backgroundColor: selectedTip === pct ? colors.primaryBg : 'transparent', alignItems: 'center' }}>
                      <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: selectedTip === pct ? colors.primary : colors.mutedForeground }}>{pct}%</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setSelectedTip(null)}
                    style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radius.xl, borderWidth: 1, borderColor: selectedTip === null ? colors.primary + '60' : colors.border + '50', backgroundColor: selectedTip === null ? colors.primaryBg : 'transparent', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
                    <Feather name="edit-2" size={12} color={selectedTip === null ? colors.primary : colors.mutedForeground} />
                    <Text style={{ fontSize: fontSize.sm, fontWeight: '700', color: selectedTip === null ? colors.primary : colors.mutedForeground }}>Custom</Text>
                  </TouchableOpacity>
                </View>
                {selectedTip === null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {(['percent', 'dollar'] as const).map(m => (
                        <TouchableOpacity key={m} onPress={() => setCustomTipMode(m)} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: customTipMode === m ? colors.primaryBg : colors.muted + '50' }}>
                          <Text style={{ fontSize: fontSize.xs, fontWeight: '700', color: customTipMode === m ? colors.primary : colors.mutedForeground }}>{m === 'percent' ? '%' : '$'}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput value={customTipInput} onChangeText={setCustomTipInput} placeholder="e.g. 25" placeholderTextColor={colors.placeholder} keyboardType="numeric"
                      style={{ flex: 1, color: colors.foreground, fontWeight: '700', fontSize: fontSize.sm, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.xs }} />
                  </View>
                )}
                <View style={{ gap: spacing.xs, marginBottom: spacing.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Subtotal</Text>
                    <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontVariant: ['tabular-nums'] }}>${tabSubtotal.toFixed(2)}</Text>
                  </View>
                  {tipAmount > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground }}>Tip {selectedTip ? `(${selectedTip}%)` : ''}</Text>
                      <Text style={{ fontSize: fontSize.sm, color: colors.foreground, fontVariant: ['tabular-nums'] }}>${tipAmount.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={{ height: 1, backgroundColor: colors.border + '30', marginVertical: spacing.sm }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.foreground }}>Total</Text>
                    <Text style={{ fontSize: fontSize.xl, fontWeight: '800', color: colors.primary, fontVariant: ['tabular-nums'] }}>${(tabSubtotal + tipAmount).toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleCloseTab(paymentLocation)} data-testid="charge-btn"
                  style={{ backgroundColor: colors.primary, borderRadius: radius.xxl, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm }}>
                  <Feather name="credit-card" size={20} color={colors.primaryForeground} />
                  <Text style={{ fontSize: fontSize.md, fontWeight: '700', color: colors.primaryForeground }}>Charge ${(tabSubtotal + tipAmount).toFixed(2)}</Text>
                </TouchableOpacity>
              </>
            )}

            {closeTabStep === 'done' && (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.emerald500 + '30', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
                  <Feather name="check" size={32} color={colors.emerald400} />
                </View>
                <Text style={{ fontSize: fontSize.xxl, fontWeight: '800', color: colors.foreground }}>Tab Closed!</Text>
                <Text style={{ fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs }}>Payment processed successfully</Text>
                <TouchableOpacity onPress={resetCloseTab} style={{ marginTop: spacing.xxl, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.xl, backgroundColor: colors.muted + '80' }}>
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
