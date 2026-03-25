/**
 * CEO service — health, revenue, pipeline, users, alerts.
 */
import { api } from './api';

export async function getHealth(): Promise<any> {
  return api.get('/ceo/health');
}

export async function getRevenue(period: string = 'month'): Promise<any> {
  return api.get(`/ceo/revenue?period=${period}`);
}

export async function getTargets(): Promise<any> {
  return api.get('/ceo/targets');
}

export async function getCompanies(): Promise<any> {
  return api.get('/ceo/companies');
}

export async function getAlerts(): Promise<any> {
  return api.get('/ceo/alerts');
}

export async function getPipeline(): Promise<any> {
  return api.get('/ceo/pipeline');
}

export async function getUsers(): Promise<any> {
  return api.get('/ceo/users');
}

export async function getOverviewMetrics(): Promise<any> {
  return api.get('/ceo/overview-metrics');
}

export async function getRevenueDetailed(): Promise<any> {
  return api.get('/ceo/revenue-detailed');
}

export async function getKpiBreakdown(kpi: string): Promise<any> {
  return api.get(`/ceo/kpi-breakdown?kpi=${kpi}`);
}
