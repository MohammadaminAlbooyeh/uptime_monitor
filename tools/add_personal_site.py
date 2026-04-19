#!/usr/bin/env python3
from backend.database import SessionLocal, init_db, create_site_if_not_exists

def main():
    init_db()
    db = SessionLocal()
    try:
        site = create_site_if_not_exists(db,
                                         name="Amin Showcase",
                                         url="http://showcase-website-amin.s3-website.eu-north-1.amazonaws.com/")
        print(f"Ensured site present: id={site.id} name={site.name} url={site.url}")
    finally:
        db.close()

if __name__ == '__main__':
    main()
