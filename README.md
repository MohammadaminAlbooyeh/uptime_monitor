# Uptime Monitor

Minimal scaffold for an uptime monitoring app with a Python FastAPI backend and a small React frontend.

Structure:
- `backend/`: FastAPI app, scheduler, checker, minimal SQLite support
- `frontend/`: React components (stubbed)

Quick start (backend):

1. Create a virtualenv and install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

2. Set environment variables in `.env` (or export them):
- `DATABASE_URL` (defaults to `sqlite:///./uptime.db`)
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` for alerts

3. Run the API:

```bash
uvicorn backend.main:app --reload
```

Frontend (stub):

Install deps and start (using Vite or your preferred tool):

```bash
cd frontend
npm install
npm run start
```

This repo contains starter code and placeholders — adapt it to your needs.
