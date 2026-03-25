/**
 * TAP service — tabs, items, catalog, close, tips.
 * 
 * IMPORTANT: Backend uses Form data for POST endpoints, NOT JSON.
 * Use FormData for all writes.
 */
import { api } from './api';

export interface TapStats {
  open_tabs: number;
  running_total: number;
  closed_today: number;
  revenue_today: number;
}

export interface TabSession {
  id: string;
  session_id: string;
  guest_id?: string;
  guest_name?: string;
  tab_number?: number;
  status: string;
  session_type?: string;
  total: number;
  subtotal?: number;
  items_count?: number;
  opened_at: string;
  closed_at?: string;
  meta?: Record<string, any>;
}

export interface TabItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  line_total?: number;
  category?: string;
  notes?: string;
  modifiers?: Record<string, any>;
  is_alcohol?: boolean;
  created_at?: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available?: boolean;
  is_alcohol?: boolean;
  default_ingredients?: string[];
  image_url?: string;
}

export interface ItemExtra {
  name: string;
  price: number;
}

function buildFormData(params: Record<string, any>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  }
  return fd;
}

export async function getTapStats(venueId: string): Promise<TapStats> {
  return api.get<TapStats>(`/tap/stats?venue_id=${venueId}`);
}

export async function getOpenTabs(venueId: string): Promise<{ sessions: TabSession[] }> {
  return api.get(`/tap/sessions?venue_id=${venueId}&status=open`);
}

export async function getSessionDetail(sessionId: string): Promise<any> {
  return api.get(`/tap/session/${sessionId}`);
}

export async function getTabItems(sessionId: string): Promise<{ items: TabItem[] }> {
  const detail = await api.get(`/tap/session/${sessionId}`);
  const items = (detail.items || []).map((it: any) => ({
    id: it.id,
    name: it.name || it.item_name,
    quantity: it.qty || it.quantity || 1,
    unit_price: it.unit_price,
    total: it.line_total || it.total || 0,
    line_total: it.line_total,
    category: it.category,
    notes: it.notes,
    modifiers: it.modifiers,
    is_alcohol: it.is_alcohol,
    created_at: it.created_at,
  }));
  return { items };
}

export async function addTabItem(sessionId: string, item: {
  product_id: string;
  name?: string;
  quantity?: number;
  notes?: string;
  bartender_id?: string;
  modifiers?: Record<string, any>;
}): Promise<any> {
  const fd = buildFormData({
    item_id: item.product_id,
    qty: item.quantity || 1,
    notes: item.notes,
    bartender_id: item.bartender_id,
    modifiers: item.modifiers ? JSON.stringify(item.modifiers) : undefined,
  });
  return api.postForm(`/tap/session/${sessionId}/add`, fd);
}

export async function closeTab(sessionId: string, paymentMethod: string, paymentLocation: string = 'pay_here', bartenderId?: string): Promise<any> {
  const fd = buildFormData({
    payment_method: paymentMethod,
    payment_location: paymentLocation,
    bartender_id: bartenderId,
  });
  return api.postForm(`/tap/session/${sessionId}/close`, fd);
}

export async function recordTip(sessionId: string, tipAmount?: number, tipPercent?: number): Promise<any> {
  const fd = buildFormData({
    tip_amount: tipAmount,
    tip_percent: tipPercent,
  });
  return api.postForm(`/tap/session/${sessionId}/record-tip`, fd);
}

export async function getCatalog(venueId: string): Promise<{ items: CatalogItem[] }> {
  return api.get(`/tap/catalog?venue_id=${venueId}`);
}

export async function getCatalogItem(itemId: string): Promise<CatalogItem> {
  return api.get(`/tap/catalog/${itemId}`);
}

export async function updateItemModifiers(sessionId: string, itemId: string, modifiers: Record<string, any>, notes?: string): Promise<any> {
  return api.put(`/tap/session/${sessionId}/item/${itemId}`, { modifiers, notes });
}

export async function voidItem(sessionId: string, itemId: string, reason?: string): Promise<any> {
  const fd = buildFormData({ item_id: itemId, reason });
  return api.postForm(`/tap/session/${sessionId}/void-item`, fd);
}

export async function openTab(params: {
  venue_id: string;
  guest_name?: string;
  guest_id?: string;
  table_id?: string;
  nfc_card_id?: string;
  session_type?: string;
  bartender_id?: string;
  bartender_name?: string;
}): Promise<any> {
  return api.postForm('/tap/session/open', buildFormData(params));
}
