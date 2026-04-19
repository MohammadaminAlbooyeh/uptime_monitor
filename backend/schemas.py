from pydantic import BaseModel
from typing import Optional
import datetime

class SiteCreate(BaseModel):
    name: str
    url: str

class SiteOut(BaseModel):
    id: int
    name: str
    url: str

    class Config:
        orm_mode = True

class CheckOut(BaseModel):
    id: int
    site_id: int
    timestamp: datetime.datetime
    status: str
    response_time_ms: Optional[float]
    status_code: Optional[int]

    class Config:
        orm_mode = True
