# Smart Workforce & Route Management System (SWRMS)

A technology-driven solution for improving municipal waste collection operations through geo-fenced attendance verification, AI-powered face recognition, geotagged photo validation, real-time route monitoring, and dynamic workforce reallocation.

Built for the **Brihanmumbai Municipal Corporation (BMC)**, Chembur Ward, Mumbai - aligned with **UN Sustainable Development Goal 11: Sustainable Cities and Communities** (Target 11.6).

> **Vivekanand Education Society's Institute of Technology**
> Department of Information Technology | Project Synopsis 2025-26, Sem IV
> Guide: Prof. Archana Kshirsagar

---

## Problem Statement

Mumbai generates approximately 7,500–9,000 metric tonnes of municipal solid waste daily. BMC manages collection through predefined routes with dedicated crews. Despite this structure, operations face three critical issues:

1. **Attendance fraud** - Workers mark attendance at ward offices but don't report to assigned routes. Manual registers and basic biometrics lack location verification.
2. **Static workforce allocation** - When staff are absent, supervisors manually reassign workers. Shorter routes complete by mid-morning leaving workers idle, while longer routes remain incomplete.
3. **No real-time monitoring** - Supervisors have no centralized mechanism to detect understaffing early enough to take corrective action.

These findings are based on direct field visits to BMC ward offices in Chembur and interactions with Solid Waste Management (SWM) staff and supervisors.

---

## Solution Overview

SWRMS addresses all three gaps through an integrated platform:

### For Field Staff (Mobile-first)
- **Geo-fenced attendance** - GPS-verified check-in within 200m of assigned route start point using the Haversine formula
- **Face registration** - One-time selfie enrollment extracts a 128-dimensional face descriptor using face-api.js (TensorFlow.js)
- **Geotagged photo capture** - Staff take photos at shift start, checkpoints, and shift end. Each photo is GPS-stamped and face-verified against their registered embedding
- **Daily checklist** - Home page shows step-by-step progress: face registered → attendance → shift start photo → route progress → shift end photo
- **Offline-first** - Attendance queued in localStorage when offline, auto-synced when connectivity returns

### For Supervisors (Dashboard)
- **Real-time route dashboard** - Live staffing ratios, route completion progress, color-coded status (green/amber/red)
- **Verification alerts** - Amber banner showing count of critical issues (face mismatches, missing photos, no-face detections) with direct link to review
- **Photo review modal** - Side-by-side comparison of geotagged photo vs registered profile photo, with confidence score, GPS coordinates, and approve/reject controls
- **Workforce reallocation** - Engine identifies surplus workers from completed routes and recommends reassignment to understaffed routes, sorted by geographic proximity

