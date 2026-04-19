from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class Site(Base):
    __tablename__ = "sites"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False, unique=True)

    checks = relationship("Check", back_populates="site")

class Check(Base):
    __tablename__ = "checks"
    id = Column(Integer, primary_key=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, nullable=False)  # OK / FAIL
    response_time_ms = Column(Float, nullable=True)
    status_code = Column(Integer, nullable=True)

    site = relationship("Site", back_populates="checks")
