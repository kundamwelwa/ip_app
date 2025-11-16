<div align="center">

## IP Address Management System

Adaptive equipment + IP governance platform built with Next.js 15, Prisma, and Tailwind CSS.

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Core Workflows](#core-workflows)
8. [Data Integrity & Monitoring](#data-integrity--monitoring)
9. [Testing & Quality](#testing--quality)
10. [Project Conventions](#project-conventions)
11. [Roadmap](#roadmap)
12. [License](#license)

---

## Overview

This system unifies equipment provisioning, IP allocation, conflict detection, and operational insights into a single control plane. Users can:

- Register equipment with optional multi-IP assignments during creation.
- Manage standalone IP pools and assign/unassign addresses later.
- Detect duplicate assignments and conflicting network records in real time.
- Run diagnostics/cleanup routines to keep the database pristine.
- Customize UI behavior through feature flags and dynamic monitoring widgets.

---

## Key Features

- **Adaptive UI**
  - Orbitron + Inter typography, dark/light-aware AdaptiveLogo component, responsive sidebar/header.
  - SystemSearch component with keyboard shortcuts, fuzzy filtering, and quick actions.
- **Equipment Management**
  - Optional multi-IP assignment during creation (`IPAddressFields` component).
  - Dynamic “+N more” popovers for equipment with multiple IPs.
  - Toast + ConfirmationDialog components replace all native `alert/confirm`.
- **IP Management**
  - IP availability checker with `not_in_database` recommendations and action cards.
  - Conflict detection report (per IP + assignment context).
  - Assign/unassign controls respect validation layers and hook-based modals.
- **Integrity & Diagnostics**
  - Duplicate IP Monitor widget with localStorage visibility toggle.
  - `/api/system/integrity` endpoint that flags cross-equipment duplicate assignments.
  - `/api/system/diagnostics` and `/api/system/cleanup` to detect/resolve duplicate IP records.
- **Feature Flags**
  - `lib/feature-flags.ts` exposes toggles for dashboard modules and IP field visibility (subnet/gateway/DNS/notes).
- **UX Enhancements**
  - Custom Toast + Confirmation flows (`useToast`, `useConfirmation` hooks).
  - Real-time equipment monitoring controls (start/stop/check statuses).

---

## Architecture

| Layer | Description |
| --- | --- |
| UI (Next.js App Router) | `components/` hosts dashboard modules, shared UI, and context providers (theme/session). |
| API Routes | REST-like endpoints under `app/api/**` for equipment, IP addresses, assignments, diagnostics, and monitors. |
| Data Access | Prisma ORM models (PostgreSQL). Transactions enforce atomic equipment + IP creation. |
| Feature Flags | Centralized toggles in `lib/feature-flags.ts`. |
| Utilities | Hooks for toasts, confirmations, monitoring intervals, and state machines. |

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS.
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL.
- **Auth:** `next-auth` with `getServerSession`.
- **UI Toolkit:** Custom components (AdaptiveLogo, SystemSearch, Toast, ConfirmationDialog, Popover, Switch).
- **Tooling:** ESLint, Prettier, npm (Node 18+).

---

## Getting Started

```bash
# Install deps
npm install

# Run dev server
npm run dev

# Open browser
open http://localhost:3000
```

### Recommended Node Version

Use Node.js 18.18+ (`nvm use 18`).

---

## Environment Variables

Create `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_SECRET="generate-secure-secret"
NEXTAUTH_URL="http://localhost:3000"
```

Run migrations:

```bash
npx prisma migrate dev
```

---

## Core Workflows

### Equipment + IP Creation (Optional Coupling)
1. Navigate to Equipment dashboard (`/equipment`).
2. Toggle “Assign IPs on Creation”.
3. Choose number of IPs (1–5) to reveal `IPAddressFields`.
4. Submit -> API transaction creates equipment, IPs (if new), and assignments atomically.

### IP Pool Management
1. Navigate to IP Management (`/ip-management`).
2. Use “Add IP Address” dialog to create standalone IPs.
3. Assign/unassign via table actions and confirmation modals.

### IP Checker Flow
1. Use IP Checker component to query availability.
2. If `not_in_database`, two action cards appear:
   - “Add with Equipment” → `/equipment?addIP=...` auto-opens dialog with pre-filled IP.
   - “Add to IP Management” → `/ip-management?addIP=...` auto-opens dialog with IP field set.

### Conflict & Integrity Monitoring
- `Duplicate IP Monitor` widget summarizes total conflicts and critical issues.
- `/api/system/integrity` returns health score + recommendations.
- `/api/ip-addresses/conflicts` surfaces detailed conflict records.

---

## Data Integrity & Monitoring

- **Duplicate Assignment Prevention**
  - `app/api/ip-addresses/check/route.ts` → statuses: `available`, `assigned`, `conflict`, `not_in_database`.
  - `app/api/ip-assignments/route.ts` → multi-layer validation (active assignment lookup, IP status check).
- **Transactions**
  - Equipment creation uses Prisma transactions so IP creation + assignment succeed or rollback together.
- **Diagnostics**
  - `/api/system/diagnostics` logs duplicate IP records and status mismatches.
  - `/api/system/cleanup` consolidates duplicate IP entries by reassigning and deleting redundant rows.

---

## Testing & Quality

- **Linting:** `npm run lint`
- **Type Safety:** TypeScript strict mode.
- **Manual Verification Checklist**
  - Equipment add/edit/delete operations.
  - IP add/assign/unassign flows.
  - IP checker states (`available`, `assigned`, `not_in_database`, `conflict`).
  - Integrity monitor toggling + localStorage persistence.

(Automated integration tests are planned; see roadmap.)

---

## Project Conventions

- **Component Structure:** colocated styles via Tailwind; variant props for theme responsiveness.
- **State Management:** React hooks; minimal context usage (ThemeProvider, SessionProvider).
- **API Standards:** Return JSON with `{ data, error }` or `{ status, details }`. Use HTTP status codes (`409` for conflicts, `401` for unauthorized, etc.).
- **Error Handling:** Server logs detailed errors; client shows toast notifications.
- **URL Parameters:** `?addIP=X` auto-opens relevant dialogs with prefilled data.

---

## Roadmap

- Implement “View Details” action on equipment table.
- Finalize “Unassign” workflow in IP tables (UI parity with backend changes).
- Enhance equipment info drawer with richer telemetry.
- Hide/replace Real-time Network Status card until backend data feed is ready.
- Add automated tests for IP integrity endpoints.

---

## License

Copyright © 2025.
 
This project is proprietary and not open-source. Contact the personbelow for usage permissions.

[KellyCode-2464](#kellycodemwelwa@gmail.com)
