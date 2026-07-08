from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.organization import Employee, Project
from app.models.workspace import Seat, Floor
import openai
from app.core.config import settings

router = APIRouter()


class AIQueryRequest(BaseModel):
    query: str
    employee_id: Optional[int] = None  # for personalized queries


class AIQueryResponse(BaseModel):
    response: str
    context_used: bool = False


def build_db_context(db: Session) -> str:
    """Pull live stats from the DB to inject into the AI system prompt."""
    total_employees = db.query(Employee).count()
    total_seats = db.query(Seat).count()
    occupied = db.query(Seat).filter(Seat.status == "Occupied").count()
    available = db.query(Seat).filter(Seat.status == "Available").count()
    reserved = db.query(Seat).filter(Seat.status == "Reserved").count()
    pending = db.query(Employee).filter(Employee.status == "PendingAllocation").count()

    # Project summaries
    proj_rows = (
        db.query(Project.name, func.count(Employee.id).label("cnt"))
        .outerjoin(Employee, Employee.project_id == Project.id)
        .group_by(Project.id, Project.name)
        .all()
    )
    proj_lines = "\n".join(f"  - {r.name}: {r.cnt} members" for r in proj_rows)

    # Floor summaries — use simple counts for SQLite compatibility
    floor_list = db.query(Floor).order_by(Floor.floor_number).all()
    floor_lines = "\n".join(
        f"  - Floor {floor.floor_number}: "
        f"{db.query(Seat).filter(Seat.floor_id == floor.id, Seat.status == 'Occupied').count()}"
        f"/{db.query(Seat).filter(Seat.floor_id == floor.id).count()} seats occupied"
        for floor in floor_list
    )

    return f"""
LIVE WORKSPACE DATA (as of right now):
- Total Employees: {total_employees}
- Total Seats: {total_seats}
- Occupied Seats: {occupied}
- Available Seats: {available}
- Reserved Seats: {reserved}
- New Joiners Pending Allocation: {pending}

Projects & Member Counts:
{proj_lines}

Floor-wise Occupancy:
{floor_lines}
"""


def find_employee_context(query: str, db: Session) -> str:
    """Try to find specific employee or entity mentioned in the query."""
    extra = ""
    words = query.split()

    # Look for employee names
    for word in words:
        if len(word) > 3:
            emp = db.query(Employee).filter(Employee.name.ilike(f"%{word}%")).first()
            if emp:
                seat_info = "No seat assigned"
                floor_info = "N/A"
                zone_info = "N/A"
                if emp.seat_id and emp.seat:
                    seat_info = f"Seat #{emp.seat.seat_number}"
                    if emp.seat.floor:
                        floor_info = f"Floor {emp.seat.floor.floor_number}"
                    zone_info = emp.seat.zone or "N/A"
                project_name = emp.project.name if emp.project else "Unassigned"
                extra += f"""
Specific Employee Found: {emp.name} (Code: {emp.employee_code})
  - Email: {emp.email}
  - Project: {project_name}
  - Seat: {seat_info}
  - Floor: {floor_info}
  - Zone: {zone_info}
  - Status: {emp.status}
"""
                break

    # Check if query mentions a floor number
    for word in words:
        if word.isdigit():
            floor = db.query(Floor).filter(Floor.floor_number == word).first()
            if floor:
                avail_count = db.query(Seat).filter(
                    Seat.floor_id == floor.id, Seat.status == "Available"
                ).count()
                extra += f"\nFloor {word} has {avail_count} available seats."

    # Check if query mentions a project name
    for proj in db.query(Project).all():
        if proj.name.lower() in query.lower():
            occupied_count = (
                db.query(Seat)
                .join(Employee, Employee.seat_id == Seat.id)
                .filter(Employee.project_id == proj.id)
                .count()
            )
            total_members = db.query(Employee).filter(Employee.project_id == proj.id).count()
            extra += f"\n{proj.name}: {total_members} members, {occupied_count} seats occupied."

    return extra


@router.post("/query", response_model=AIQueryResponse)
def ask_ai(
    request: AIQueryRequest,
    db: Session = Depends(deps.get_db),
) -> Any:
    # Build live context
    db_context = build_db_context(db)
    specific_context = find_employee_context(request.query, db)

    system_prompt = f"""You are SeatFlow AI, an intelligent enterprise workspace management assistant.
You have access to LIVE, REAL-TIME data about the organization's seat allocations, employees, and projects.

{db_context}
{specific_context}

Guidelines:
- Answer queries about seat locations, project assignments, availability, and occupancy using the data above.
- For questions like "Where is my seat?" explain that personal identity isn't established via the chat, so the user should check their profile or contact HR.
- For "Who is sitting near me?" suggest checking adjacent seat numbers on the same floor.
- Be concise, helpful, and data-driven.
- If allocating a seat, explain it should be done via the Seats management page or the /seats/allocate API.
- If data is insufficient for a specific query, say so honestly.
"""

    if not settings.OPENAI_API_KEY:
        mock = f"[Mock Mode - No API Key] Based on live data: {db_context.strip()[:400]}..."
        return {"response": mock, "context_used": True}

    try:
        if settings.OPENAI_API_KEY.startswith("gsk_"):
            client = openai.OpenAI(
                api_key=settings.OPENAI_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            model_name = "llama-3.1-8b-instant"
        else:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            model_name = "gpt-4o-mini"

        completion = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.query},
            ],
            max_tokens=400,
            temperature=0.3,
        )

        return {
            "response": completion.choices[0].message.content,
            "context_used": True,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