### For Administrators
- **Staff management** - CRUD with face registration status badges per employee
- **Route management** - CRUD with expandable assigned staff list showing face enrollment status
- **Reports & analytics** - Attendance trends (line charts), route performance (bar charts), verification summaries
- **Verification logs** - All-ward view of alerts with resolution workflow

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Staff PWA   │  │  Supervisor  │  │    Admin     │  │
│  │  (Mobile)    │  │  Dashboard   │  │   Panel      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼───────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│  Next.js 16 API Routes + NextAuth JWT + Zod Validation  │
│  ┌────────────┐ ┌──────────┐ ┌─────────────────────┐   │
│  │ Attendance  │ │  Photos  │ │ Reallocation Engine │   │
│  │ + Geofence  │ │ + Face   │ │ + Staffing Ratio    │   │
│  │ (Haversine) │ │ Verify   │ │   Calculator        │   │
│  └────────────┘ └──────────┘ └─────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│              MongoDB Atlas (Cloud)                       │
│  Users | Routes | Attendance | RouteProgress |           │
│  GeoPhotos | VerificationLogs | Reallocations            │
└─────────────────────────────────────────────────────────┘
```

---

## Core Algorithms

### Geo-fenced Attendance (Haversine Formula)

The system computes the great-circle distance between the worker's GPS coordinates and the route start point:

```
a = sin²(Δφ/2) + cos(φ₁) × cos(φ₂) × sin²(Δλ/2)
d = 2R × atan2(√a, √(1-a))
```

Where R = 6,371 km (Earth's radius). If `d ≤ 200m` (configurable), attendance is verified. The system takes 3 GPS readings and uses the median to mitigate urban canyon drift (20-50m in Mumbai's narrow lanes).

### Face Verification (Euclidean Distance on 128-d Embeddings)

| Distance | Confidence | Action |
|----------|-----------|--------|
| < 0.5 | High | Auto-verified |
| 0.5 – 0.65 | Medium | Verified, flagged for spot-check |
| 0.65 – 0.8 | Low | Mandatory manual review |
| > 0.8 | No match | Rejected, critical alert generated |

Face descriptors are extracted client-side using face-api.js (TensorFlow.js). The comparison (Euclidean distance) runs server-side. Every uncertain case triggers a VerificationLog entry with the photo attached for supervisor review.

### Workforce Reallocation Engine

After the attendance window closes (30 min post shift-start):
1. Compute staffing ratio per route: `presentStaff / requiredStaff`
2. Flag routes with ratio < 0.5 as **critical**
3. Identify surplus workers from routes with ratio > 1.0 that are completed
4. Sort candidates by Haversine distance to the understaffed route
5. Generate ranked reallocation suggestions with impact scores

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 | Server-rendered React with App Router |
| Authentication | NextAuth 4 (JWT, Credentials) | Role-based access (staff/supervisor/admin) |
| Database | MongoDB Atlas, Mongoose 9 | Document store with geospatial indexes |
| Maps | Leaflet 1.9, react-leaflet 5 | Route visualization |
| Face Detection | face-api.js 0.22 (TensorFlow.js) | 128-d face embedding extraction |
| Charts | Recharts 3.8 | Attendance trends, route performance |
| Validation | Zod 4 | Runtime schema validation on all API inputs |
| Geolocation | Browser Geolocation API | GPS with 3-reading median filtering |
| Offline | localStorage queue | Attendance sync when connectivity returns |

All dependencies are open-source. No paid APIs or services required for pilot deployment.

---

## User Flows

### Staff Daily Flow
```
Login → /home (daily checklist)
  │
  ├── Step 1: Face Registration (one-time, blocks all access until done)
  │     └── /onboarding → front camera → face-api.js → 128-d descriptor saved
  │
  ├── Step 2: Mark Attendance
  │     └── /attendance → GPS capture → Haversine check → verified/rejected
  │           └── "Take Shift Start Photo" CTA button appears
  │
  ├── Step 3: Shift Start Photo
  │     └── /photo-check?type=shift_start → rear camera → capture + face detect
  │           └── Face compared against registered embedding → result
  │
  ├── Step 4: Route Progress → /progress (percentage updates)
  │
  └── Step 5: Shift End Photo → /photo-check?type=shift_end
```

### Supervisor Flow
```
/dashboard (live route cards, 15s polling)
  ├── Red banner: "X routes critically understaffed" → /reallocation
  ├── Amber banner: "X verification issues" → /supervisor-logs
  │     └── Each log shows: severity, type, worker, route, message
  │     └── "View Photo" → modal with side-by-side photos + confidence score
  │           └── Approve/Reject → auto-resolves associated verification log
  └── Route cards → /routes/[id] (detail view)
