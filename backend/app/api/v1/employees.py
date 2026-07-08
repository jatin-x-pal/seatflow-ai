from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.api import deps
from app.models.organization import Employee, Project
from app.models.workspace import Seat, Floor
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter()

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    employee_id: Optional[str] = None,
    email: Optional[str] = None,
    department_id: Optional[int] = None,
    project_id: Optional[int] = None,
    project_name: Optional[str] = None,
    floor_id: Optional[int] = None,
    zone: Optional[str] = None,
    seat_status: Optional[str] = None,
    status: Optional[str] = None,
) -> Any:
    query = db.query(Employee).options(
        joinedload(Employee.seat).joinedload(Seat.floor),
        joinedload(Employee.project),
        joinedload(Employee.department),
    )

    if search:
        query = query.filter(
            or_(
                Employee.name.ilike(f"%{search}%"),
                Employee.employee_code.ilike(f"%{search}%"),
                Employee.email.ilike(f"%{search}%"),
            )
        )
    if employee_id:
        query = query.filter(Employee.employee_code.ilike(f"%{employee_id}%"))
    if email:
        query = query.filter(Employee.email.ilike(f"%{email}%"))
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if project_id:
        query = query.filter(Employee.project_id == project_id)
    if project_name:
        query = query.join(Employee.project).filter(Project.name.ilike(f"%{project_name}%"))
    if floor_id or zone or seat_status:
        query = query.outerjoin(Employee.seat)
        if floor_id:
            query = query.filter(Seat.floor_id == floor_id)
        if zone:
            query = query.filter(Seat.zone == zone)
        if seat_status:
            query = query.filter(Seat.status == seat_status)
    if status:
        query = query.filter(Employee.status == status)

    employees = query.offset(skip).limit(limit).all()
    return employees


@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    existing = db.query(Employee).filter(Employee.email == employee_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee with this email already exists.")

    existing_code = db.query(Employee).filter(Employee.employee_code == employee_in.employee_code).first()
    if existing_code:
        raise HTTPException(status_code=400, detail="Employee code already exists.")

    db_obj = Employee(**employee_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    employee = db.query(Employee).options(
        joinedload(Employee.seat).joinedload(Seat.floor),
        joinedload(Employee.project),
        joinedload(Employee.department),
    ).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(deps.get_db),
) -> Any:
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = employee_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{id}")
def delete_employee(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Release seat if assigned
    if employee.seat_id:
        seat = db.query(Seat).filter(Seat.id == employee.seat_id).first()
        if seat:
            seat.status = "Available"
            db.add(seat)

    db.delete(employee)
    db.commit()
    return {"ok": True, "message": "Employee deleted successfully"}
