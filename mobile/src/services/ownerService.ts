/**
 * Owner service — dashboard, venues, finance, insights, growth, people.
 */
import { api } from './api';

export async function getDashboard(view: string = 'business'): Promise<any> {
  return api.get(`/owner/dashboard?view=${view}`);
}

export async function getVenues(): Promise<any> {
  return api.get('/owner/venues');
}

export async function getInsights(): Promise<any> {
  return api.get('/owner/insights');
}

export async function getFinance(): Promise<any> {
  return api.get('/owner/finance');
}

export async function getGrowth(): Promise<any> {
  return api.get('/owner/growth');
}

export async function getPeople(): Promise<any> {
  return api.get('/owner/people');
}

export async function getSystem(): Promise<any> {
  return api.get('/owner/system');
}

export async function getModules(): Promise<any> {
  return api.get('/owner/modules');
}

export async function generateAIInsights(question?: string): Promise<any> {
  const fd = new FormData();
  if (question) fd.append('question', question);
  return api.postForm('/owner/ai-insights', fd);
}