```

---

## Database Schema

**7 collections:**

- **Users** - employeeId, name, role, ward, phone, passwordHash, assignedRouteId, profilePhoto, faceDescriptor (128 floats), faceRegisteredAt
- **Routes** - name, code, ward, startPoint, endPoint, waypoints, estimatedLengthKm, requiredStaff, geofenceRadius, shiftStart/End, status
- **Attendance** - userId, routeId, date, checkInTime, coordinates, distanceFromRoute, status (verified/rejected), deviceInfo, isOfflineSync
- **RouteProgress** - routeId, date, status, completionPercentage, staffingSnapshot, updates[]
- **GeoPhotos** - userId, routeId, date, type, photo (base64), coordinates, faceDetected, facesCount, faceDescriptor, verificationResult, manualReview
- **VerificationLogs** - type, severity, routeId, date, affectedUserId, geoPhotoId, details, resolution
- **Reallocations** - fromRouteId, toRouteId, workerId, supervisorId, date, reason, status, distanceBetweenRoutes

---

## API Endpoints (18 routes)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/[...nextauth]` | Public | Login (employeeId + password) |
| POST | `/api/attendance` | Staff | Mark geo-fenced attendance |
| GET | `/api/attendance` | Supervisor | List attendance records |
| POST | `/api/attendance/sync` | Staff | Sync offline attendance |
| POST | `/api/photos` | Staff | Upload geotagged photo with face verification |
| GET | `/api/photos` | Supervisor | List photos (paginated) |
| GET | `/api/photos/[id]` | Supervisor | Get photo with full base64 data |
| PUT | `/api/photos/[id]` | Supervisor | Manual review (approve/reject) |
| POST | `/api/photos/missing` | Supervisor | Detect workers with attendance but no photo |
| GET | `/api/staff/status` | Staff | Daily checklist status |
| POST | `/api/staff/face` | Any | Register face descriptor |
| GET | `/api/staff/face` | Any | Check face registration status |
| GET | `/api/dashboard` | Supervisor | Route KPIs + verification alert counts |
| GET | `/api/reallocation/suggestions` | Supervisor | Engine-computed reallocation suggestions |
| POST | `/api/reallocation` | Supervisor | Execute reallocation |
| GET | `/api/verification` | Supervisor | Verification logs with filtering |
| PUT | `/api/verification` | Supervisor | Resolve verification log |
| GET | `/api/reports` | Supervisor | Reports (daily summary, trends, performance) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free M0 tier is sufficient)
- Modern browser with GPS (Chrome/Edge on Android recommended)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd Field_Project
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your MongoDB URI and NextAuth secret:
#   MONGODB_URI=mongodb+srv://...
#   NEXTAUTH_SECRET=your-random-secret-min-32-chars
#   NEXTAUTH_URL=http://localhost:3000

# Seed demo data (10 routes, 30 staff, demo attendance + verification logs)
npx tsx seed/seed.ts

# Start development server
npm run dev
```

### Demo Credentials

| Role | Employee ID | Password |
|------|------------|----------|
| Admin | `BMC-CHB-ADMIN` | `bmc123` |
| Supervisor | `BMC-CHB-SUP01` | `bmc123` |
| Staff | `BMC-CHB-001` | `bmc123` |

### Important: MongoDB Atlas IP Whitelist
You must whitelist your current IP address in MongoDB Atlas > Network Access before the app can connect. For development, you can use "Allow Access from Anywhere" (0.0.0.0/0).

---

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Login page
│   ├── (staff)/                  # Staff pages (mobile-first)
│   │   ├── home/                 # Daily checklist dashboard
│   │   ├── onboarding/           # Face registration gate
│   │   ├── attendance/           # Geo-fenced check-in
│   │   ├── photo-check/          # Geotagged photo capture
│   │   ├── my-route/             # Route map view
│   │   └── progress/             # Route progress updates
│   ├── (supervisor)/             # Supervisor pages
│   │   ├── dashboard/            # Live route dashboard
│   │   ├── reallocation/         # Workforce reallocation
│   │   ├── attendance-log/       # Attendance records
│   │   └── supervisor-logs/      # Verification logs + photo review
│   ├── (admin)/                  # Admin pages
│   │   ├── staff/                # Staff CRUD
│   │   ├── routes/               # Route CRUD with assigned staff
│   │   ├── reports/              # Analytics with Recharts
│   │   └── admin-logs/           # All-ward verification logs
│   └── api/                      # 18 API route handlers
├── components/
│   ├── camera/FaceRegistration/  # Face enrollment component
│   ├── layout/                   # BMCHeader, MobileNav, DesktopNav
│   ├── maps/                     # Leaflet route visualization
│   └── ui/                       # Badge, Button, Card, Input, Spinner
├── lib/
│   ├── auth/                     # NextAuth config + role middleware
│   ├── db/models/                # 7 Mongoose models
│   ├── engine/                   # Reallocation + staffing ratio
│   ├── face/                     # Client (face-api.js) + Server (compare)
│   ├── geo/                      # Haversine + geofence verification
│   ├── utils/                    # Constants, IST timezone
│   └── validators/               # Zod schemas for all API inputs
├── hooks/                        # useGeolocation, useCamera, useOfflineQueue
└── middleware.ts                  # Role-based route protection
```

