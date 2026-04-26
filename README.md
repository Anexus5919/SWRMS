# Smart Workforce & Route Management System (SWRMS)

A technology-driven solution for improving municipal waste collection operations through geo-fenced attendance verification, AI-powered face recognition, geotagged photo validation, live route tracking, road-snapped GPS replay, automated workforce reallocation, real-time push alerts, multilingual field PWA, and a tamper-evident audit log.

Built for the **Brihanmumbai Municipal Corporation (BMC)**, Chembur Ward, Mumbai - aligned with **UN Sustainable Development Goal 11: Sustainable Cities and Communities** (Target 11.6).

> **Vivekanand Education Society's Institute of Technology**
> Department of Information Technology | Project Synopsis 2025–26, Sem IV
> Guide: Prof. Archana Kshirsagar

🌐 **Live deployment**: https://swrms.vercel.app

---

## Problem Statement

Mumbai generates approximately 7,500–9,000 metric tonnes of municipal solid waste daily. BMC manages collection through predefined routes with dedicated crews. Despite this structure, operations face three critical issues:

1. **Attendance fraud** - Workers mark attendance at ward offices but don't report to assigned routes. Manual registers and basic biometrics lack location verification.
2. **Static workforce allocation** - When staff are absent, supervisors manually reassign workers. Shorter routes complete by mid-morning leaving workers idle, while longer routes remain incomplete.
3. **No real-time monitoring** - Supervisors have no centralised mechanism to detect understaffing, route deviations, or shift completions early enough to take corrective action.

These findings are based on direct field visits to BMC ward offices in Chembur and interactions with Solid Waste Management (SWM) staff and supervisors.

---

## Solution Overview

SWRMS addresses all three gaps through an integrated platform.

### For Field Staff (Mobile-first PWA)
- **Multilingual interface** - English, Hindi, Marathi; switchable per-user, persisted in localStorage
- **Face registration** - One-time selfie enrollment extracts a 128-dimensional face descriptor using face-api.js (TensorFlow.js)
- **Geo-fenced attendance** - GPS-verified check-in within 200 m of assigned route start point using the Haversine formula. Mock-GPS apps are detected and rejected at HTTP 403; clock-drift > 5 minutes is flagged
- **Geotagged photo capture** - Staff take photos at shift start, checkpoints, and shift end. Each photo is GPS-stamped and face-verified
- **Live shift tracking (opt-in)** - One-tap "Start Shift" begins ~30 s GPS pings against the road-snapped route polyline; auto-stops at shift end or route completion
- **Daily checklist** - Home page shows step-by-step progress: face → attendance → shift start photo → route progress → shift end photo
- **Self-declared unavailability** - Four large icon buttons (Sick / Personal / No Transport / Other) for low-literacy users to declare leave
- **Offline-first** - Attendance queued in localStorage when offline, auto-synced when connectivity returns

### For Supervisors (Dashboard)
- **Real-time route dashboard** - Live staffing ratios, route completion progress, color-coded status, KPI rollup (% completed by 10 am / 12 pm / 2 pm)
- **Live worker map** - Server-Sent Events feed (5 s tick) overlays worker positions on top of road-snapped polylines; off-route workers ringed in red
- **Verification alerts** - Unified inbox for face mismatches, missing photos, route deviations, idle alerts, mock-GPS attempts, missed shifts
- **Push notifications** - Web Push (VAPID-signed) delivers urgent alerts to subscribed browsers/phones within ~1 second; bell icon with unread badge
- **Photo review modal** - Side-by-side comparison of geotagged photo vs registered profile photo, with confidence score, GPS coordinates, approve/reject controls
- **Workforce reallocation** - Engine identifies surplus workers from completed routes and recommends reassignment to understaffed routes, sorted by Haversine proximity. Transactional execute with audit log
- **GPS replay** - Scrub through any worker's GPS trail for any past day with playback controls (2×–32×); off-route and mock-GPS pings highlighted
- **Reliability scoring** - Per-worker 0–100 score over 30 days, aggregated from missed shifts, late arrivals, geofence rejections, deviation/idle alerts, mock-GPS, face issues. Worst performers surface first
- **CSV export** - Verification log export with RFC-4180 quoting and UTF-8 BOM (so Excel handles Hindi/Marathi)

