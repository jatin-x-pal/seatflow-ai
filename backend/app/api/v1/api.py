from fastapi import APIRouter
from app.api.v1 import auth
from app.api.v1 import employees
from app.api.v1 import projects
from app.api.v1 import seats
from app.api.v1 import allocations
from app.api.v1 import dashboard
from app.api.v1 import search
from app.api.v1 import ai

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(seats.router, prefix="/seats", tags=["seats"])
api_router.include_router(allocations.router, prefix="/allocations", tags=["allocations"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
