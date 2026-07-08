import os
import sys
import random
from faker import Faker

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.organization import Department, Project, Employee
from app.models.workspace import Building, Floor, Seat

fake = Faker()

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(User).count() > 0:
        print("Database already seeded.")
        return

    print("Seeding database...")
    
    # 1. Admin
    admin = User(
        name="Admin User",
        email="admin@seatflow.ai",
        password_hash=get_password_hash("admin123"),
        role="Admin"
    )
    db.add(admin)
    db.commit()
    
    # 2. Departments
    depts = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Product", "Operations"]
    db_depts = []
    for d_name in depts:
        d = Department(name=d_name)
        db.add(d)
        db_depts.append(d)
    db.commit()
    
    # 3. Projects
    projects = ["Alpha", "Beta", "Gamma", "Delta", "Apollo", "Zeus", "Athena"]
    db_projects = []
    for p_name in projects:
        p = Project(name=f"Project {p_name}", status="Active")
        db.add(p)
        db_projects.append(p)
    db.commit()
    
    # 4. Workspace
    print("Generating workspace...")
    b = Building(name="HQ", location="123 SeatFlow Way")
    db.add(b)
    db.commit()
    
    db_seats = []
    for f_idx in range(1, 6):
        floor = Floor(building_id=b.id, floor_number=str(f_idx))
        db.add(floor)
        db.commit()
        
        for s_idx in range(1, 201):
            seat = Seat(
                floor_id=floor.id,
                seat_number=f"{f_idx}-{s_idx:03d}",
                zone=random.choice(["A", "B", "C", "D"])
            )
            db.add(seat)
            db_seats.append(seat)
    db.commit()
    
    # 5. Employees
    print("Generating employees...")
    for i in range(500):
        emp = Employee(
            employee_code=f"EMP{i:04d}",
            name=fake.name(),
            email=f"user{i}@{fake.domain_name()}",
            designation="Employee",
            department_id=random.choice(db_depts).id,
            project_id=random.choice(db_projects).id if random.random() > 0.3 else None
        )
        db.add(emp)
    db.commit()
    
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_db()