### For Administrators
- **Staff management** - CRUD with face registration status badges; CSV bulk import
- **Route management** - CRUD with OSRM road-snapping on create/edit; expandable assigned-staff list
- **Reports & analytics** - Daily summary, attendance trends, route performance, verification summary, KPI rollup
- **Audit log** - Government-grade tamper-evident trail of every supervisor/admin write action with actor identity, IP, user-agent, before/after diffs
- **Government letterhead print mode** - Print Header + Footer + corner-stamped etched BMC seal on every printed page

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Presentation Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Staff PWA   │  │  Supervisor  │  │    Admin     │      │
│  │ (en/hi/mr)   │  │  Dashboard   │  │   Panel      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  Next.js 16 App Router + NextAuth JWT + Zod + Rate-limit    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │  Geofence +  │ │   Anomaly    │ │  Reallocation +  │    │
│  │ Face Verify  │ │  Detection   │ │ Reliability + KPI│    │
│  │  (Haversine) │ │ (Deviation,  │ │     Engines      │    │
│  │              │ │ Idle, Mock-  │ │                  │    │
│  │              │ │  GPS, Cron)  │ │                  │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐    │
│  │   SSE Live   │ │   Web Push   │ │  Audit Log +     │    │
│  │     Feed     │ │ (VAPID-signed│ │   Soft-delete    │    │
│  │              │ │  + inbox)    │ │   Persistence    │    │
│  └──────────────┘ └──────────────┘ └──────────────────┘    │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌─────────────────┐  ┌──────────┐  ┌────────────────────┐
│  MongoDB Atlas  │  │   OSRM   │  │  Web Push Services │
│ (13 collections)│  │ (Road    │  │ (FCM, Mozilla,     │
│                 │  │  snap)   │  │  Apple)            │
└─────────────────┘  └──────────┘  └────────────────────┘
```

---

## Core Algorithms

### Geo-fenced Attendance (Haversine)

The system computes the great-circle distance between the worker's GPS coordinates and the route start point:

```
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
d = 2R × atan2(√a, √(1-a))
```

Where R = 6,371 km (Earth's radius). If `d ≤ 200 m` (configurable per route via `geofenceRadius`), attendance is verified. The system takes 3 GPS readings and uses the median to mitigate urban-canyon drift (20–50 m in Mumbai's narrow lanes).

### Face Verification (Euclidean Distance on 128-d Embeddings)

| Distance | Confidence | Action |
|----------|-----------|--------|
| < 0.5 | High | Auto-verified |
| 0.5 – 0.65 | Medium | Verified, flagged for spot-check |
| 0.65 – 0.8 | Low | Mandatory manual review |
| > 0.8 | No match | Rejected, critical alert generated |

Face descriptors are extracted client-side using face-api.js (TensorFlow.js). The comparison (Euclidean distance) runs server-side on plain number arrays. Every uncertain case triggers a `VerificationLog` entry with the photo attached for supervisor review.

### Route Deviation Detection

A live ping is compared against the route's road-snapped polyline using a point-to-polyline distance algorithm (perpendicular distance to each segment, take the minimum). A single off-route ping is treated as GPS bounce and ignored. Two consecutive off-route pings - gated by a 15-minute cooldown - fire a warning verification log AND a Web Push to all supervisors.

### Idle / Stationary Detection

The engine examines the worker's last 12 minutes of pings and computes the bounding-box span of those positions. If the span is below 25 metres and the sample window is at least 80 % full, an idle alert is raised. Push delivery is opt-in (`TRACKING_IDLE_PUSH=1`) because lunch breaks are common false positives.

### Workforce Reallocation Engine

After the attendance window closes (30 min post shift-start):
1. Compute staffing ratio per route: `presentStaff / requiredStaff`
2. Flag routes with ratio < 0.5 as **critical**
3. Identify surplus workers from routes with ratio > 1.0 that are completed
4. Sort candidates by Haversine distance to the understaffed route
5. Generate ranked reallocation suggestions; supervisor approval triggers a transactional User update + Reallocation document + audit log

### Reliability Scoring

Per worker over a rolling 30-day window, the engine starts each scheduled day at 100 points and deducts:
- Missed shift: −60
- Geofence rejection: −20
- Late arrival (> 15 min): −5
- Route deviation alert: −5 (capped at −20)
- Idle alert: −2 (capped at −10)
- Mock-GPS attempt: −50
- Face mismatch: −10 (capped at −20)

Days with declared unavailability are excluded from the average (sick leave is neutral, not a penalty). Output is `{ score, rating, breakdown, daily }` where rating is `excellent ≥ 90 / good ≥ 75 / fair ≥ 60 / poor < 60`.

### KPI Rollup

For each (route, day) in the lookback window, find the earliest `RouteProgress.updates[]` entry where `percentage = 100`, classify its IST hour into cutoff buckets (10 am / 12 pm / 2 pm), and roll up to a percentage of total route-days. Drives the dashboard's KPI card with per-day sparklines.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router, Turbopack) | Server-rendered React with Server-Sent Events |
| Language | TypeScript end-to-end | Strict-mode type safety, shared types client + server |
| Authentication | NextAuth 4 (JWT, Credentials) | Role-based access (staff/supervisor/admin) |
| Database | MongoDB Atlas, Mongoose 9 | Document store with composite indexes |
| Routing service | OSRM (Open Source Routing Machine) | Snap GPS points to road network |
| Maps | Leaflet 1.9, react-leaflet 5 | Route visualisation, GPS replay scrub |
| Face Detection | face-api.js 0.22 (TensorFlow.js) | 128-d face embedding extraction |
| Real-time | Server-Sent Events (native) | Supervisor live-position feed |
| Push | web-push 3.6 (VAPID) | Browser/phone notifications |
| Charts | Recharts 3.8 | Attendance trends, route performance |
| Validation | Zod 4 | Runtime schema validation on all API inputs |
| Rate-limit | In-memory token bucket | 429 with Retry-After + RateLimit-* headers |
| Geolocation | Browser Geolocation API | GPS with 3-reading median filtering |
| Service Worker | Custom (`public/sw.js`) | Web Push delivery + click-to-mark-read |
| PWA | Web App Manifest | Installable on Android home screen |
| i18n | Custom React Context | English / Hindi / Marathi for staff PWA |
| Deployment | Vercel | Region `bom1` (Mumbai), daily cron, edge SSE |

All dependencies are open-source. No paid APIs or services required for pilot deployment.

---

## User Flows

### Staff Daily Flow
```
Login → /home (daily checklist, in en/hi/mr)
  │
  ├── Step 1: Face Registration (one-time, blocks all access until done)
  │     └── /onboarding → front camera → face-api.js → 128-d descriptor saved
  │
  ├── Step 2: Mark Attendance
  │     └── /attendance → GPS capture → Haversine + mock-GPS check → verified
  │           └── "Take Shift Start Photo" CTA appears
  │
  ├── Step 3: Shift Start Photo
  │     └── /photo-check?type=shift_start → camera → face-api.js → descriptor
  │           └── Server compares against registered descriptor → result
  │
  ├── Step 4: Live Tracking (opt-in)
  │     └── /home → Start Shift → 30 s GPS pings → deviation + idle checks
  │
  ├── Step 5: Route Progress → /progress (% updates, can scan NFC/QR checkpoints)
  │
  └── Step 6: Shift End Photo → /photo-check?type=shift_end
