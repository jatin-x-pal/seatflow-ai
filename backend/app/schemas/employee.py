from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime

class EmployeeBase(BaseModel):
    employee_code: str
    name: str
    email: EmailStr
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    project_id: Optional[int] = None
    seat_id: Optional[int] = None
    joining_date: Optional[date] = None
    status: Optional[str] = "Active"

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    designation: Optional[str] = None
    project_id: Optional[int] = None
    seat_id: Optional[int] = None
    status: Optional[str] = None

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
