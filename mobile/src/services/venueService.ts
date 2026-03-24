/**
 * Venue service — home, modules, selection.
 */
import { api } from './api';

export interface Venue {
  id: string;
  name: string;
}

export interface Module {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  locked_reason: string | null;
}

interface VenueHomeResponse {
  venues: Venue[];
  active_venue: Venue;
  modules: Module[];
  user_email: string;
  user_role: string;
}

export async function getVenueHome(): Promise<VenueHomeResponse> {
  return api.get<VenueHomeResponse>('/venue/home');
}