```

### Supervisor Flow
```
/dashboard (KPI rollup, live route grid + map, 5 s SSE for positions)
  ├── Bell icon: unread alerts (push + inbox at /notifications)
  ├── Red banner: critical routes → /reallocation
  ├── Map view: live worker pins, off-route ringed red
  ├── KPI card: % routes completed by 10/12/2 pm, 14-day sparklines
  ├── /reliability: workforce 0–100 scores with detail modal
  ├── /replay: scrub any worker's GPS trail for any date
  ├── /supervisor-logs: verification logs + photo review + CSV export
  ├── /attendance-log: daily attendance records
  └── Route cards → /routes/[id] (detail view)
```

---

## Database Schema

**13 collections:**

| Collection | Purpose |
|---|---|
| `users` | Employees: employeeId, name, role, ward, passwordHash, assignedRouteId, profilePhoto, faceDescriptor (128 floats), faceRegisteredAt, isActive |
| `routes` | name, code, ward, startPoint, endPoint, waypoints, requiredStaff, geofenceRadius, shiftStart/End, OSRM `routePolyline` (encoded), status |
| `attendances` | userId, routeId, date, checkInTime, coordinates, distanceFromRoute, status (verified/rejected), mockLocation, clockDriftSeconds, deviceInfo, isOfflineSync |
| `routeprogresses` | Per-route daily summary: status, completionPercentage, staffingSnapshot, timestamped updates[] |
| `gpspings` | Live tracking samples: userId, routeId, date, recordedAt, coordinates, distanceFromRouteMeters, isOffRoute, mockLocation |
| `geophotos` | Photo records: type, photo (base64), coordinates, faceDescriptor, verificationResult, manualReview |
| `verificationlogs` | Alert trail: type (location_anomaly / face_mismatch / missing_photo / etc), severity, kind (route_deviation / idle / mock_location), resolution status |
| `auditlogs` | Government-grade audit: action, category, actor identity + role, target, before/after diff, IP, user-agent, ward |
| `reallocations` | Worker transfer record with from/to routes, reason, distance, status |
| `unavailabilities` | Self-declared leave: reason (sick/personal/transport/other), declaredAt, routeId |
| `checkpoints` + `checkpointscans` | NFC/QR sticker registry + scan trail |
| `pushsubscriptions` | Web Push endpoints (one per browser install) with p256dh + auth keys |
| `notificationlogs` | Inbox: per-recipient alert record with pushDelivered, readAt, clickedAt |

---

## API Endpoints (38 routes)

### Authentication
- `GET|POST /api/auth/[...nextauth]` - NextAuth credential flow

### Staff
- `GET|POST /api/staff` - list / create staff
- `GET|PUT /api/staff/[staffId]` - fetch / update one
- `POST /api/staff/bulk-import` - CSV bulk import
- `GET|POST /api/staff/face` - face descriptor registration
- `GET /api/staff/status` - daily status checklist
- `GET /api/staff/reliability` - workforce reliability table
- `GET /api/staff/reliability/[userId]` - per-worker daily series

### Attendance
- `GET|POST /api/attendance` - list / mark geo-fenced check-in (rate-limited)
- `GET|POST /api/attendance/sync` - offline-queue sync

### Routes
- `GET|POST /api/routes` - list / create routes
- `GET|PUT /api/routes/[routeId]` - fetch / update route (with audit + OSRM re-snap)
- `POST /api/routes/[routeId]/snap` - admin re-snap to road network
- `GET|PUT /api/routes/[routeId]/progress` - fetch / update progress

### Photos
- `GET|POST /api/photos` - list / upload geotagged photo with face verification (rate-limited)
- `GET|PUT /api/photos/[photoId]` - fetch / manual review
- `POST /api/photos/missing` - detect missing-photo workers

### Live Tracking
- `POST /api/tracking/ping` - GPS sample (rate-limited 240/hr)
- `GET /api/tracking/live` - latest ping per worker
- `GET /api/tracking/stream` - Server-Sent Events live feed
- `GET /api/tracking/replay` - historical ping series for replay

### Checkpoints
- `GET|POST /api/checkpoints` - list / create checkpoint
- `POST /api/checkpoints/scan` - NFC/QR scan recording

### Reallocation
- `GET /api/reallocation/suggestions` - engine-computed suggestions
- `POST /api/reallocation` - execute approved transfer (transactional)

### Verification & Audit
- `GET|PUT /api/verification` - list / resolve verification logs
- `GET /api/audit` - audit log search

### Reports & Dashboards
- `GET /api/dashboard` - supervisor KPI summary
- `GET /api/reports` - daily summary, trends, performance, verification
- `GET /api/reports/kpi-rollup` - % routes completed by cutoff time

### Push & Notifications
- `GET /api/push/vapid-key` - public VAPID key for browser subscribe
- `POST|DELETE /api/push/subscribe` - register / remove push subscription
- `GET /api/notifications` - inbox list (paginated)
- `GET /api/notifications/unread-count` - badge count
- `POST /api/notifications/[id]/read` - mark one read (also clicked from SW)
- `POST /api/notifications/read-all` - bulk mark read

### Cron
- `POST /api/cron/missed-shift-alert` - daily 06:30 IST detection of missed shifts (CRON_SECRET-gated)

### Self-Declared Leave
- `POST /api/unavailability` - staff declare unable to work today (rate-limited 5/day)

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free M0 tier is sufficient)
- Modern browser with GPS (Chrome/Edge on Android recommended)

### Setup

```bash
# Clone and install
git clone https://github.com/Anexus5919/SWRMS.git
cd SWRMS
npm install

