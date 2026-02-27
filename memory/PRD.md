# SPETAP - Product Requirements Document

## Original Problem Statement
SPETAP is a multi-tenant SaaS platform for venue operations (clubs, restaurants, bars, events).

### Core Principles
- `session_id` is canonical identifier, void is ledger-safe
- Currency: **USD ($)**
- Tab numbers: sequential per day (#101+)
- UI: desktop-first, dark-mode optimized, Stripe-like

### Tech Stack
- React + Tailwind + Shadcn UI | FastAPI | PostgreSQL + MongoDB | JWT Auth

---

## Implemented Features

### Venue Home - COMPLETE
- Calendar + events, Modules dropdown in header (no cards)
- CEO hidden from non-CEO users

### PULSE Module - COMPLETE
- NFC + Manual Entry, Guest Intake with camera, Deduplication
- Inside page (clickable guests), Exit page (red modal for open tabs/blocked wristbands)
- Guest Profile with block/unblock wristband

### TAP Module - COMPLETE
- **Tab numbers** (#101+) on every tab card and detail
- **37 menu items** across 7 categories (Snacks, Starters, Mains, Cocktails, Drinks, Beers, No Alcohol)
- **Custom Item** form: name, $ price, category, alcohol toggle
- **Barman Management**: CRUD from dropdown (add/edit/delete)
- DISCO MODE + Table toggle, void items (ledger-safe with reason)
- Currency: **$ USD** (not R$)

### TABLE Module - COMPLETE
- **Server/Waiter selection** when opening table
- Table layout with zones, add/edit/delete tables
- Void items, Send to KDS, DISCO MODE toggle

### KDS Module - COMPLETE
- **4-Column Kanban**: Pending → Preparing → Ready → **Delayed**
- **Live timers**: countdown/count-up, estimated time setting
- **ORDER DELAYED popup**: auto-appears, Mark Ready / Dismiss
- **Kitchen/Bar routing**: food→kitchen, drinks→bar

### Manager Dashboard - COMPLETE
- Sidebar: Menu, Staff, Settings, Reports
- **Menu Management**: 37 items, search, category filters, Add Item
- **Staff Management**: CRUD barmen with edit/delete
- **Settings**: Venue name, currency, operating mode, KDS toggle
- **Reports**: Open Tabs, Revenue, Active Staff cards

### Owner Dashboard - COMPLETE
- Sidebar: Overview, Venues, Analytics, Managers, Settings
- **Business Overview**: Revenue, Open Tabs, Closed, MTD metrics
- **Venue card** with live stats
- **Managers tab**: user access management

### Rewards System - COMPLETE
### Block Wristband System - COMPLETE

---

## Prioritized Backlog

### P1 - Next
- Manager: Edit/Delete menu items, photo upload for items
- Owner: Multi-venue support (Add New Venue flow)
- Real-time WebSocket for KDS → Table notifications

### P2
- Event Wallet module, Loyalty enhancements
- Tips system, Restaurant mode
- Camera photo for catalog items

### P3
- Offline-first, Stripe webhooks, CEO Dashboard

---

## Test Results
- iteration_9: 7/7 backend + 100% frontend (P0 bugs)
- iteration_10: 11/11 backend + 100% frontend (Barman CRUD, KDS Kanban)
- iteration_11: 13/13 backend + 100% frontend (Tab numbers, menu categories, Manager/Owner dashboards, $ currency)

## Credentials
- Email: teste@teste.com | Password: 12345 | Venue: 40a24e04-75b6-435d-bfff-ab0d469ce543
