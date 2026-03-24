/**
 * NFC service — register, scan, unlink, list.
 */
import { api } from './api';

export interface NfcTag {
  tag_id: string;
  tag_uid: string;
  guest_id: string;
  guest_name: string;
  guest_photo?: string;
  venue_id: string;
  status: string;
  label?: string;
  assigned_by?: string;
  created_at: string;
  last_scanned?: string;
}

export interface GuestChip {
  type: string;
  label: string;
  severity?: string;
}

export interface ScanGuest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  visits: number;
  spend_total: number;
  flags: string[];
  tags: string[];
  risk_chips: GuestChip[];
  value_chips: GuestChip[];
  last_visit?: string;
}

export interface ScanResult {
  tag_uid: string;
  tag_id: string;
  guest: ScanGuest;
  tab: {
    number: number | null;
    total: number;
    has_open_tab: boolean;
  };
  scanned_at: string;
}

export interface RegisterResult {
  tag_id: string;
  tag_uid: string;
  guest_id: string;
  guest_name: string;
  venue_id: string;
  status: string;
  label?: string;
  message: string;
}

export async function scanNfcTag(tagUid: string, venueId: string): Promise<ScanResult> {
  return api.post<ScanResult>('/nfc/scan', { tag_uid: tagUid, venue_id: venueId });
}

export async function registerNfcTag(
  tagUid: string,
  guestId: string,
  venueId: string,
  label?: string,
): Promise<RegisterResult> {
  return api.post<RegisterResult>('/nfc/register', {
    tag_uid: tagUid,
    guest_id: guestId,
    venue_id: venueId,
    label,
  });
}

export async function unlinkNfcTag(tagUid: string, venueId: string): Promise<void> {
  await api.post('/nfc/unlink', { tag_uid: tagUid, venue_id: venueId });
}

export async function listVenueTags(venueId: string, status = 'active'): Promise<{ tags: NfcTag[]; total: number }> {
  return api.get(`/nfc/tags?venue_id=${venueId}&status=${status}`);
}

/**
 * Normalize raw NFC tag UID to colon-separated uppercase hex.
 * Input: "04A32B1CD4E5F6" → Output: "04:A3:2B:1C:D4:E5:F6"
 */
export function normalizeTagUid(rawId: string): string {
  const hex = rawId.replace(/[:\-\s]/g, '').toUpperCase();
  return hex.match(/.{1,2}/g)?.join(':') || hex;
}
