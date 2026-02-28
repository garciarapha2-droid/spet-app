# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). Modules: Pulse (entrance), Tap (bar), Table (restaurant), KDS (kitchen display), Manager, Owner, and CEO dashboards.

## Core Requirements
- Real-time venue operations management
- Multi-module architecture (Pulse, Tap, Table, KDS)
- Role-based dashboards (Manager, Owner, CEO)
- Demo-first approach: always presentable with seeded data

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents/guests/events)
- **Auth**: JWT in localStorage
- **LLM**: OpenAI GPT-5.2 via emergentintegrations

## What's Been Implemented

### Core Modules (Complete)
- Pulse (Entrance) + Bar search
- Tap (Bar) with full order lifecycle
- Table (Restaurant) with server assignments
- KDS (Kitchen Display) with Kanban board + drag & drop

### Dashboards (Complete)
- Manager Dashboard: Overview, Staff, Menu, Shifts, Guests, Reports, Loyalty, Settings, Tables by Server, Shift Ops
- Owner Dashboard: Overview (Business/Venue/Events), Performance, AI Insights, Finance, Growth & Loyalty, People & Ops, System
- CEO Dashboard: KPIs, revenue charts, target tracking, company management

### 12-Point Refinement Block (COMPLETE — Feb 28, 2026)
1. TABLE - Mandatory Server + Seats fields on open ✅
2. TAP/BAR - Persistent bartender across categories ✅
3. TAP/BAR - Cancel Order (red) + Confirm Order (green) buttons ✅
4. TAP/BAR - Clean slate after order confirmation ✅
5. KDS - Demo delayed ticket + alert bug fix ✅
6. MANAGER - Tables by Server drill-down (view/void items) ✅
7. MENU - Two-level sorting (category order + alphabetical) ✅
8. OWNER - Multi-venue selector ✅
9. OWNER - Past + active events visible ✅
10. OWNER - Performance by Venue above Performance by Event ✅
11. OWNER - Growth & Loyalty (New vs Recurring + Total Sign-ups) ✅
12. OWNER - Active Modules display (ON/OFF status) ✅

## Prioritized Backlog
- (P1) Per-Event Dashboard (Manager View) for single-event analysis
- (P2) KDS / Bar Order Routing (food vs drink split)
- (P2) Push notifications for real-time alerts
- (P3) Stripe Webhooks for subscriptions
- (P3) Offline-First Capabilities
- (P3) Event Wallet Module

## Credentials
- Email: teste@teste.com
- Password: 12345
