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

class SeatResponse(SeatBase):
    id: int
    employee: Optional[EmployeeResponse] = None

    class Config:
        from_attributes = True

class AllocationRequest(BaseModel):
    employee_id: int
    remarks: Optional[str] = None