---

## SDG 11 Alignment

This project directly addresses **UN SDG 11, Target 11.6**: *"Reduce the adverse per capita environmental impact of cities, including by paying special attention to municipal and other waste management."*

- **Workforce accountability** - Geo-fenced attendance eliminates proxy attendance, ensuring workers are physically at their assigned routes
- **Resource optimization** - Dynamic reallocation redistributes idle workers from completed routes to understaffed ones without additional hiring
- **Environmental sustainability** - Digital attendance eliminates paper registers; improved collection reduces street garbage accumulation
- **Social sustainability** - Designed for low-cost Android devices and low-bandwidth environments, accessible to all staff

---

## Research Context

Based on field visits to BMC Chembur ward offices and literature review of:

1. Bhagat & Dharmale (2023) - Eco-efficiency optimization of MSW systems
2. Gupta, Kumar & Singh (2019) - Vehicle routing for urban SWM with periodic variation
3. Hashemi-Amiri, Ji & Tian (2023) - Integrated location-scheduling-routing for smart MSW
4. Ministry of Housing & Urban Affairs (2016) - India's Solid Waste Management Rules
5. World Bank (2020) - Urban SWM in developing countries (15-30% absenteeism rates)

**Research gap identified**: Existing systems focus on vehicle routing and waste volume prediction. None address workforce attendance verification at field locations, or dynamic staff reallocation based on real-time route progress. This project fills that gap.

---

## Limitations & Future Scope

### Current Limitations
- Face recognition accuracy degrades in poor lighting and with partial face occlusion (handled via tiered confidence + manual review fallback)
- GPS drift in urban canyons (20-50m) mitigated by 3-reading median but not eliminated
- Client-side face processing - for production, should move server-side to prevent tampering

### Planned Enhancements
- Predictive attendance forecasting using historical patterns (day of week, weather, festivals)
- Vehicle telematics integration for correlating worker presence with vehicle movement
- Citizen feedback module (SMS/WhatsApp) for missed collection reports
- BMC payroll integration for attendance-linked salary processing
- Extension to other municipal services (street sweeping, drain cleaning)

---

## Team

| Name | Institution | Email |
|------|------------|-------|
| Adarsh Singh | V.E.S.I.T | 2024.adarsh.singh@ves.ac.in |
| Piyush Shukla | V.E.S.I.T | 2024.piyush.shukla@ves.ac.in |
| Mayuresh Sarkale | V.E.S.I.T | 2024.mayuresh.sarkale@ves.ac.in |
| Daksh Patel | V.E.S.I.T | d2025.daksh.patel@ves.ac.in |

**Organization**: Brihanmumbai Municipal Corporation (BMC), Chembur Ward Office
**Address**: 19B, 20A, Rd No. 1, Chembur Gaothan, Mumbai, Maharashtra 400071

---

## License

This project is developed as an academic field project. All software dependencies are open-source.
