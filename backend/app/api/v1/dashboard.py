from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.api import deps
from app.models.organization import Employee, Project
from app.models.workspace import Seat, Floor

router = APIRouter()


@router.get("/summary")
@router.get("/metrics")  # alias kept for backward compat
def get_dashboard_summary(
    db: Session = Depends(deps.get_db),
) -> Any:
    """All required dashboard metrics."""
    total_employees = db.query(Employee).count()
    total_seats = db.query(Seat).count()
    occupied_seats = db.query(Seat).filter(Seat.status == "Occupied").count()
    available_seats = db.query(Seat).filter(Seat.status == "Available").count()
    reserved_seats = db.query(Seat).filter(Seat.status == "Reserved").count()
    new_joiners_pending = db.query(Employee).filter(Employee.status == "PendingAllocation").count()
    total_projects = db.query(Project).count()

    seat_utilization = round(
        (occupied_seats / total_seats * 100) if total_seats > 0 else 0, 2
    )

    return {
        "total_employees": total_employees,
        "total_seats": total_seats,
        "occupied_seats": occupied_seats,
        "available_seats": available_seats,
        "reserved_seats": reserved_seats,
        "new_joiners_pending_allocation": new_joiners_pending,
        "total_projects": total_projects,
        "seat_utilization_pct": seat_utilization,
        # Legacy nested format for backward compat
        "widgets": {
            "total_employees": total_employees,
            "total_seats": total_seats,
            "occupied_seats": occupied_seats,
            "available_seats": available_seats,
            "reserved_seats": reserved_seats,
            "new_joiners_pending_allocation": new_joiners_pending,
            "total_projects": total_projects,
            "seat_utilization_pct": seat_utilization,
        },
    }


@router.get("/project-utilization")
def get_project_utilization(
    db: Session = Depends(deps.get_db),
) -> Any:
    """Project-wise seat allocation — how many employees in each project have seats."""
    result = (
        db.query(
            Project.id,
            Project.name,
            func.count(Employee.id).label("total_members"),
            func.count(Employee.seat_id).label("seated_members"),
        )
        .outerjoin(Employee, Employee.project_id == Project.id)
        .group_by(Project.id, Project.name)
        .all()
    )

    return [
        {
            "project_id": row.id,
            "project_name": row.name,
            "total_members": row.total_members,
            "seated_members": row.seated_members,
            "unseated_members": row.total_members - row.seated_members,
        }
        for row in result
    ]


@router.get("/floor-utilization")
def get_floor_utilization(
    db: Session = Depends(deps.get_db),
) -> Any:
    """Floor-wise seat occupancy — uses per-floor count queries for SQLite compatibility."""
    floors = db.query(Floor).order_by(Floor.floor_number).all()
    result = []
    for floor in floors:
        total = db.query(Seat).filter(Seat.floor_id == floor.id).count()
        occupied = db.query(Seat).filter(Seat.floor_id == floor.id, Seat.status == "Occupied").count()
        available = db.query(Seat).filter(Seat.floor_id == floor.id, Seat.status == "Available").count()
        reserved = db.query(Seat).filter(Seat.floor_id == floor.id, Seat.status == "Reserved").count()
        result.append({
            "floor_id": floor.id,
            "floor_number": floor.floor_number,
            "total_seats": total,
            "occupied": occupied,
            "available": available,
            "reserved": reserved,
            "utilization_pct": round((occupied / total * 100) if total > 0 else 0, 2),
        })
    return result
