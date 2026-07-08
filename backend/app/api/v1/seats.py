from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.workspace import Seat, AllocationHistory
from app.models.organization import Employee
from app.schemas.workspace import SeatCreate, SeatUpdate, SeatResponse, AllocationRequest

router = APIRouter()

@router.get("/", response_model=List[SeatResponse])
def get_seats(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    status: Optional[str] = None,
    floor_id: Optional[int] = None
) -> Any:
    query = db.query(Seat)
    if status:
        query = query.filter(Seat.status == status)
    if floor_id:
        query = query.filter(Seat.floor_id == floor_id)
    seats = query.offset(skip).limit(limit).all()
    return seats

@router.post("/", response_model=SeatResponse)
def create_seat(
    seat_in: SeatCreate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
) -> Any:
    seat = db.query(Seat).filter(Seat.seat_number == seat_in.seat_number).first()
    if seat:
        raise HTTPException(status_code=400, detail="Seat number already exists")
    db_obj = Seat(**seat_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/{id}/allocate", response_model=SeatResponse)
def allocate_seat(
    id: int,
    allocation_in: AllocationRequest,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
) -> Any:
    # Business Rules
    seat = db.query(Seat).filter(Seat.id == id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    if seat.status == "Occupied":
        raise HTTPException(status_code=400, detail="Seat is already occupied")
        
    employee = db.query(Employee).filter(Employee.id == allocation_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    if employee.seat_id:
        # Free old seat
        old_seat = db.query(Seat).filter(Seat.id == employee.seat_id).first()
        if old_seat:
            old_seat.status = "Available"
            
    # Allocate new
    seat.status = "Occupied"
    employee.seat_id = seat.id
    
    # Save History
    history = AllocationHistory(
        employee_id=employee.id,
        seat_id=seat.id,
        allocated_by=current_user.id,
        remarks=allocation_in.remarks
    )
    db.add(history)
    db.add(seat)
    db.add(employee)
    db.commit()
    db.refresh(seat)
    return seat

@router.post("/{id}/release", response_model=SeatResponse)
def release_seat(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin)
) -> Any:
    seat = db.query(Seat).filter(Seat.id == id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
        
    if seat.status != "Occupied":
        raise HTTPException(status_code=400, detail="Seat is not occupied")
        
    employee = db.query(Employee).filter(Employee.seat_id == seat.id).first()
    if employee:
        employee.seat_id = None
        db.add(employee)
        
    seat.status = "Available"
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return seat
