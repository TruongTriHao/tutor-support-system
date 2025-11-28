Use-Cases

## Primary Use-Cases

1. Authentication (UC-AUTH)
   - Student and Tutor login (institutional email). For the MVP we simulate authentication: frontend sends email to `/api/auth/login` and receives a mock token and user profile. Session persisted in `localStorage`.

2. Browse Tutors (UC-BROWSE)
   - Students can browse a list of tutors (`GET /api/tutors`). Tutor profile (`GET /api/tutors/:id`) shows expertise and available sessions.

3. Book Session (UC-BOOK)
   - Student chooses a tutor slot and creates a booking (`POST /api/bookings`). Booking is stored in-memory and reflected in student and tutor dashboards.

4. Sessions (UC-SESSION)
   - Sessions list (`GET /api/sessions`), view session details. Tutors can update session status (e.g., SCHEDULED -> COMPLETED).

5. Feedback (UC-FEEDBACK)
   - Students can submit feedback for a session (`POST /api/feedback`) when session status is COMPLETED and they attended. One feedback per student per session. Supports anonymous flag.

6. Feedback Summary (UC-FB-SUMMARY)
   - Aggregated feedback for tutors (`GET /api/feedback/aggregate?tutorId=...`) returns average rating, count, and recent comments (anonymized).

7. Resources (UC-RESOURCES)
   - Resources listing and search by `courseCode` (`GET /api/resources?courseCode=...`). Resource detail and simulated streaming/download (`GET /api/resources/:id/stream`). Bookmarking is simulated in `localStorage`.

8. Resource Access Logging (UC-LOG)
   - Each resource access creates an in-memory log accessible via `GET /api/logs?resourceId=...`.

9. Notifications (UC-NOTIFY)
   - When feedback is saved or a resource is uploaded the server pushes a notification into an in-memory array. Frontend polls `GET /api/notifications` to show notifications.

## Rules & Business Logic (MVP assumptions)

- Authentication is simulated by email only; no password or SSO.
- Feedback eligibility: session.status must be `COMPLETED` and the student must be in `session.attendees`. Duplicate feedback is prevented.
- Bookings update the session's `attendees` list; sessions are predefined in `/server/data/sessions.json`.
- Bookmarks are stored only in browser `localStorage`.
- Analytics logs are stored in-memory and reset when server restarts.

## Files created by the agent

- `/web` - React + Vite + TypeScript frontend (Tailwind basic setup).
- `/server` - Express mock API (in-memory, loads initial data from `/server/data/*.json`).
- `/docs/EXTRACTED_USECASES.md` - this document.

If any detail in the original docs was ambiguous, I implemented the simplest sensible rule and documented it here and in the README.
