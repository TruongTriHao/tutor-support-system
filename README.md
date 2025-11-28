# SE_CC04_CC05_Group6 - Tutor Support MVP

This repository contains a minimal MVP for the Tutor Support System implementing the main use-cases described in the project documents.

Structure
- `/web` - Frontend (React + Vite + TypeScript + Tailwind)
- `/server` - Mock backend (Node + Express) using in-memory data loaded from `/server/data/*.json`
- `/docs/USECASES.md` - Extracted use-cases summary

Ports
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173` (Vite default)

Quick start (development)

1. Start server

```powershell
cd server; npm install; npm run dev
```

2. Start frontend (new shell)

```powershell
cd web; npm install; npm run dev
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
- Server tests: `cd server; npm install; npm test` (runs Vitest + supertest for basic endpoint checks)
- Frontend tests: basic scaffolding included; run `cd web; npm install; npm test`.

Notes & assumptions
- Auth is mocked (email-only). No persistence beyond server runtime.
- Feedback anonymity: `isAnonymous` flag is stored and in aggregation comments are returned but not linked to student ids.

CHANGELOG
- chore: scaffold repo (docs + skeleton)
- feat: add mock server and data
- feat: implement tutors listing & profile
- feat: implement booking & feedback flows
- feat: add resources streaming simulation & notifications
- test: add basic server auth test