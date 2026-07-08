from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.organization import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse

router = APIRouter()

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    project_id: Optional[int] = None
) -> Any:
    query = db.query(Employee)
    if search:
        query = query.filter(Employee.name.ilike(f"%{search}%") | Employee.employee_code.ilike(f"%{search}%"))
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if project_id:
        query = query.filter(Employee.project_id == project_id)
    
    employees = query.offset(skip).limit(limit).all()
    return employees

@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(deps.get_db)
) -> Any:
    # Bypass auth for MVP
    # if current_user.role not in ["Admin", "HR"]:
    #     raise HTTPException(status_code=403, detail="Not enough permissions")
        
    employee = db.query(Employee).filter(Employee.email == employee_in.email).first()
    if employee:
        raise HTTPException(status_code=400, detail="Employee with this email already exists.")
    
    db_obj = Employee(**employee_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/{id}", response_model=EmployeeResponse)
def get_employee(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{id}", response_model=EmployeeResponse)
def update_employee(
    id: int,
    employee_in: EmployeeUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
) -> Any:
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
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
    current_user = Depends(deps.get_current_user)
) -> Any:
    if current_user.role not in ["Admin", "HR"]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    employee = db.query(Employee).filter(Employee.id == id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(employee)
    db.commit()
    return {"ok": True}
