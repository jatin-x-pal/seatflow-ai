from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Building(Base):
    __tablename__ = "buildings"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    location = Column(String, nullable=True)
    
    floors = relationship("Floor", back_populates="building")

class Floor(Base):
    __tablename__ = "floors"
    id = Column(Integer, primary_key=True, index=True)
    building_id = Column(Integer, ForeignKey("buildings.id"))
    floor_number = Column(String, index=True)
    
    building = relationship("Building", back_populates="floors")
    seats = relationship("Seat", back_populates="floor")

class Seat(Base):
    __tablename__ = "seats"
    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"))
    seat_number = Column(String, index=True, unique=True)
    zone = Column(String, nullable=True)
    seat_type = Column(String, nullable=True)
    status = Column(String, default="Available") # Available, Occupied, Reserved, Maintenance
    
    # We map employee_id inside Employee (seat_id), but bi-directional mapping here
    employee = relationship("Employee", back_populates="seat", uselist=False)
    floor = relationship("Floor", back_populates="seats")
    allocations = relationship("AllocationHistory", back_populates="seat")

class AllocationHistory(Base):
    __tablename__ = "allocation_history"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    seat_id = Column(Integer, ForeignKey("seats.id"))
    allocated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    allocated_at = Column(DateTime(timezone=True), server_default=func.now())
    released_at = Column(DateTime(timezone=True), nullable=True)
    remarks = Column(String, nullable=True)

    employee = relationship("Employee", back_populates="allocations")
    seat = relationship("Seat", back_populates="allocations")
    allocator = relationship("User")
