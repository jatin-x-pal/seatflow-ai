from typing import Any, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.api import deps
from app.models.organization import Employee, Project, Department
from app.models.workspace import Seat, Building, Floor

router = APIRouter()

@router.get("/")
def global_search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    employees = db.query(Employee).filter(
        or_(Employee.name.ilike(f"%{q}%"), Employee.email.ilike(f"%{q}%"))
    ).limit(5).all()
    
    projects = db.query(Project).filter(Project.name.ilike(f"%{q}%")).limit(5).all()
    
    departments = db.query(Department).filter(Department.name.ilike(f"%{q}%")).limit(5).all()
    
    return {
        "employees": [{"id": e.id, "name": e.name, "type": "Employee"} for e in employees],
        "projects": [{"id": p.id, "name": p.name, "type": "Project"} for p in projects],
        "departments": [{"id": d.id, "name": d.name, "type": "Department"} for d in departments]
    }
