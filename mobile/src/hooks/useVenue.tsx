/**
 * Venue context — manages selected venue.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as venueService from '../services/venueService';

interface VenueState {
  venues: venueService.Venue[];
  selectedVenue: venueService.Venue | null;
  modules: venueService.Module[];
  loading: boolean;
}

interface VenueContextValue extends VenueState {
  loadVenues: () => Promise<void>;
  selectVenue: (venue: venueService.Venue) => void;
  clearVenue: () => void;
  venueId: string;
}

const VenueContext = createContext<VenueContextValue>({
  venues: [],
  selectedVenue: null,
  modules: [],
  loading: false,
  loadVenues: async () => {},
  selectVenue: () => {},
  clearVenue: () => {},
  venueId: '',
});

export function VenueProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<VenueState>({
    venues: [],
    selectedVenue: null,
    modules: [],
    loading: false,
  });

  const loadVenues = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      const data = await venueService.getVenueHome();
      const selected = data.venues.length === 1 ? data.venues[0] : data.active_venue;
      setState({
        venues: data.venues,
        selectedVenue: selected,
        modules: data.modules,
        loading: false,
      });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const selectVenue = useCallback((venue: venueService.Venue) => {
    setState(s => ({ ...s, selectedVenue: venue }));
  }, []);

  const clearVenue = useCallback(() => {
    setState(s => ({ ...s, selectedVenue: null }));
  }, []);

  const venueId = state.selectedVenue?.id || '';

  return (
    <VenueContext.Provider value={{ ...state, loadVenues, selectVenue, clearVenue, venueId }}>
      {children}
    </VenueContext.Provider>
  );
}

export function useVenue() {
  return useContext(VenueContext);
}
