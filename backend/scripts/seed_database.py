import os
import sys
import random
from faker import Faker
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.organization import Department, Project, Employee
from app.models.workspace import Building, Floor, Seat, AllocationHistory

fake = Faker()

# Assessment-required counts
NUM_EMPLOYEES = 5000
NUM_FLOORS = 5
ZONES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]  # 10 zones
SEATS_PER_FLOOR = 1100  # 5 * 1100 = 5500 total
NUM_PROJECTS = 10
RESERVED_SEATS = 100
PENDING_EMPLOYEES = 50

PROJECT_NAMES = [
    "Project Talos",
    "Project Apollo",
    "Project Athena",
    "Project Zeus",
    "Project Orion",
    "Project Hermes",
    "Project Ares",
    "Project Poseidon",
    "Project Hera",
    "Project Hephaestus",
]

DEPARTMENTS = [
    "Engineering", "Sales", "Marketing", "HR",
    "Finance", "Product", "Operations", "Design",
    "Legal", "Customer Success"
]

DESIGNATIONS = [
    "Software Engineer", "Senior Engineer", "Lead Engineer", "Principal Engineer",
    "Engineering Manager", "Product Manager", "Designer", "Business Analyst",
    "Sales Executive", "Marketing Specialist", "HR Manager", "Finance Analyst",
    "DevOps Engineer", "QA Engineer", "Data Scientist", "Tech Lead",
]


