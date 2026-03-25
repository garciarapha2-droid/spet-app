/**
 * CEO/Owner analytics service — dashboards, reports, KPIs.
 */
import { api } from './api';

export interface SecurityAnalytics {
  total_users: number;
  active_sessions: number;
  failed_logins_24h: number;
  mfa_enabled_pct: number;
  login_trend: { date: string; count: number }[];
  top_users: { name: string; logins: number; last_login: string }[];
}

export interface ReportsAnalytics {
  total_revenue: number;
  total_deals: number;
  conversion_rate: number;
  avg_deal_value: number;
  monthly_revenue: { month: string; revenue: number }[];
  top_products: { name: string; revenue: number; units: number }[];
  pipeline_stages: { stage: string; count: number; value: number }[];
}

export interface RevenueTargets {
  current_revenue: number;
  target_revenue: number;
  achievement_pct: number;
  monthly_targets: { month: string; target: number; actual: number }[];
  by_venue: { venue: string; target: number; actual: number; pct: number }[];
}

export async function getSecurityAnalytics(): Promise<SecurityAnalytics> {
  return api.get('/crm/analytics/security');
}

export async function getReportsAnalytics(): Promise<ReportsAnalytics> {
  return api.get('/crm/analytics/reports');
}

export async function getRevenueTargets(): Promise<RevenueTargets> {
  return api.get('/crm/analytics/revenue-targets');
}

// Owner endpoints
export async function getOwnerOverview(venueId: string): Promise<any> {
  return api.get(`/owner/overview?venue_id=${venueId}`);
}

export async function getFinancialOverview(venueId: string): Promise<any> {
  return api.get(`/owner/finance?venue_id=${venueId}`);
}

export async function getCustomerIntelligence(venueId: string): Promise<any> {
  return api.get(`/owner/customers?venue_id=${venueId}`);
}

export async function getRevenueAnalytics(venueId: string): Promise<any> {
  return api.get(`/owner/revenue?venue_id=${venueId}`);
}
