from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.workspace import Seat, AllocationHistory, Floor
from app.models.organization import Employee
from app.schemas.workspace import SeatCreate, SeatUpdate, SeatResponse, AllocationRequest, ReleaseRequest

router = APIRouter()


# ── GET /seats  ───────────────────────────────────────────────────────────────
@router.get("/", response_model=List[SeatResponse])
def get_seats(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=2000),
    status: Optional[str] = None,
    floor_id: Optional[int] = None,
    zone: Optional[str] = None,
    floor_number: Optional[str] = None,
) -> Any:
    query = db.query(Seat)
    if status:
        query = query.filter(Seat.status == status)
    if floor_id:
        query = query.filter(Seat.floor_id == floor_id)
    if zone:
        query = query.filter(Seat.zone == zone)
    if floor_number:
        query = query.join(Seat.floor).filter(Floor.floor_number == floor_number)
    seats = query.offset(skip).limit(limit).all()
    return seats


# ── GET /seats/available  ─────────────────────────────────────────────────────
@router.get("/available", response_model=List[SeatResponse])
def get_available_seats(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    floor_id: Optional[int] = None,
    zone: Optional[str] = None,
) -> Any:
    """Return only Available seats."""
    query = db.query(Seat).filter(Seat.status == "Available")
    if floor_id:
        query = query.filter(Seat.floor_id == floor_id)
    if zone:
        query = query.filter(Seat.zone == zone)
    seats = query.offset(skip).limit(limit).all()
    return seats


# ── POST /seats  ─────────────────────────────────────────────────────────────
@router.post("/", response_model=SeatResponse)
def create_seat(
    seat_in: SeatCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    # Seat number must be unique within the same floor/zone
    existing = db.query(Seat).filter(
        Seat.seat_number == seat_in.seat_number,
        Seat.floor_id == seat_in.floor_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Seat number already exists on this floor")
    db_obj = Seat(**seat_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


# ── POST /seats/allocate  ─────────────────────────────────────────────────────
@router.post("/allocate", response_model=SeatResponse)
def allocate_seat(
    allocation_in: AllocationRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """
    Flat allocation endpoint — body: {employee_id, seat_id}.
    Business rules:
      - One employee can only have one active seat.
      - Reserved seats cannot be allocated.
      - One seat can only have one active employee.
    """
    seat = db.query(Seat).filter(Seat.id == allocation_in.seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    if seat.status == "Reserved":
        raise HTTPException(status_code=400, detail="Reserved seats cannot be allocated")
    if seat.status == "Occupied":
        raise HTTPException(status_code=400, detail="Seat is already occupied")

    employee = db.query(Employee).filter(Employee.id == allocation_in.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Release old seat if employee already has one
    if employee.seat_id:
        old_seat = db.query(Seat).filter(Seat.id == employee.seat_id).first()
        if old_seat:
            old_seat.status = "Available"
            db.add(old_seat)

    seat.status = "Occupied"
    employee.seat_id = seat.id

    # Update status if pending
    if employee.status == "PendingAllocation":
        employee.status = "Active"

    history = AllocationHistory(
        employee_id=employee.id,
        seat_id=seat.id,
        remarks=allocation_in.remarks or "Allocated via /seats/allocate",
    )
    db.add(history)
    db.add(seat)
    db.add(employee)
    db.commit()
    db.refresh(seat)
    return seat


# ── POST /seats/release  ─────────────────────────────────────────────────────
@router.post("/release", response_model=SeatResponse)
def release_seat_flat(
    release_in: ReleaseRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Flat release endpoint — body: {seat_id}. Released seats become Available."""
    seat = db.query(Seat).filter(Seat.id == release_in.seat_id).first()
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


# ── Legacy seat-ID-based endpoints (kept as aliases) ─────────────────────────
@router.post("/{id}/allocate", response_model=SeatResponse)
def allocate_seat_by_id(
    id: int,
    allocation_in: AllocationRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Alias: allocate a specific seat by URL id."""
    allocation_in.seat_id = id
    return allocate_seat(allocation_in, db)


@router.post("/{id}/release", response_model=SeatResponse)
def release_seat_by_id(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    """Alias: release a specific seat by URL id."""
    release_in = ReleaseRequest(seat_id=id)
    return release_seat_flat(release_in, db)


@router.get("/{id}", response_model=SeatResponse)
def get_seat(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    seat = db.query(Seat).filter(Seat.id == id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")
    return seat


@router.put("/{id}", response_model=SeatResponse)
def update_seat(
    id: int,
    seat_in: SeatUpdate,
    db: Session = Depends(deps.get_db),
) -> Any:
    seat = db.query(Seat).filter(Seat.id == id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Seat not found")

    update_data = seat_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(seat, field, value)
    db.add(seat)
    db.commit()
    db.refresh(seat)
    return seat
