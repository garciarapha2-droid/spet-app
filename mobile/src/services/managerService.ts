/**
 * Manager service — overview, staff, shifts, reports.
 */
import { api } from './api';

export interface ManagerOverview {
  revenue_today: number;
  revenue_week: number;
  guests_today: number;
  open_tabs: number;
  avg_ticket: number;
  staff_on_duty: number;
  tables_occupied: number;
  tables_total: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
  shift_start?: string;
  shift_end?: string;
  tables_assigned?: number;
  tips_today?: number;
}

export interface Shift {
  id: string;
  staff_name: string;
  role: string;
  started_at: string;
  ended_at?: string;
  status: string;
  hours?: number;
  tips?: number;
}

export interface ManagerReport {
  total_revenue: number;
  total_guests: number;
  avg_spend: number;
  top_items: { name: string; qty: number; revenue: number }[];
  hourly_revenue: { hour: string; amount: number }[];
}

export async function getOverview(venueId: string): Promise<ManagerOverview> {
  return api.get(`/manager/overview?venue_id=${venueId}`);
}

export async function getStaff(venueId: string): Promise<{ staff: StaffMember[] }> {
  return api.get(`/manager/staff?venue_id=${venueId}`);
}

export async function getShifts(venueId: string): Promise<{ shifts: Shift[] }> {
  return api.get(`/manager/shifts?venue_id=${venueId}`);
}

export async function getReports(venueId: string): Promise<ManagerReport> {
  return api.get(`/manager/reports/sales?venue_id=${venueId}`);
}

export async function getSchedule(venueId: string): Promise<any> {
  return api.get(`/manager/schedule?venue_id=${venueId}`);
}

export async function getGuests(venueId: string): Promise<any> {
  return api.get(`/manager/guests?venue_id=${venueId}`);
}

export async function getTipsDetail(venueId: string): Promise<any> {
  return api.get(`/manager/tips-detail?venue_id=${venueId}`);
}

export async function getRevenueBreakdown(venueId: string): Promise<any> {
  return api.get(`/manager/revenue-breakdown?venue_id=${venueId}`);
}

export async function getShiftOverview(venueId: string): Promise<any> {
  return api.get(`/manager/shift-overview?venue_id=${venueId}`);
}