# Configure environment - copy .env.example to .env.local and fill in:
cp .env.example .env.local
```

#### Required environment variables

```env
MONGODB_URI=mongodb+srv://...                # Your MongoDB Atlas connection
NEXTAUTH_SECRET=<openssl rand -base64 32>    # JWT signing secret
NEXTAUTH_URL=http://localhost:3000           # or your deployed URL

# Web Push (generate with: npm run vapid:generate)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:ops@bmc.example

# Cron auth (for /api/cron/* - generate with: openssl rand -hex 32)
CRON_SECRET=...
```

#### Optional environment variables

```env
OSRM_BASE_URL=https://router.project-osrm.org    # Defaults to public demo
TRACKING_DEVIATION_THRESHOLD_METERS=120          # Off-route alert threshold
TRACKING_IDLE_THRESHOLD_MINUTES=10               # Stationary alert threshold
TRACKING_IDLE_PUSH=                              # Set to 1 to push idle alerts
NEXT_PUBLIC_DEMO_BYPASS_FACE=                    # Set to 1 to skip face gate (DEMO ONLY)
```

#### Seed demo data

```bash
# Minimal seed: 10 routes, 30 staff, today's attendance + verification logs
npx tsx seed/seed.ts

# With historical data: 29 days of varied attendance for realistic
# reliability scores + KPI rollup percentages
npx tsx seed/seed.ts --with-history

