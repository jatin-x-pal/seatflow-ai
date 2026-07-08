from app.models.user import User
from app.models.organization import Department, Project, Employee
from app.models.workspace import Building, Floor, Seat, AllocationHistory

# This ensures that when we import app.models, 
# all the SQLAlchemy models are loaded for Alembic to autogenerate schemas.
