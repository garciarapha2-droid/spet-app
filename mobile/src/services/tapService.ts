/**
 * TAP service — tabs, items, catalog, close.
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
  guest_id: string;
  guest_name?: string;
  tab_number?: number;
  status: string;
  total: number;
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
  category?: string;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
}

export async function getTapStats(venueId: string): Promise<TapStats> {
  return api.get<TapStats>(`/tap/stats?venue_id=${venueId}`);
}

export async function getOpenTabs(venueId: string): Promise<{ sessions: TabSession[] }> {
  return api.get(`/tap/sessions?venue_id=${venueId}&status=open`);
}

export async function getTabItems(sessionId: string): Promise<{ items: TabItem[] }> {
  return api.get(`/tap/session/${sessionId}/items`);
}

export async function addTabItem(sessionId: string, item: {
  product_id?: string;
  name: string;
  quantity: number;
  unit_price: number;
  category?: string;
}): Promise<any> {
  return api.post(`/tap/session/${sessionId}/item`, item);
}

export async function closeTab(sessionId: string, paymentMethod: string, tipAmount = 0): Promise<any> {
  return api.post(`/tap/session/${sessionId}/close`, {
    payment_method: paymentMethod,
    tip_amount: tipAmount,
  });
}

export async function getCatalog(venueId: string): Promise<{ items: CatalogItem[] }> {
  return api.get(`/tap/catalog?venue_id=${venueId}`);
}