# With GPS pings: synthesises road-snapped trails so /replay isn't empty
npx tsx seed/seed.ts --with-pings

# Both flags can be combined for the densest demo
npx tsx seed/seed.ts --with-history --with-pings
```

#### Diagnostic tool

```bash
# Dump current DB state (used to debug missed-shift-alert flow)
npx tsx seed/diagnose.ts
```

#### Run

```bash
npm run dev          # Development server on http://localhost:3000
npm run build        # Production build
npm run start        # Run built app
npm run vapid:generate   # Generate fresh VAPID keypair
```

### Demo Credentials

| Role | Employee ID | Password |
|------|------------|----------|
| Admin | `BMC-CHB-ADMIN` | `bmc123` |
| Supervisor | `BMC-CHB-SUP01` | `bmc123` |
| Staff | `BMC-CHB-001` | `bmc123` |

### MongoDB Atlas IP Whitelist
You must whitelist your current IP address in MongoDB Atlas → Network Access before the app can connect. For development, you can use "Allow Access from Anywhere" (`0.0.0.0/0`).

### Triggering the Cron Manually

To test the missed-shift alert flow locally:

```bash
# PowerShell (Windows): note the .exe to bypass the curl alias
curl.exe -X POST "http://localhost:3000/api/cron/missed-shift-alert?force=1" \
  -H "x-cron-secret: <your CRON_SECRET>"
