# SeatFlow AI

**Enterprise Seat Allocation & Project Mapping Platform**

SeatFlow AI is a centralized platform designed to automate seat allocation, project mapping, employee management, analytics, and provide natural language querying to improve workplace operations for enterprises.

## Key Features

1. **Workspace Management:** Manage Buildings, Floors, and Seats with strict occupation rules.
2. **Employee & Project Mapping:** Map employees to projects, departments, and specific seats.
3. **Smart Allocation:** Automatically assign seats to new joiners based on project or department proximity constraints.
4. **AI Assistant:** Built-in Natural Language Interface allowing queries like "Where does John sit?" or "How many seats are free on Floor 3?".
5. **Dashboard & Analytics:** Real-time visibility into utilization percentages, department headcount, and project distribution.
6. **Role-Based Access Control (RBAC):** Restrict critical API actions to Admin and HR roles only.

## Tech Stack

- **Backend:** FastAPI, Python 3, SQLAlchemy 2.0, Alembic, SQLite (Local Development) / PostgreSQL (Production)
- **Frontend:** Next.js 15 (App Router), React, Tailwind CSS, shadcn/ui, lucide-react
- **AI Integration:** OpenAI API (`gpt-4o`)

---

## Local Development Setup

### 1. Backend Setup

The backend comprises a robust FastAPI application architected modularly.

```bash
# Navigate to the backend directory
cd backend

# Create and activate a Virtual Environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies (Example setup commands if you don't have a requirements.txt)
pip install "fastapi[all]" "sqlalchemy" "alembic" "passlib" "bcrypt<4.1.0" "python-jose[cryptography]" "python-multipart" "openai" "faker"
```

Configure your `.env` file in the `backend/` directory:
```env
# backend/.env
DATABASE_URL=sqlite:///./seatflow.db
SECRET_KEY=your_super_secret_jwt_key
OPENAI_API_KEY=your_openai_api_key
```

**Seed Database:**
We provide a Faker script to generate initial employees, organizations, and 500 workspace seats.
```bash
python scripts/seed_database.py
```

**Start the Server:**
```bash
uvicorn app.main:app --reload
```
The API documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup

The frontend uses Next.js and Tailwind. Currently in foundational stages.

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run at `http://localhost:3000`.

## Architecture Principles

- **Separation of Concerns:** Routers, schemas (Pydantic), models (SQLAlchemy), and deps are separated logically. 
- **Security First:** User verification is enforced via dependency injection `get_current_active_admin` in critical routes.
- **RESTful Principles:** Scalable and predictable route naming conventions.
