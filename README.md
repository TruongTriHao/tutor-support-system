# Tutor Support System

This repository contains a minimal MVP for the Tutor Support System implementing the main use-cases described in the project documents.

Structure
- `/web` - Frontend (React + Vite + TypeScript + Tailwind)
- `/server` - Mock backend (Node + Express) using in-memory data loaded from `/server/data/*.json`

Ports
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173` (Vite default)

Quick start (development)

Package manager: `yarn` (this project uses `yarn`; run `yarn` instead of `npm`).

Install Yarn

If you don't have Yarn installed, use one of these quick options:

- Recommended (Node 16.10+ — uses Corepack):

```powershell
corepack enable
corepack prepare yarn@stable --activate
```

- npm (fallback):

```powershell
npm install -g yarn
```

- Windows (Chocolatey):

```powershell
choco install yarn
```

Verify installation with `yarn -v`.

1. Start server

```powershell
cd server; yarn; yarn dev
```

2. Start frontend (new shell)

```powershell
cd web; yarn; yarn dev
```

Open `http://localhost:5173` and login using any institutional email (e.g. `alice@student.hcmut.edu.vn`).

Demo script (sequence of screens)
1. Login as `alice@student.hcmut.edu.vn` → redirects to Tutors list
2. Browse Tutors -> click a Tutor -> view `TutorProfile` (shows sessions)
3. Click a session -> `SessionPage` -> Book the session (POST /api/bookings)
4. Mark a session as COMPLETED via API (or wait for a completed session), then submit feedback
5. Open `Resources` -> view a resource -> `Open / Stream` (calls `/api/resources/:id/stream`) and bookmark stored in localStorage
6. Check Notifications (top-right) — server pushes notifications when booking/feedback/resources uploaded

Acceptance criteria covered
- UC-AUTH: `/api/auth/login` implemented and frontend stores token/user in `localStorage`.
- UC-BROWSE: `/api/tutors` and `/api/tutors/:id` implemented; frontend pages exist.
- UC-BOOK: `/api/bookings` implemented; booking updates session attendees and notifies tutor.
- UC-SESSION: `/api/sessions` listing; tutors can update status via `/api/sessions/:id/status`.
- UC-FEEDBACK: `/api/feedback` validates session COMPLETED and student attended, prevents duplicates.
- UC-FB-SUMMARY: `/api/feedback/aggregate?tutorId=...` implemented.
- UC-RESOURCES: `/api/resources` and `/api/resources/:id/stream` implemented. Bookmark in `localStorage`.
- UC-LOG: `/api/logs` returns access logs for resources.
- UC-NOTIFY: `/api/notifications` implemented; frontend polls it.

Tests
- Server tests: `cd server; yarn; yarn test` (runs Vitest + supertest for basic endpoint checks)
- Frontend tests: basic scaffolding included; run `cd web; yarn; yarn test`.