def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    if db.query(User).count() > 0:
        print("Database already seeded. Delete seatflow.db to re-seed.")
        return

    print("🚀 Seeding SeatFlow database (assessment-compliant)...")

    # ── 1. Admin user ─────────────────────────────────────────────────────────
    admin = User(
        name="Admin User",
        email="admin@seatflow.ai",
        password_hash=get_password_hash("admin123"),
        role="Admin",
        status="Active",
    )
    db.add(admin)
    db.commit()
    print("  ✓ Admin user created")

    # ── 2. Departments ────────────────────────────────────────────────────────
    db_depts = []
    for d_name in DEPARTMENTS:
        d = Department(name=d_name, description=f"{d_name} department")
        db.add(d)
        db_depts.append(d)
    db.commit()
    print(f"  ✓ {len(db_depts)} departments created")

    # ── 3. Projects (exactly 10, including "Project Talos") ───────────────────
    db_projects = []
    for p_name in PROJECT_NAMES:
        p = Project(
            name=p_name,
            client=fake.company(),
            manager=fake.name(),
            technology=random.choice([
                "Python/FastAPI", "React/Node.js", "Java/Spring", "Go/gRPC",
                "TypeScript/Next.js", "Rust/WebAssembly", "Kotlin/Android"
            ]),
            status="Active",
        )
        db.add(p)
        db_projects.append(p)
    db.commit()
    print(f"  ✓ {len(db_projects)} projects created (including Project Talos)")

    # ── 4. Workspace: Building → 5 Floors → 1100 seats each ──────────────────
    print("  ⟳ Generating workspace (5 floors × 1100 seats = 5500 total)...")
    building = Building(name="SeatFlow HQ", location="1 Technology Park, Innovation City")
    db.add(building)
    db.commit()

    db_floors = []
    all_seats = []

    for floor_num in range(1, NUM_FLOORS + 1):
        floor = Floor(building_id=building.id, floor_number=str(floor_num))
        db.add(floor)
        db.commit()
        db_floors.append(floor)

        batch = []
        for seat_idx in range(1, SEATS_PER_FLOOR + 1):
            zone = ZONES[(seat_idx - 1) % len(ZONES)]  # even distribution across 10 zones
            seat = Seat(
                floor_id=floor.id,
                seat_number=f"F{floor_num}-{seat_idx:04d}",
                zone=zone,
                seat_type=random.choice(["Standard", "Standing", "Cabin", "Hot Desk"]),
                status="Available",
            )
            batch.append(seat)
            all_seats.append(seat)

        db.add_all(batch)
        db.commit()
        print(f"    Floor {floor_num}: {SEATS_PER_FLOOR} seats created")

    print(f"  ✓ {len(all_seats)} seats created across {NUM_FLOORS} floors")

    # ── 5. Mark 100 seats as Reserved ─────────────────────────────────────────
    reserved_sample = random.sample(all_seats, RESERVED_SEATS)
    for seat in reserved_sample:
        seat.status = "Reserved"
    db.commit()
    print(f"  ✓ {RESERVED_SEATS} seats marked as Reserved")

    # Seats available for allocation (exclude reserved)
    available_seats_for_alloc = [s for s in all_seats if s.status == "Available"]

    # ── 6. Employees (5000) ───────────────────────────────────────────────────
    print("  ⟳ Generating 5,000 employees (this takes ~30 seconds)...")

    # We need:
    #   - 50 with status=PendingAllocation (no seat)
    #   - ~4450 with seats (leaves ~500 available seats)
    #   - remaining unallocated but Active

    seated_count = len(all_seats) - RESERVED_SEATS - 500  # = 5500 - 100 - 500 = 4900
    # Cap at 4950 to keep exactly ~500 available
    seated_count = min(seated_count, NUM_EMPLOYEES - PENDING_EMPLOYEES)

    seat_pool = available_seats_for_alloc[:seated_count]
    random.shuffle(seat_pool)

    BATCH_SIZE = 500
    seat_index = 0
    today = date.today()

    for i in range(NUM_EMPLOYEES):
        # Determine status
        if i < PENDING_EMPLOYEES:
            status = "PendingAllocation"
            joining_date = today  # joined today — new joiners
        else:
            status = "Active"
            joining_date = today - timedelta(days=random.randint(1, 1825))

        project = random.choice(db_projects) if random.random() > 0.1 else None
        dept = random.choice(db_depts)

        emp = Employee(
            employee_code=f"EMP{i+1:05d}",
            name=fake.name(),
            email=f"emp{i+1}_{fake.user_name()}@seatflow-corp.com",
            phone=fake.phone_number()[:15],
            department_id=dept.id,
            designation=random.choice(DESIGNATIONS),
            project_id=project.id if project else None,
            joining_date=joining_date,
            status=status,
        )
        db.add(emp)

        # Flush in batches and assign seats
        if (i + 1) % BATCH_SIZE == 0:
            db.flush()
            print(f"    ... {i+1}/{NUM_EMPLOYEES} employees flushed")

    db.commit()
    print("  ✓ 5,000 employees created")

    # ── 7. Assign seats to employees (project-aware placement) ─────────────────
    print("  ⟳ Assigning seats (project-aware near-team placement)...")

    # Build project → floor preference map
    proj_floor_map: dict[int, int] = {}
    for idx, proj in enumerate(db_projects):
        proj_floor_map[proj.id] = db_floors[idx % NUM_FLOORS].id

    # Get employees excluding pending
    employees_to_seat = (
        db.query(Employee)
        .filter(Employee.status == "Active")
        .limit(seated_count)
        .all()
    )

    # Build floor → available seat lists
    floor_seat_map: dict[int, list] = {f.id: [] for f in db_floors}
    for seat in seat_pool:
        floor_seat_map[seat.floor_id].append(seat)

    assigned = 0
    for emp in employees_to_seat:
        seat = None
        # Try project-preferred floor first
        if emp.project_id and emp.project_id in proj_floor_map:
            preferred_floor_id = proj_floor_map[emp.project_id]
            if floor_seat_map.get(preferred_floor_id):
                seat = floor_seat_map[preferred_floor_id].pop(0)
        # Fallback to any available floor
        if seat is None:
            for floor_id, seats in floor_seat_map.items():
                if seats:
                    seat = seats.pop(0)
                    break
        if seat:
            seat.status = "Occupied"
            emp.seat_id = seat.id
            assigned += 1

        if assigned % 500 == 0 and assigned > 0:
            db.flush()
            print(f"    ... {assigned}/{len(employees_to_seat)} seats assigned")

    db.commit()

    # ── 8. Final verification ─────────────────────────────────────────────────
    final_emp = db.query(Employee).count()
    final_seats = db.query(Seat).count()
    final_occupied = db.query(Seat).filter(Seat.status == "Occupied").count()
    final_available = db.query(Seat).filter(Seat.status == "Available").count()
    final_reserved = db.query(Seat).filter(Seat.status == "Reserved").count()
    final_pending = db.query(Employee).filter(Employee.status == "PendingAllocation").count()
    final_projects = db.query(Project).count()

    print("\n✅ Database seeded successfully!")
    print("=" * 45)
    print(f"  Employees:              {final_emp}")
    print(f"  Projects:               {final_projects}")
    print(f"  Total Seats:            {final_seats}")
    print(f"  Occupied Seats:         {final_occupied}")
    print(f"  Available Seats:        {final_available}")
    print(f"  Reserved Seats:         {final_reserved}")
    print(f"  Pending Allocation:     {final_pending}")
    print("=" * 45)
    db.close()


if __name__ == "__main__":
    seed_db()
