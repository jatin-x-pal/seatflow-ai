from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.employee import EmployeeResponse


class SeatBase(BaseModel):
    floor_id: int
    seat_number: str
    zone: Optional[str] = None
    seat_type: Optional[str] = None
    status: Optional[str] = "Available"


class SeatCreate(SeatBase):
    pass


class SeatUpdate(BaseModel):
    seat_number: Optional[str] = None
    zone: Optional[str] = None
    seat_type: Optional[str] = None
    status: Optional[str] = None


class FloorInfo(BaseModel):
    id: int
    floor_number: str

    class Config:
        from_attributes = True


class SeatResponse(SeatBase):
    id: int
    employee: Optional[EmployeeResponse] = None
    floor: Optional[FloorInfo] = None

    class Config:
        from_attributes = True


class AllocationRequest(BaseModel):
    employee_id: int
    seat_id: Optional[int] = None  # optional — used in flat /allocate endpoint
    remarks: Optional[str] = None


class ReleaseRequest(BaseModel):
    seat_id: int
