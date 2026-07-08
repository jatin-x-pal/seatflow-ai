from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.organization import Employee, Department, Project
from app.models.workspace import Seat, Building

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics(
    db: Session = Depends(deps.get_db)
) -> Any:
    total_employees = db.query(Employee).count()
    total_seats = db.query(Seat).count()
    occupied_seats = db.query(Seat).filter(Seat.status == "Occupied").count()
    available_seats = db.query(Seat).filter(Seat.status == "Available").count()
    reserved_seats = db.query(Seat).filter(Seat.status == "Reserved").count()
    total_projects = db.query(Project).count()
    total_departments = db.query(Department).count()
    
    seat_utilization = round((occupied_seats / total_seats * 100) if total_seats > 0 else 0, 2)
    
    # Department Distribution
    dept_distribution = db.query(
        Department.name, func.count(Employee.id).label('count')
    ).outerjoin(Employee).group_by(Department.name).all()
    
    # Project Distribution
    proj_distribution = db.query(
        Project.name, func.count(Employee.id).label('count')
    ).outerjoin(Employee).group_by(Project.name).all()

    return {
        "widgets": {
            "total_employees": total_employees,
            "total_seats": total_seats,
            "occupied_seats": occupied_seats,
            "available_seats": available_seats,
            "reserved_seats": reserved_seats,
            "total_projects": total_projects,
            "total_departments": total_departments,
            "seat_utilization_pct": seat_utilization
        },
        "charts": {
            "department_distribution": [{"name": d.name, "value": d.count} for d in dept_distribution],
            "project_distribution": [{"name": p.name, "value": p.count} for p in proj_distribution]
        }
    }
