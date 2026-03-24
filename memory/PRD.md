# Spet - Nightlife Management Platform

## Original Problem Statement
Build a multi-page "Owner Command Center" and "Pulse" module for a nightlife management application. The user provides highly detailed, pixel-perfect design specifications for each page. The workflow: receive spec -> implement -> verify visually -> await next spec.

## User Personas
- **Owner**: Accesses the Owner Command Center for business analytics, staff management, financial overview
- **Manager**: Accesses the Manager Dashboard for operational management, staff, tables, shift operations
- **Pulse Operator**: Accesses Pulse module for real-time guest check-in, bar POS, rewards

## Core Requirements
- Spec-driven, pixel-perfect UI implementation
- Mock data-driven frontend (no backend APIs yet)
- Brazilian locale (R$ currency where applicable)
- Dark/light theme support
- Unified GlobalNavbar across all modules

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Framer Motion + Recharts
- **Backend**: FastAPI (minimal, auth only currently)
- **Database**: MongoDB (auth only)
- **Data**: Mock data files (`ownerData.js`, `pulseData.js`, `managerModuleData.js`)

## What's Been Implemented

### Global
- [x] GlobalNavbar.js - unified navbar for Owner, Manager, Pulse modules
- [x] Favicon and browser tab title ("Spet - Demo Club")
- [x] Auth flow (login/signup)

### Owner Module
- [x] OwnerLayout.js with collapsible sidebar
- [x] Overview dashboard
- [x] Revenue Analytics (complex multi-level scope selector)
- [x] Profit Analysis, Comparison, Time Analysis pages
- [x] Customer Intelligence, Audience Intelligence, Segments, Churn & Retention
- [x] Customer Profile page
- [x] Loyalty Performance, Campaign Performance
- [x] Financial Overview, Cost Analysis, Venue Cost Detail, Risk & Alerts
- [x] Smart Insights, Action Center
- [x] Venue Management, Venue Detail, Event Detail
- [x] Settings
- [x] **Shift vs Operations integrated** at `/owner/performance/shift-operations` (2024-03-24)
- [x] **Staff integrated** at `/owner/performance/staff` (2024-03-24)

### Manager Module
- [x] ManagerLayout.js with sidebar
- [x] Manager Overview, Staff & Roles, Tables by Server, Menu/Products
- [x] Shift vs Operations, Tips, NFC Guests, Reports & Finance
- [x] Settings, Loyalty (full sub-module)

### Pulse Module
- [x] PulseLayout with GlobalNavbar
- [x] PulseGuest (guest check-in/entry page, v2 redesign)
- [x] PulseBarPage (3-column POS)
- [x] PulseInsidePage, PulseExitPage, PulseRewardsPage
- [x] GuestRegistrationPanel (slide-in form)

### Bug Fixes Applied
- [x] Currency R$ fix in ShiftOperations (from handoff)
- [x] KDS dropdown duplicate key resolved (keys use item.label)
- [x] Hydration warning in PulseBarPage resolved (clean select>option structure)
- [x] space-y vs flex/gap fix on VenueComparison Night Cards

## Prioritized Backlog

### P0 - Next Specs (Awaiting User)
- Pulse Inside (managing guests currently inside)
- Profit Analysis enhancements
- Venue Cost Detail enhancements
- Manager module sidebar refinements

### P1
- CEO Module (navbar link, role-gated)
- GuestFullHistory.js integration into Manager and Pulse

### P2
- Backend API integration (replace all mock data)
- CEO Dashboard endpoints (crm-reports, startup-kpis, mrr-retention)

### P3
- Refactor ownerData.js into smaller domain-specific files
- Refactor managerModuleData.js similarly

## Test Credentials
- Owner/Manager/Pulse: `teste@teste.com` / `12345`

## Key Technical Notes
- For animated lists, always use `flex flex-col gap-*` (NOT `space-y-*`)
- All page headers handled by GlobalNavbar.js
- User responds in Portuguese; agent must also respond in Portuguese
