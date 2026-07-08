from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.workspace import Seat, AllocationHistory
from app.models.organization import Employee
from app.schemas.workspace import SeatResponse

router = APIRouter()

@router.post("/auto-allocate/{employee_id}", response_model=SeatResponse)
def auto_allocate_seat(
    employee_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
) -> Any:
    # Get employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if employee.seat_id:
        raise HTTPException(status_code=400, detail="Employee already has a seat")
        
    # Phase 7 Algorithm rules:
    # 1. Same Project. 2. Same Department. 3. First Available.
    
    available_seats = db.query(Seat).filter(Seat.status == "Available").all()
    if not available_seats:
        raise HTTPException(status_code=400, detail="No available seats")
        
    best_seat = None
    
    # 1. Try Same Project
    if employee.project_id:
        project_colleagues = db.query(Employee).filter(Employee.project_id == employee.project_id, Employee.seat_id.isnot(None)).all()
        project_floors = {c.seat.floor_id for c in project_colleagues if c.seat}
        for seat in available_seats:
            if seat.floor_id in project_floors:
                best_seat = seat
                break
                
    # 2. Try Same Department
    if not best_seat and employee.department_id:
        dept_colleagues = db.query(Employee).filter(Employee.department_id == employee.department_id, Employee.seat_id.isnot(None)).all()
        dept_floors = {c.seat.floor_id for c in dept_colleagues if c.seat}
        for seat in available_seats:
            if seat.floor_id in dept_floors:
                best_seat = seat
                break
                
    # 3. First Available
    if not best_seat:
        best_seat = available_seats[0]
        
    # Allocate seat
    best_seat.status = "Occupied"
    employee.seat_id = best_seat.id
    
    history = AllocationHistory(
        employee_id=employee.id,
        seat_id=best_seat.id,
        allocated_by=current_user.id,
        remarks="Auto Allocated"
    )
    db.add(history)
    db.add(best_seat)
    db.add(employee)
    db.commit()
    db.refresh(best_seat)
    
    return best_seat
