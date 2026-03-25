/**
 * Table service — table management, open/close, items.
 */
import { api } from './api';

export interface Table {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'closed';
  server_id?: string;
  server_name?: string;
  guest_count?: number;
  current_tab_total?: number;
  opened_at?: string;
  meta?: any;
}

export interface TableDetail extends Table {
  items: TableItem[];
  total: number;
  guest_name?: string;
}

export interface TableItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  notes?: string;
  status: string;
}

export async function listTables(venueId: string): Promise<{ tables: Table[] }> {
  return api.get(`/table/tables?venue_id=${venueId}`);
}

export async function getTableDetail(tableId: string): Promise<TableDetail> {
  return api.get(`/table/${tableId}`);
}

export async function openTable(venueId: string, tableId: string, guestCount: number, serverName?: string): Promise<any> {
  return api.post('/table/open', { venue_id: venueId, table_id: tableId, guest_count: guestCount, server_name: serverName });
}

export async function closeTable(tableId: string, venueId: string): Promise<any> {
  return api.post('/table/close', { table_id: tableId, venue_id: venueId });
}

export async function addItemToTable(tableId: string, itemId: string, quantity: number, notes?: string): Promise<any> {
  return api.post(`/table/${tableId}/add-item`, { item_id: itemId, quantity, notes });
}

export async function assignServer(tableId: string, serverId: string, venueId: string): Promise<any> {
  return api.post('/table/assign-server', { table_id: tableId, server_id: serverId, venue_id: venueId });
}
