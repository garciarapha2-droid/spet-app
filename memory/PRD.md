# SPETAP — Product Requirements Document

## Original Problem Statement
Multi-tenant SaaS platform for venue operations (nightclubs, bars, restaurants). Modules: Pulse (entrance), Tap (bar), Table (restaurant), KDS (kitchen display), Manager, Owner, and CEO dashboards.

## Core Requirements
- Real-time venue operations management
- Multi-module architecture (Pulse, Tap, Table, KDS)
- Role-based dashboards (Manager, Owner, CEO)
- Demo-first approach: always presentable with seeded data
- All modules must communicate: Pulse <-> Tap <-> Table <-> KDS <-> Manager

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Databases**: PostgreSQL (transactional), MongoDB (documents/guests/events)
- **Auth**: JWT in localStorage
- **LLM**: OpenAI GPT-5.2 via emergentintegrations

## What's Been Implemented

### Core Modules (Complete)
- Pulse (Entrance) + Bar with bartender selector + tips + Inside guest filtering
- Tap (Bar) with full order lifecycle + camera + cancel/confirm + pay at register
- Table (Restaurant) with server assignments + seats mandatory + auto KDS routing
- KDS (Kitchen Display) with Kitchen/Bar tabs + ETA modal + delayed handling

### Dashboards (Complete)
- Manager Dashboard: All tabs + Tables by Server drill-down + Shift KPI drill-down
- Owner Dashboard: Multi-venue selector + Growth & Loyalty + Modules display
- CEO Dashboard: KPIs, revenue charts, target tracking

### Block 1 — 12 Refinements (COMPLETE — Feb 28, 2026)
1. TABLE - Mandatory Server + Seats ✅
2. TAP/BAR - Persistent bartender ✅
3. TAP/BAR - Cancel/Confirm buttons ✅
4. TAP/BAR - Clean slate after confirmation ✅
5. KDS - Demo delayed ticket + alert bug fix ✅
6. MANAGER - Tables by Server drill-down ✅
7. MENU - Category + alphabetical sorting ✅
8. OWNER - Multi-venue selector ✅
9. OWNER - Past + active events ✅
10. OWNER - Venue perf above Event perf ✅
11. OWNER - Growth & Loyalty enhanced ✅
12. OWNER - Active Modules display ✅

### Block 2 — 12 P0 Corrections (COMPLETE — Feb 28, 2026)
1. TABLE → KDS: Kitchen items auto-route to KDS ✅
2. ROUTING: Kitchen→Kitchen KDS, Bar→Bar KDS ✅
3. PHOTO: Camera getUserMedia + Upload file picker ✅
4. PULSE/BAR: Only "Inside" guests shown ✅
5. BAR/TAP: Inside guests eligible for tabs ✅
6. PULSE/BAR: Bartender selector required ✅
7. PULSE: Checkout with tips (18%/20%/22%/Custom) ✅
8. KDS: Demo data for Kitchen + Bar with Delayed ✅
9. KDS: ETA modal required before Preparing ✅
10. MANAGER: Shift KPIs clickable with drill-down ✅
11. TAP: Pay at Register keeps tab open ✅
12. DATA: Guest persistence across events ✅

## Prioritized Backlog
- (P0) Demo checklist + UX polish (next)
- (P1) Per-Event Dashboard (Manager View)
- (P2) KDS / Bar Order Routing refinement
- (P2) Push notifications
- (P3) Stripe Webhooks
- (P3) Offline-First
- (P3) Event Wallet Module

## Credentials
- Email: teste@teste.com
- Password: 12345
