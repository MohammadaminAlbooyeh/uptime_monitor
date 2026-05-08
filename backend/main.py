import os
import sys
import asyncio
import json
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db, SessionLocal, list_sites, create_site_if_not_exists, record_check, recent_checks_for_site, delete_site
from backend.schemas import SiteCreate, SiteOut, CheckOut, DeleteResponse
from backend.config import SITES
from backend.scheduler import start_scheduler

app = FastAPI(title="Uptime Monitor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ws_clients: set[WebSocket] = set()


async def broadcast_check(site_id: int, check_data: dict):
    msg = json.dumps({"type": "check", "site_id": site_id, "check": check_data})
    dead = set()
    for ws in ws_clients:
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    ws_clients -= dead


@app.on_event("startup")
def startup_event():
    init_db()
    start_scheduler()


@app.get("/sites", response_model=list[SiteOut])
def get_sites():
    db = SessionLocal()
    try:
        return list_sites(db)
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


@app.delete("/sites/{site_id}", response_model=DeleteResponse)
def remove_site(site_id: int):
    db = SessionLocal()
    try:
        site = delete_site(db, site_id)
        if not site:
            raise HTTPException(404, "Site not found")
        return DeleteResponse(ok=True)
    finally:
        db.close()


@app.get("/sites/{site_id}/checks", response_model=list[CheckOut])
def get_checks(site_id: int, hours: Optional[int] = Query(None)):
    db = SessionLocal()
    try:
        checks = recent_checks_for_site(db, site_id, hours=hours)
        return checks
    finally:
        db.close()


@app.post("/check-now")
def check_now():
    from backend.checker import check_site
    from backend.database import SessionLocal, record_check, list_sites

    db = SessionLocal()
    results = []
    try:
        db_sites = list_sites(db)

        async def run_all():
            for s in db_sites:
                res = await check_site(s.url)
                check = record_check(db, s.id, res["status"], res.get("response_time_ms"), res.get("status_code"))
                check_data = {
                    "id": check.id,
                    "site_id": check.site_id,
                    "timestamp": check.timestamp.isoformat(),
                    "status": check.status,
                    "response_time_ms": check.response_time_ms,
                    "status_code": check.status_code,
                }
                await broadcast_check(s.id, check_data)
                results.append({"site": {"id": s.id, "name": s.name, "url": s.url}, "result": res})

        asyncio.run(run_all())
        return JSONResponse(content={"ok": True, "results": results})
    finally:
        db.close()


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    ws_clients.add(ws)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_clients.discard(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
