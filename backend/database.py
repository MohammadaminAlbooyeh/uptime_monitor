from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base, Site, Check
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./uptime.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_site_if_not_exists(db, name, url):
    existing = db.query(Site).filter(Site.url == url).first()
    if existing:
        return existing
    site = Site(name=name, url=url)
    db.add(site)
    db.commit()
    db.refresh(site)
    return site


def record_check(db, site_id, status, response_time_ms=None, status_code=None):
    check = Check(site_id=site_id, status=status, response_time_ms=response_time_ms, status_code=status_code)
    db.add(check)
    db.commit()
    db.refresh(check)
    return check


def list_sites(db):
    return db.query(Site).all()


def recent_checks_for_site(db, site_id, limit=50):
    return db.query(Check).filter(Check.site_id == site_id).order_by(Check.timestamp.desc()).limit(limit).all()
