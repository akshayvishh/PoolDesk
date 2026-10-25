# Next Session Prompt — PoolDesk Continuation

Copy and paste the prompt below into the next session to resume development or backend integration:

---

```markdown
Resume development of the PoolDesk project.

Please review `PROJECT_STATUS.md` before making changes.

### Current Status:
- The React 19 frontend is complete and fully routed across all 7 screens:
  1. `/login` — Owner Login (no signup routes)
  2. `/dashboard` — Live operations, pool occupancy, revenue
  3. `/registration` — Swimmer pass issuance with capacity guards
  4. `/active-swimmers` — Active swimmers table with live timers, quick checkout, extension
  5. `/expiring-soon` — Unexpired passes with <= 10m remaining
  6. `/records` — Manage Records with multi-filter, search, audit modal, soft cancellation, CSV export
  7. `/reports` — Business intelligence, hourly swim curves, payment breakdown, CSV/print report
- Build status: `npm run build` and `npm run lint` pass with 0 errors.

### Next Objectives (Backend Integration):
1. **Python API Layer (FastAPI or Flask)**:
   - Create REST endpoints matching the data structures in `src/services/mockData.js`:
     - `POST /api/auth/login`
     - `GET /api/pools`, `GET /api/pools/occupancy`
     - `GET /api/registrations`, `POST /api/registrations`
     - `PATCH /api/registrations/:id/checkout`
     - `PATCH /api/registrations/:id/extend`
     - `PATCH /api/registrations/:id/cancel`
     - `GET /api/reports/summary`

2. **MongoDB Persistence**:
   - Collections: `users`, `pools`, `registrations`.
   - Ensure soft-delete pattern for cancelled registrations.
   - Maintain historical index on `passId` and `createdAt`.

3. **Frontend API Client**:
   - Replace demo in-memory storage in `src/context/AppContext.jsx` with Axios/Fetch calls pointing to the backend.
```
