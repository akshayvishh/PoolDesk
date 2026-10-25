# Next Session Prompt — PoolDesk Continuation

Copy and paste the prompt below into the next session to resume development or deployment:

---

```markdown
Resume development of the PoolDesk project.

Please review `PROJECT_STATUS.md` before making changes.

### Current Status:
- Full-stack system is operational and verified:
  - Frontend: React 19 + Vite 8 at `http://localhost:5173/` (all 7 screens routed).
  - Backend: Python 3.14 + FastAPI + Uvicorn at `http://127.0.0.1:8000/`.
  - Database: MongoDB Atlas connected via PyMongo (`pooldesk_db`), ping test verified.
  - Secret protection: `backend/.env` is strictly git-ignored.
- Test commands:
  - Database Ping: `npm run test:db` (or `python backend/test_db.py`)
  - Backend API: `npm run backend`
  - Frontend: `npm run dev`
  - Production Build: `npm run build`

### Next Potential Objectives:
1. **Authentication Enhancement**:
   - Introduce JWT or hashed owner passwords (bcrypt / argon2) in FastAPI.
2. **Thermal Receipt Printing Automation**:
   - Add ESC/POS direct USB printing or PDF auto-download options.
3. **Turnstile / Hardware Sync Simulation**:
   - Add webhook or event simulator for automatic turnstile bar checks.
4. **Production Deployment Packaging**:
   - Create Docker compose setup for backend or deploy backend to cloud (Render / Railway) and frontend to Vercel.
```
