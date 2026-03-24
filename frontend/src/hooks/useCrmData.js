import { useState, useEffect, useCallback, useRef } from 'react';
import * as crm from '../services/crmService';

// ─── useDeals ─────────────────────────────────────────────

export function useDeals(filters) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const version = useRef(0);

  const refetch = useCallback(async () => {
    version.current++;
    const v = version.current;
    setLoading(true);
    setError(null);
    try {
      const data = await crm.getDeals(filters);
      if (v === version.current) setDeals(data);
    } catch (e) {
      if (v === version.current) setError(e.message);
    } finally {
      if (v === version.current) setLoading(false);
    }
  }, [filters?.stage]);

  useEffect(() => { refetch(); }, [refetch]);

  return { deals, loading, error, refetch };
}

// ─── useDeal (single) ─────────────────────────────────────

export function useDeal(id) {
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!id) { setDeal(null); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await crm.getDealById(id);
      setDeal(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refetch(); }, [refetch]);

  return { deal, loading, error, refetch };
}

// ─── useCustomers ─────────────────────────────────────────

export function useCustomers(filters) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const version = useRef(0);

  const refetch = useCallback(async () => {
    version.current++;
    const v = version.current;
    setLoading(true);
    setError(null);
    try {
      const data = await crm.getCustomers(filters);
      if (v === version.current) setCustomers(data);
    } catch (e) {
      if (v === version.current) setError(e.message);
    } finally {
      if (v === version.current) setLoading(false);
    }
  }, [filters?.status, filters?.plan_id, filters?.search]);

  useEffect(() => { refetch(); }, [refetch]);

  return { customers, loading, error, refetch };
}
