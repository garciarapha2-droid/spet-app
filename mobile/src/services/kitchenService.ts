/**
 * Kitchen service — KDS tickets.
 */
import { api } from './api';

export interface KitchenTicket {
  id: string;
  table_number?: number;
  guest_name?: string;
  items: KitchenItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  created_at: string;
  priority: boolean;
}

export interface KitchenItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
  modifiers?: string[];
  status: string;
}

export async function getTickets(venueId: string): Promise<{ tickets: KitchenTicket[] }> {
  return api.get(`/kds/tickets?venue_id=${venueId}`);
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<any> {
  return api.post(`/kds/ticket/${ticketId}/status`, { status });
}
