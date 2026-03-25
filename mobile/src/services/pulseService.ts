/**
 * Pulse service — guest intake, search, entry decision, entries.
 */
import { api } from './api';
import { ScanGuest } from './nfcService';

export interface SearchGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  visits: number;
  spend_total: number;
  flags: string[];
  tags: string[];
  tab_number?: number;
}

export interface GuestProfile extends ScanGuest {
  tab_number?: number;
}

export interface EntryResult {
  entry_id: string;
  decision: string;
  guest_id: string;
  tab_number?: number;
  created_at: string;
}

export interface IntakeResult {
  guest_id: string;
  global_person_id: string;
  name: string;
  created_at: string;
}

export async function searchGuests(venueId: string, query: string): Promise<{ guests: SearchGuest[] }> {
  return api.get(`/pulse/guests/search?venue_id=${venueId}&q=${encodeURIComponent(query)}`);
}

export async function getGuestProfile(guestId: string, venueId: string): Promise<GuestProfile> {
  return api.get(`/pulse/guest/${guestId}?venue_id=${venueId}`);
}

export async function recordEntryDecision(params: {
  guest_id: string;
  venue_id: string;
  decision: 'allowed' | 'denied';
  entry_type?: string;
  cover_amount?: number;
  cover_paid?: boolean;
}): Promise<EntryResult> {
  const form = new FormData();
  form.append('guest_id', params.guest_id);
  form.append('venue_id', params.venue_id);
  form.append('decision', params.decision);
  if (params.entry_type) form.append('entry_type', params.entry_type);
  if (params.cover_amount !== undefined) form.append('cover_amount', String(params.cover_amount));
  if (params.cover_paid !== undefined) form.append('cover_paid', String(params.cover_paid));
  return api.postForm<EntryResult>('/pulse/entry/decision', form);
}

export async function getTodayEntries(venueId: string): Promise<{ entries: any[] }> {
  return api.get(`/pulse/entries/today?venue_id=${venueId}`);
}

export async function createGuest(params: {
  name: string;
  email?: string;
  phone?: string;
  venue_id: string;
  photo?: string;
}): Promise<IntakeResult> {
  const form = new FormData();
  form.append('name', params.name);
  form.append('venue_id', params.venue_id);
  if (params.email) form.append('email', params.email);
  if (params.phone) form.append('phone', params.phone);
  if (params.photo) form.append('photo', params.photo);
  return api.postForm<IntakeResult>('/pulse/guest/intake', form);
}
