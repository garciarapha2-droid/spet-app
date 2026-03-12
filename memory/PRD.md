# SPET — Venue Operations Platform

## Original Problem Statement
Multi-tenant SaaS platform for real-time venue operations. Modules: Pulse (guest entry), Tap (bar orders), Table (restaurant), KDS (kitchen display), Manager (analytics), CEO (company-level metrics).

## Core Requirements
- Real-time synchronization across all modules
- Tips attributed ONLY to the specific staff member who handled the order
- Consistent payment flow (Pay Here / Pay at Register) in Tap and Table
- Inside Now panel showing ALL active guests
- Interactive KPIs with drill-down modals
- User & Module management from CEO dashboard

## Tech Stack
- **Frontend**: React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI, PostgreSQL, MongoDB
- **Real-time**: WebSockets
- **Auth**: JWT
- **AI**: OpenAI via Emergent LLM Key

## What's Been Implemented

### Phase 1: Foundation (Complete)
- Full UI rebrand from SPETAP to SPET (dark theme, blue accents)
- Authentication system (JWT)
- Demo data seeding (seed_demo.py)
- All core modules: Pulse, Tap, Table, KDS, Manager, CEO

### Phase 2: Real-time & Sync (Complete)
- WebSocket integration for Manager Dashboard
- Data sync across all modules
- Bar order persistence
- Guest spend calculation

### Phase 3: Operational Rules (Complete - Mar 12, 2026)
- **P0-1**: Tip distribution fix — tips go ONLY to specific bartender (removed pool distribution)
- **P0-2**: Payment flow consistency — both Tap and Table force Pay Here / Pay at Register
- **P0-3**: Inside Now panel — shows ALL active guests with name, time, status, tab ID

### Phase 4: Interactive Dashboards (Complete - Mar 12, 2026)
- **P1-1**: Revenue Today KPI clickable with detailed modal (revenue, tips, payments, sessions, top items)
- **P1-2**: CEO KPIs (MRR, Gross Revenue, Net Profit) clickable with venue breakdown
- **P1-3**: Company Management with user status toggle and module management per venue

## Prioritized Backlog

### P1 (Next)
- Per-Event Dashboard (Manager View)
- Final Demo & Operational Checklist

### P2
- KDS / Bar Order Routing enhancements
- Push notifications for real-time alerts

### P3
- Stripe Webhooks for subscriptions
- Offline-First Capabilities
- Event Wallet Module

## Key Credentials
- Email: teste@teste.com
- Password: 12345
- Venue ID: 40a24e04-75b6-435d-bfff-ab0d469ce543

## Architecture Notes
- PostgreSQL: Transactional data (sessions, items, users)
- MongoDB: Config, barmen, targets, venue configs
- `bartender_id` stored in session meta (JSONB)
- `tab_number` stored in session meta (not a column)
- Protected emails: teste@teste.com (do not delete)