```

The `?force=1` query parameter bypasses the 06:30 IST shift-lapse guard for testing. In production deployment, Vercel Cron triggers this daily at 01:00 UTC (06:30 IST) via `vercel.json`.

---

## Deployment

The application is deployed on **Vercel** at https://swrms.vercel.app.

Key deployment config (`vercel.json`):
- Region: `bom1` (Mumbai) for India-side users
- Function timeout: 30 s (covers OSRM calls)
- Daily cron schedule: `0 1 * * *` UTC = 06:30 IST → `/api/cron/missed-shift-alert`

Vercel Cron automatically attaches `Authorization: Bearer $CRON_SECRET`, and the endpoint accepts both `x-cron-secret` (manual curl) and `Authorization: Bearer` (Vercel) header shapes.

Next 16 file convention: this project uses `src/proxy.ts` (the renamed `middleware.ts`) for role-based path gating.

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Login page
│   ├── (staff)/                  # Staff PWA pages (mobile-first)
│   │   ├── home/                 # Daily checklist with tracking + unavailability
│   │   ├── onboarding/           # Face registration gate
│   │   ├── attendance/           # Geo-fenced check-in
│   │   ├── photo-check/          # Geotagged photo capture
│   │   ├── my-route/             # Route map with snapped polyline
│   │   └── progress/             # Route progress updates
│   ├── (supervisor)/             # Supervisor pages
│   │   ├── dashboard/            # Live KPI + route grid + map
│   │   ├── reallocation/         # Workforce reallocation engine UI
│   │   ├── attendance-log/       # Attendance records
│   │   ├── supervisor-logs/      # Verification logs + photo review + CSV export
│   │   ├── reliability/          # Workforce reliability scores
│   │   ├── replay/               # GPS replay with scrub bar
│   │   └── routes/[routeId]/     # Single-route detail
│   ├── (admin)/                  # Admin pages
│   │   ├── staff/                # Staff CRUD + bulk import
│   │   ├── routes/               # Route CRUD with OSRM snap
│   │   ├── reports/              # Multi-tab analytics (printable)
│   │   ├── admin-logs/           # All-ward verification logs + CSV export
│   │   └── audit/                # Government-grade audit log search
│   ├── notifications/            # Shared inbox (supervisor + admin)
│   ├── about/ help/ privacy/ terms/   # Public pages
│   └── api/                      # 38 API route handlers
├── components/
│   ├── brand/                    # BMCSeal, WordMark, Illustrations
│   ├── camera/FaceRegistration/  # Face enrollment component
│   ├── layout/                   # BMCHeader, MobileNav, DesktopNav,
│   │                             #   PublicHeader, PrintHeader/Footer/CornerStamp
│   ├── maps/                     # RouteMap, DashboardOverviewMap, GPSReplayMap
│   ├── staff/                    # UnavailabilityCard
│   ├── supervisor/               # KpiRollupCard, NotificationBell, PushToggle
│   ├── tracking/                 # TrackingCard
│   ├── providers/                # SessionProvider
│   └── ui/                       # Badge, Button, Card, Input, Spinner,
│                                 #   Skeleton, Toast, ConfirmDialog
├── lib/
│   ├── auth/                     # NextAuth config + role middleware
│   ├── db/models/                # 13 Mongoose models
│   ├── engine/                   # anomaly + reliability + kpi + reallocation
│   │                             #   + staffing-ratio engines
│   ├── face/                     # Client (face-api.js) + Server (compare)
│   ├── geo/                      # Haversine + geofence + polyline distance
│   ├── routing/                  # OSRM client + polyline decode
│   ├── push/                     # VAPID-signed Web Push + recordAndPush helper
│   ├── rate-limit/               # In-memory token bucket
│   ├── audit/                    # logAudit() helper
│   ├── i18n/                     # LocaleProvider + en/hi/mr message catalogue
│   ├── utils/                    # csv generator, IST timezone, constants
│   └── validators/               # Zod schemas for all API inputs
├── hooks/                        # useGeolocation, useCamera,
│                                 #   useOfflineQueue, useLiveTracking
└── proxy.ts                      # Next 16 role-based path gating
                                  # (renamed from middleware.ts in v16)

public/
├── bmc_logo.png                  # Official BMC seal (colour) - UI branding
├── bmc_logo_sketch.png           # Etched seal - print stamp + page watermark
├── sdg_logo.png                  # UN SDG 11 mark
├── manifest.json                 # PWA manifest
└── sw.js                         # Service worker (push + click-mark-read)

seed/
├── seed.ts                       # Main seeder (--with-history, --with-pings)
└── diagnose.ts                   # State-dump for missed-shift debugging

vercel.json                       # Region bom1, cron 01:00 UTC, function config
next.config.ts                    # canvas + face-api.js as serverExternalPackages
```

---

## SDG 11 Alignment

