from apscheduler.schedulers.background import BackgroundScheduler
from .database import SessionLocal, init_db, list_sites, create_site_if_not_exists, record_check
from .checker import check_site
from .config import SITES, CHECK_INTERVAL_SECONDS
import asyncio

scheduler = BackgroundScheduler()


def _run_check_sync(site):
    # helper for running single sync check inside scheduler
    import asyncio
    from .checker import check_site
    from .database import SessionLocal, record_check
    db = SessionLocal()
    try:
        res = asyncio.run(check_site(site["url"]))
        record_check(db, site["id"], res["status"], res.get("response_time_ms"), res.get("status_code"))
    finally:
        db.close()


def start_scheduler():
    init_db()
    # ensure sites present
    db = SessionLocal()
    for s in SITES:
        create_site_if_not_exists(db, s.get("name"), s.get("url"))
    db.close()

    scheduler.add_job(lambda: _check_all(), 'interval', seconds=CHECK_INTERVAL_SECONDS, id='uptime-check-all')
    scheduler.start()


def _check_all():
    # run checks for all sites present in the database (uses actual DB ids)
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
