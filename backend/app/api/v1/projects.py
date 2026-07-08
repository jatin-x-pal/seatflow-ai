from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.api import deps
from app.models.organization import Project, Employee
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.schemas.employee import EmployeeResponse

router = APIRouter()


@router.get("/", response_model=List[ProjectResponse])
def get_projects(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    search: Optional[str] = None,
) -> Any:
    query = db.query(Project)
    if search:
        query = query.filter(
            Project.name.ilike(f"%{search}%") | Project.client.ilike(f"%{search}%")
        )
    projects = query.offset(skip).limit(limit).all()
    return projects


@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(deps.get_db),
) -> Any:
    db_obj = Project(**project_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


@router.get("/{id}", response_model=ProjectResponse)
def get_project(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{id}/employees", response_model=List[EmployeeResponse])
def get_project_employees(
    id: int,
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> Any:
    """Return all employees assigned to a project."""
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    employees = (
        db.query(Employee)
        .filter(Employee.project_id == id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return employees


@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(deps.get_db),
) -> Any:
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{id}")
def delete_project(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return {"ok": True, "message": "Project deleted"}


@router.post("/{id}/members/{employee_id}")
def assign_member(
    id: int,
    employee_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.project_id = project.id
    db.add(employee)
    db.commit()
    return {"message": "Member assigned successfully"}


@router.delete("/{id}/members/{employee_id}")
def remove_member(
    id: int,
    employee_id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    employee = db.query(Employee).filter(
        Employee.id == employee_id, Employee.project_id == id
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found in project")

    employee.project_id = None
    db.add(employee)
    db.commit()
    return {"message": "Member removed successfully"}