This project directly addresses **UN SDG 11, Target 11.6**: *"Reduce the adverse per capita environmental impact of cities, including by paying special attention to municipal and other waste management."*

- **Workforce accountability** - Geo-fenced attendance + face verification + mock-GPS detection eliminate proxy attendance, ensuring workers are physically at their assigned routes
- **Resource optimisation** - Dynamic reallocation redistributes idle workers from completed routes to understaffed ones without additional hiring
- **Environmental sustainability** - Digital attendance eliminates paper registers; improved collection reduces street garbage accumulation
- **Social sustainability** - Multilingual PWA (en/hi/mr) with large-icon UI for low-literacy field staff; designed for low-cost Android devices and intermittent connectivity

---

## Research Context

Based on field visits to BMC Chembur ward offices and literature review of:

1. Bhagat & Dharmale (2023) - Eco-efficiency optimisation of MSW systems
2. Gupta, Kumar & Singh (2019) - Vehicle routing for urban SWM with periodic variation
3. Hashemi-Amiri, Ji & Tian (2023) - Integrated location-scheduling-routing for smart MSW
4. Ministry of Housing & Urban Affairs (2016) - India's Solid Waste Management Rules
5. World Bank (2020) - Urban SWM in developing countries (15–30 % absenteeism rates)

**Research gap identified**: Existing systems focus on vehicle routing and waste-volume prediction. None address workforce attendance verification at field locations, dynamic staff reallocation based on real-time route progress, or government-grade audit trails for daily field operations. This project fills that gap.

---

## Limitations & Future Scope

### Honest current limitations
- **No automated test suite** - zero unit/integration/e2e tests in the codebase. The five engines (anomaly, reliability, KPI, reallocation, staffing) are pure functions and would benefit from explicit test coverage before wider rollout.
- **In-memory rate limiter** - single-instance only; multi-replica deployments would need a Redis-backed swap (the public API of `lib/rate-limit/` is already shaped for that).
- **Server-side face descriptor extraction is not done** - the server compares two descriptors but trusts the client to extract one. Mock-GPS detection + audit + photo retention compensate; production deployments should add server-side re-extraction.
- **Single-ward in practice** - `User.ward`, `Route.ward`, and `AuditLog.ward` fields exist, but the application's defaults all fall back to "Chembur". Multi-ward rollout requires only data entry, not code changes.
- **Public OSRM demo** - default routing endpoint is `router.project-osrm.org`, which is rate-limited. Production needs a self-hosted OSRM with India OSM data.
- **Service worker scope** - handles Web Push only; no offline asset caching beyond the PWA install.
- **Forgot-password flow** - placeholder page; no email transport wired.
- **Demo bypass flag** - `NEXT_PUBLIC_DEMO_BYPASS_FACE=1` skips face gate end-to-end; **must be unset in any pilot or production deployment**.

### Planned enhancements
- Predictive attendance forecasting using historical patterns (day of week, weather, festivals)
- Vehicle telematics integration for correlating worker presence with vehicle movement
- Citizen feedback module (SMS/WhatsApp) for missed-collection reports
- BMC payroll integration for attendance-linked salary processing
- Extension to other municipal services (street sweeping, drain cleaning)
- Server-side face descriptor re-extraction (close the client-trust gap)
- Redis-backed rate limiting for horizontal scale-out

---

## Team

| Name | Institution | Email |
|------|------------|-------|
| Adarsh Singh | V.E.S.I.T | 2024.adarsh.singh@ves.ac.in |
| Piyush Shukla | V.E.S.I.T | 2024.piyush.shukla@ves.ac.in |
| Mayuresh Sarkale | V.E.S.I.T | 2024.mayuresh.sarkale@ves.ac.in |
| Daksh Patel | V.E.S.I.T | d2025.daksh.patel@ves.ac.in |

**Organization**: Brihanmumbai Municipal Corporation (BMC), Chembur Ward Office
**Address**: 19B, 20A, Rd No. 1, Chembur Gaothan, Mumbai, Maharashtra 400 071

---

## License

This project is developed as an academic field project for V.E.S.I.T's Department of Information Technology. All software dependencies are open-source. Source available for adaptation by other BMC wards and academic reviewers under the same academic-pilot terms.
