# Tutor Support System

This repository contains an MVP for the Tutor Support System.

## Requirements

- Node.js v16+ (Node 18+ recommended).
- Yarn or npm installed. The instructions use `yarn`, but you can substitute `npm install` and `npm run` where appropriate.

Structure
- `/web` - Frontend (React + Vite + TypeScript + Tailwind)
- `/server` - Mock backend (Node + Express) using in-memory data loaded from `/server/data/*.json`

Ports
- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173` (Vite default)

Quick start (development)

Package manager: `yarn`.

Install Yarn

```powershell
npm install yarn
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

Open `http://localhost:5173` and login using any institutional email:
- For admin: admin@hcmut.edu.vn, password: admin 
- For tutor: alice@hcmut.edu.vn, password: alice
- For student: frank@hcmut.edu.vn, password: frank

Demo script (sequence of screens)
1. Login as `frank@student.hcmut.edu.vn` → redirects to Tutors list
2. Browse Tutors -> click a Tutor -> view `TutorProfile` (shows sessions)
3. Click a session -> `SessionPage` -> Book the session
4. Wait for a completed session, then submit feedback
5. Open a session you attended -> under "Resources for this session" view a resource -> `Open / Stream`, `Download` and bookmark stored in localStorage
6. Check Notifications (top-right) — server pushes notifications when booking/feedback/resources uploaded