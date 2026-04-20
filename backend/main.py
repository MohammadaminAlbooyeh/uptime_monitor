import os
import sys
from pathlib import Path

# Ensure repo root is on sys.path so `python main.py` works when run from `backend/` on Pi
ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db, SessionLocal, list_sites, create_site_if_not_exists, record_check, recent_checks_for_site
from backend.schemas import SiteCreate, SiteOut, CheckOut
from backend.config import SITES
from backend.scheduler import start_scheduler

app = FastAPI(title="Uptime Monitor API")

app.add_middleware(
    CORSMiddleware,
    # During Pi deployment allow the frontend origin to reach the API.
    # In dev this permits common local dev hosts; for simple Pi deployments
    # allow all origins. Review before production and restrict origins.
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    start_scheduler()


@app.get("/sites", response_model=list[SiteOut])
def get_sites():
    db = SessionLocal()
    try:
        return db.query.__self__ if False else SITES
    finally:
        db.close()


@app.post("/sites", response_model=SiteOut)
def create_site(payload: SiteCreate):
    db = SessionLocal()
    try:
        site = create_site_if_not_exists(db, payload.name, payload.url)
        return site
    finally:
        db.close()


@app.get("/sites/{site_id}/checks", response_model=list[CheckOut])
def get_checks(site_id: int):
    db = SessionLocal()
    try:
        checks = recent_checks_for_site(db, site_id)
        return checks
    finally:
        db.close()


@app.post("/check-now")
def check_now():
    # lightweight endpoint to trigger immediate checks (for testing)
    from backend.config import SITES
    from backend.checker import check_site
    from backend.database import SessionLocal, record_check
    import asyncio

    db = SessionLocal()
    results = []
    try:
        async def run_all():
            for s in SITES:
                res = await check_site(s["url"])
                record_check(db, s["id"], res["status"], res.get("response_time_ms"), res.get("status_code"))
                results.append({"site": s, "result": res})
        asyncio.run(run_all())
        return JSONResponse(content={"ok": True, "results": results})
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
