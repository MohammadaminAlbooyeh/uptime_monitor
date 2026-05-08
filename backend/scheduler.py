from apscheduler.schedulers.background import BackgroundScheduler
from .database import SessionLocal, init_db, list_sites, create_site_if_not_exists, record_check
from .checker import check_site
from .config import SITES, CHECK_INTERVAL_SECONDS
import asyncio

scheduler = BackgroundScheduler()


def _run_check_sync(site):
    import asyncio
    from .checker import check_site
    from .database import SessionLocal, record_check
    from .main import broadcast_check

    db = SessionLocal()
    try:
        res = asyncio.run(check_site(site["url"]))
        check = record_check(db, site["id"], res["status"], res.get("response_time_ms"), res.get("status_code"))
        check_data = {
            "id": check.id,
            "site_id": check.site_id,
            "timestamp": check.timestamp.isoformat(),
            "status": check.status,
            "response_time_ms": check.response_time_ms,
            "status_code": check.status_code,
        }
        asyncio.run(broadcast_check(site["id"], check_data))
    finally:
        db.close()


def start_scheduler():
    init_db()
    db = SessionLocal()
    for s in SITES:
        create_site_if_not_exists(db, s.get("name"), s.get("url"))
    db.close()

    scheduler.add_job(lambda: _check_all(), 'interval', seconds=CHECK_INTERVAL_SECONDS, id='uptime-check-all')
    scheduler.start()


def _check_all():
    db = SessionLocal()
    try:
        from backend.database import list_sites
        db_sites = list_sites(db)
        sites = [{"id": s.id, "name": s.name, "url": s.url} for s in db_sites]
        for s in sites:
            _run_check_sync(s)
    finally:
        db.close()


def stop_scheduler():
    scheduler.shutdown()
