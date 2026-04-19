import httpx
import time
from typing import Dict

async def check_site(url: str, timeout: float = 10.0) -> Dict:
    """Perform an HTTP GET and return a dict with status and timing."""
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        start = time.perf_counter()
        try:
            resp = await client.get(url)
            elapsed = (time.perf_counter() - start) * 1000.0
            status = "OK" if resp.status_code < 400 else "FAIL"
            return {
                "status": status,
                "status_code": resp.status_code,
                "response_time_ms": elapsed,
            }
        except Exception as e:
            return {"status": "FAIL", "status_code": None, "response_time_ms": None}


async def check_sites_and_record(db, sites, record_fn, notify_fn=None):
    """Given a list of site dicts and a record function, run checks and persist results."""
    results = []
    for s in sites:
        res = await check_site(s["url"]) if s.get("url") else {"status":"FAIL"}
        record_fn(db, s["id"], res["status"], res.get("response_time_ms"), res.get("status_code"))
        if notify_fn and res["status"] == "FAIL":
            notify_fn(s, res)
        results.append((s, res))
    return results
