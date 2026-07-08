from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.employee import EmployeeResponse

class ProjectBase(BaseModel):
    name: str
    client: Optional[str] = None
    manager: Optional[str] = None
    technology: Optional[str] = None
    status: Optional[str] = "Active"

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    client: Optional[str] = None
    manager: Optional[str] = None
    technology: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
        
class ProjectWithMembersResponse(ProjectResponse):
    employees: List[EmployeeResponse] = []
    
    class Config:
        from_attributes = True
