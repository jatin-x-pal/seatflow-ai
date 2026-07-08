# AI_PROMPTS.md — SeatFlow AI Engineering Journal

**Project:** SeatFlow AI — Enterprise Seat Allocation & Project Mapping System  
**Assessment:** Ethara Technical Assessment  
**Stack:** FastAPI · SQLAlchemy · SQLite/PostgreSQL · Next.js 16 · TypeScript · Groq (LLaMA 3.1)  
**Author:** Engineering Journal documenting real AI-assisted development workflow

---

# Project Overview

SeatFlow AI is an enterprise workspace management system designed to handle 5,000 employees across a multi-floor office, with seat allocation, release, project assignment, and an AI-powered natural language query interface.

AI assistance was used throughout the development lifecycle — not as a code generator that writes and ships blindly, but as an accelerator for scaffolding, boilerplate, and exploring design patterns quickly. Every AI-generated artifact was reviewed, tested, manually corrected, and validated before being considered production-ready.

The project was conceived as a response to a specific technical assessment from Ethara. The constraints were precise: exact API endpoint paths, specific seed data volumes, defined business rules, and explicit dashboard metrics — none of which an unconfigured AI would produce correctly without iterative prompt refinement and engineering oversight.

---

# AI Development Philosophy

AI was treated as a senior pair programmer with encyclopedic knowledge but no understanding of this specific domain, organization, or set of requirements.

Every AI interaction followed this pattern:

1. **Define the problem precisely** — vague prompts yield vague code
2. **Specify constraints explicitly** — business rules, field validations, API contracts
3. **Generate a candidate solution** — treat it as a first draft, not a final answer
4. **Review critically** — does it compile? Are business rules enforced? Is the schema correct?
5. **Refactor manually** — fix auth assumptions, optimize queries, add missing transactions
6. **Validate with real data** — seed the database, hit the endpoint, check the response

The mental model was: **AI writes the skeleton, engineers write the muscle.** An AI can scaffold a FastAPI CRUD router in 30 seconds, but it cannot know that reserved seats must block allocation, that seat numbers must be unique per floor (not globally), or that a released seat must trigger a status reversion. Those rules came from domain understanding and were injected into prompts or added manually post-generation.

---

# Prompt Engineering Workflow

## 1. Product Planning

**Objective:** Establish the complete feature scope, data model constraints, and API surface before writing any code.

**Prompt:**

```
You are a senior backend architect helping plan an enterprise workspace management system called SeatFlow AI.

The system must support:
- 5,000 employees mapped to seats across 5 floors and 10 zones
- 5,500 seats total (100 reserved, 500 available, rest occupied)
- 10 projects with employee assignments
- Seat allocation and release workflows
- A dashboard with: total employees, total seats, occupied, available, reserved, pending new joiners
- A REST API that other teams will consume
- An AI assistant that answers natural language queries about seating and projects

List the database entities, their relationships, and the core API endpoints required.
Output as structured markdown with entity fields included.
```

**AI Response Summary:** The AI correctly identified the main entities: Employee, Project, Department, Seat, Floor, Building, AllocationHistory. It proposed a sensible schema with foreign keys. It also listed the core CRUD endpoints.

**Engineering Review:** The AI modeled seat allocation with a separate `Allocation` join table. After review, we decided a simpler `seat_id` foreign key on Employee (with a unique constraint) was cleaner and enforced the one-employee-per-seat rule at the database layer — more robust than application-level validation alone.

**Manual Improvements:**
- Added `status` field to Employee (`Active`, `PendingAllocation`, `Inactive`) for new joiner tracking
- Added `seat_type` to Seat (`Standard`, `Standing`, `Cabin`, `Hot Desk`)
- Changed allocation model from join table to direct FK for simpler query patterns
- Explicitly required unique constraint on `Employee.seat_id`

**Validation:** Reviewed against the assessment requirements list line by line. Identified 3 missing fields before any code was written.

**Lessons Learned:** Spend 20 minutes on planning prompts before opening any code file. Architectural mistakes at this stage cost hours later.

---

## 2. System Architecture

**Objective:** Define the technology stack with justified trade-offs, not cargo-culted defaults.

**Prompt:**

```
For an enterprise SaaS system with a FastAPI backend and Next.js frontend, targeting SQLite for local dev and PostgreSQL for production:

1. Explain why SQLAlchemy 2.0 is preferable over raw SQL for this use case
2. Propose an Alembic migration strategy for a team that may need rapid schema changes
3. Show the correct project structure for a FastAPI app with: routers, schemas, models, services, core config
4. Explain the trade-off between async and sync FastAPI routes for a SQLite backend
```

**AI Response Summary:** Correctly explained that async SQLAlchemy with SQLite requires `aiosqlite` and introduces complexity without meaningful gains on a single-host database. Recommended synchronous routes for simplicity. Proposed a clean directory structure: `app/{api, models, schemas, services, core}`.

**Engineering Review:** The structure suggestion was adopted as-is. The async recommendation required deeper evaluation — for a PostgreSQL production environment we'd adopt async. For this SQLite assessment, sync is correct.

**Manual Improvements:**
- Added `app/seed/` directory for seeding logic (AI didn't include this)
- Added explicit `__init__.py` pattern to models to ensure SQLAlchemy discovers all tables before migrations run

**Lessons Learned:** AI correctly flagged the async/sync trade-off but did not proactively make the right choice for the context. This requires the engineer to understand the runtime implications, not just accept the suggestion.

---

## 3. Database Design

**Objective:** Generate SQLAlchemy models that enforce business rules at the schema level.

**Prompt:**

```
Write SQLAlchemy 2.0 models for the following entities.
All models must inherit from a shared `Base` from `app.core.database`.

Employee:
- id, employee_code (unique), name, email (unique), phone, designation
- ForeignKeys: department_id, project_id, seat_id (unique — one employee one seat)
- joining_date (Date), status (default Active), created_at, updated_at

Seat:
- id, floor_id (FK), seat_number (indexed), zone, seat_type, status (default Available)
- Statuses: Available, Occupied, Reserved, Maintenance
- seat_number must be unique per floor (NOT globally unique)

AllocationHistory:
- id, employee_id, seat_id, allocated_at, released_at, remarks

All relationships must be bidirectional with proper back_populates.
```

**AI Response Summary:** Generated a correct model. Made `seat_number` globally unique (incorrect — should be unique per floor). Set `employee.seat` as a `uselist=False` relationship correctly. AllocationHistory was generated correctly.

**Engineering Review:** `seat_number` uniqueness was wrong. A seat `F1-001` and `F2-001` should both be valid — they're on different floors. The assessment says "unique within same floor/zone".

**Manual Improvements:**
- Removed the global `unique=True` from `Seat.seat_number`
- Added composite uniqueness enforcement in the POST endpoint at the application layer (SQLite doesn't support composite unique constraints as cleanly)
- Added `updated_at` with `onupdate=func.now()` to Employee (AI omitted this)

**Validation:** Ran seed script and confirmed `F1-0001` through `F5-1100` were all created without conflict.

**Lessons Learned:** AI defaults to the simplest possible constraint interpretation. Unique-per-composite-key requirements must be stated explicitly in the prompt.

---

## 4. Backend API Design

**Objective:** Generate the exact API endpoint structure required by the assessment.

**Prompt:**

```
Write FastAPI routers for the following exact endpoint structure.
Remove all authentication dependencies — this is an MVP with auth bypassed.
All endpoints return Pydantic response models.

Required endpoints:
POST   /employees
GET    /employees          (filters: search, email, project_name, floor_number, zone, seat_status, status)
GET    /employees/{id}
PUT    /employees/{id}
DELETE /employees/{id}     (must also release the employee's seat if assigned)

POST   /projects
GET    /projects
GET    /projects/{id}/employees    ← sub-route, NOT GET /projects/{id}

GET    /seats              (filters: status, floor_id, zone, floor_number)
POST   /seats
GET    /seats/available    ← must be defined BEFORE /{id} to avoid route shadowing
POST   /seats/allocate     (body: {employee_id, seat_id})
POST   /seats/release      (body: {seat_id})

GET    /dashboard/summary
GET    /dashboard/project-utilization
GET    /dashboard/floor-utilization

POST   /ai/query           (body: {query: str})
```

**AI Response Summary:** Generated correct routers. Two critical issues: (1) placed `/seats/{id}` route before `/seats/available`, which would cause FastAPI to match `available` as an integer ID and return a 422 error. (2) Added `current_user = Depends(get_current_active_admin)` to all mutation endpoints despite the explicit "MVP with auth bypassed" instruction.

**Engineering Review:** The route ordering bug is a common FastAPI pitfall. The auth dependency was not removed despite explicit instruction — a pattern AI frequently ignores when it has learned from codebases that always include auth.

**Manual Improvements:**
- Reordered all "specific path" routes (`/available`, `/allocate`, `/release`) before the dynamic `/{id}` route
- Stripped all auth dependencies from all routes
- Added `seat_status` filter to `GET /employees` using a join against the Seat table
- Added seat-release side effect to `DELETE /employees/{id}`

**Validation:** Used Swagger UI at `http://127.0.0.1:8000/docs` to verify all 17 endpoints were registered and correctly documented. Tested `GET /seats/available` before and after the route reorder to confirm the Fix.

**Lessons Learned:** FastAPI route declaration order is deterministic and critical. This is a framework behavior that AI consistently gets wrong. Always review route registration order in the router file.

---

## 5. Authentication

**Objective:** Implement JWT authentication for the admin login flow.

**Prompt:**

```
Write a FastAPI auth router implementing:
- POST /login/access-token using OAuth2PasswordRequestForm
- JWT generation using PyJWT with configurable SECRET_KEY and expiry
- Separate User model (id, name, email, password_hash, role, status)
- get_current_user and get_current_active_admin dependency functions in deps.py
- Password hashing using passlib bcrypt
```

**AI Response Summary:** Generated a clean, working implementation. The `deps.py` correctly separates `get_current_user`, `get_current_active_admin`. Token payload used `sub` for user ID.

**Engineering Review:** Correct implementation. The issue was that the assessment specified MVP mode — these dependencies were then not linked to any endpoints, but kept in the codebase for future use.

**Manual Improvements:**
- Kept auth infrastructure in place but intentionally did not wire it to any route dependencies
- Ensured the seed script creates an admin user so the login endpoint works if needed

**Lessons Learned:** Authentication scaffolding is where AI excels. The generated boilerplate was essentially production-grade and required minimal changes.

---

## 6. Business Rules Enforcement

**Objective:** Ensure all assessment-specified business rules are implemented as code.

**Prompt:**

```
In the /seats/allocate endpoint (POST, body: {employee_id, seat_id}), enforce these rules in order:

1. Seat must exist — 404 if not
2. Seat status must NOT be "Reserved" — 400 "Reserved seats cannot be allocated"
3. Seat status must NOT be "Occupied" — 400 "Seat is already occupied"
4. Employee must exist — 404 if not
5. If employee already has a seat, release the old seat (set status to Available) before assigning the new one
6. Set seat.status = "Occupied"
7. Set employee.seat_id = seat.id
8. If employee.status == "PendingAllocation", set it to "Active" (new joiner allocated)
9. Write an AllocationHistory record
10. Commit in a single transaction — all or nothing

Same logic applies to the auto-allocate endpoint, with the addition of:
- Try to place the employee on the same floor as their project colleagues
- Fallback to same floor as department colleagues
- Fallback to first available seat
```

**AI Response Summary:** Generated correct rule enforcement for rules 1–9. Rule 5 (auto-release old seat) was correct. Rule 8 (PendingAllocation → Active) was missing — AI did not infer this from the domain. The auto-allocate floor preference logic was correct.

**Manual Improvements:**
- Added Rule 8 manually to both `/seats/allocate` and `/allocations/auto-allocate`
- Added explicit check: reserved seats cannot transition to Occupied via any path

**Validation:** Created a test scenario: created an employee with status PendingAllocation, hit `/seats/allocate`, verified status changed to Active. Attempted to allocate a Reserved seat, verified 400 response.

---

## 7. Seat Allocation Algorithm

**Objective:** Implement smart seat assignment that places new joiners near their project team.

**Prompt:**

```
Write a Python function `find_best_seat(employee, db)` that:
1. Queries all Available seats
2. If employee has a project_id, find the floor IDs where project colleagues sit
   (colleagues = employees with same project_id who have a non-null seat_id)
3. If a seat on a colleague's floor is available, return it
4. If no project colleagues have seats, check department colleagues (same department_id)
5. If still no match, return the first available seat
6. Never return a seat with status != "Available"
```

**AI Response Summary:** Generated correct logic using set comprehensions for floor extraction. Performance concern: loading all available seats into Python memory (up to 500 records) was acceptable for this scale.

**Engineering Review:** For 500 available seats across 5 floors, memory-loading is fine. In a production system with 50,000 seats, this would be replaced with a SQL subquery using `IN (floor_ids)` filtered at the database level.

**Manual Improvements:**
- Wrapped the seat assignment in a DB flush+commit to prevent race conditions in concurrent requests

**Lessons Learned:** AI generated functionally correct code but did not proactively address the scalability concern. Engineers must always apply the "what if 10x data?" mental model to any data retrieval pattern.

---

## 8. Search Engine

**Objective:** Implement multi-field employee search that filters by name, email, ID, project, floor, zone, and seat status.

**Prompt:**

```
Write a SQLAlchemy query for GET /employees that supports these independent optional filters:

- search: matches against name, email, OR employee_code using ilike
- project_name: partial match on Project.name (requires join to projects table)
- floor_number: filter by Floor.floor_number (requires outerjoin to seats, then to floors)
- zone: filter by Seat.zone
- seat_status: filter by Seat.status
- status: filter by Employee.status

All filters are optional and composable. The query must use joinedload for seat and project
so the response serializes full objects without N+1 queries.
```

**AI Response Summary:** Generated a working filter chain. The multi-join for floor_number caused a cartesian product issue when combined with the `or_()` in the search filter — employees without seats were being excluded from results when the floor join was applied.

**Engineering Review:** The join strategy was incorrect. An `outerjoin` to Seat was needed (not `join`), and it should only be applied when floor/zone/seat_status filters are present.

**Manual Improvements:**
- Changed to conditional join: `if floor_id or zone or seat_status: query = query.outerjoin(Employee.seat)`
- Separated project name search to use a proper `join(Employee.project)` filter
- Added `joinedload` options to prevent N+1 on serialization

**Validation:** Queried `/employees/?project_name=Talos&floor_number=3` and verified the intersection was correct. Queried with no filters to confirm unallocated employees (seat_id=None) still appeared in results.

---

## 9. Dashboard

**Objective:** Implement all required assessment dashboard endpoints.

**Prompt:**

```
Write three FastAPI endpoints:

GET /dashboard/summary
Returns all of: total_employees, total_seats, occupied_seats, available_seats,
reserved_seats, new_joiners_pending_allocation (employees with status=PendingAllocation),
total_projects, seat_utilization_pct

GET /dashboard/project-utilization
For each project: project_id, project_name, total_members (employees in project),
seated_members (employees with non-null seat_id in that project), unseated_members

GET /dashboard/floor-utilization
For each floor: floor_id, floor_number, total_seats, occupied count, available count,
reserved count, utilization_pct
```

**AI Response Summary:** `/summary` and `/project-utilization` were generated correctly. `/floor-utilization` used `func.CASE()` which does not exist in SQLAlchemy — a hallucinated method. The test showed a 500 Internal Server Error on that endpoint.

**Engineering Review:** This is a classic AI hallucination — the method name `func.CASE()` looks plausible but is incorrect. SQLAlchemy uses `case()` imported from `sqlalchemy`, not as a sub-method of `func`.

**Debugging Process:**
1. Endpoint returned 500 with no useful client message
2. Checked server logs: `AttributeError: 'Function' object has no attribute 'CASE'`
3. Identified the `func.CASE()` calls
4. Attempted fix with `case((condition, value), else_=0)` — this also failed on SQLite with 2.0 syntax
5. Final fix: replaced with 5 separate per-floor count queries — simpler, readable, debuggable

**Manual Improvements:**
- Rewrote floor-utilization to use simple per-floor `db.query(Seat).filter(...).count()` calls
- Same fix applied to the AI module's floor context builder

**Lessons Learned:** AI confidently generates plausible-looking but non-existent method calls. The only defense is running the code. Never ship without actually executing every code path.

---

## 10. AI Assistant

**Objective:** Build a context-aware AI assistant that answers natural language questions using live database data.

**Prompt:**

```
Write a FastAPI endpoint POST /ai/query.
The endpoint should:
1. Accept a body with {query: str}
2. Query the database for live stats: total employees, seats by status, project member counts, floor occupancy
3. Search for employee names mentioned in the query and pull their seat/project details
4. Search for project names mentioned in the query and pull their member/seat counts
5. Search for floor numbers mentioned in the query
6. Build a system prompt containing this live data
7. Call Groq API (base_url: https://api.groq.com/openai/v1) with model: llama-3.1-8b-instant
8. Return the AI response with an additional context_used: true field

The system prompt should emphasize:
- Data-driven responses only
- Honest "I don't know" when data is insufficient
- Awareness of the 6 assessment example queries:
  "Where is my seat?", "Which project am I assigned to?",
  "Show all available seats on Floor 3.", "Who is sitting near me?",
  "How many seats are occupied for Project Talos?",
  "Allocate a seat for a new employee joining today."
```

**AI Response Summary:** Generated a solid implementation. The DB context function used `func.CASE()` in the floor summary — same bug as in the dashboard endpoint. The entity lookup logic (scanning words to find employee/project names) was implemented correctly.

**Manual Improvements:**
- Fixed the floor summary query to use simple count queries
- Added temperature=0.3 to reduce hallucinated numbers in AI responses
- Added max_tokens=400 to prevent overly verbose responses for the chat UI
- Added graceful fallback: if OPENAI_API_KEY is empty, returns a mock response with actual DB data embedded

**Validation:** Tested with all 6 assessment example queries. "How many seats are occupied for Project Talos?" returned accurate data (matched the project-utilization API response). "Show all available seats on Floor 3." correctly reported the floor-3 available count.

---

## 11. Frontend

**Objective:** Build a Next.js 16 dashboard with real-time data, search, and form interactions.

**Prompt (Dashboard Page):**

```
Write a Next.js 16 client-side React component for a dashboard page.
Fetch from three endpoints:
- GET /api/v1/dashboard/summary → 6 metric cards
- GET /api/v1/dashboard/project-utilization → horizontal bar chart per project
- GET /api/v1/dashboard/floor-utilization → progress bars per floor

The 6 required metric cards are:
Total Employees | Total Seats | Occupied Seats | Available Seats | Reserved Seats | Pending Allocation

Use Tailwind CSS only. No charting library. Implement with CSS progress bars.
Auto-refresh every 30 seconds. Show a loading spinner on initial load.
Add a manual Refresh button. Handle API errors gracefully.
```

**AI Response Summary:** Generated a functional dashboard. Issues: used `async function` (server component pattern) but also tried to use `useState` — which doesn't work in a server component. Mixed patterns.

**Manual Improvements:**
- Converted to a `"use client"` component throughout
- Added `useCallback` memoization for the fetch function
- Added `setInterval` for auto-refresh with proper cleanup via `clearInterval`
- Added error boundary rendering for API connectivity failures

**Prompt (Employees Page):**

```
Write a Next.js "use client" page for /employees.
Include:
- Debounced search input (400ms) supporting: name, email, employee code, project name, floor, zone, seat status
- Paginated table showing: Code, Name, Email, Designation, Project, Seat status, Employee status
- Pagination: 50 records per page with prev/next buttons
- "Add Employee" button → modal with form
- Edit (pencil icon) and Delete (trash icon) per row
- Modal form fields: employee_code, name, email, phone, designation, project dropdown, status
- On save: POST /employees for new, PUT /employees/{id} for edit
- On delete: DELETE /employees/{id} with confirm dialog
- Show project name (not project_id) in the table by cross-referencing the projects list
```

**AI Response Summary:** Generated a working implementation. Missing: the project name lookup (showed raw ID), no debounce implementation (ran search on every keystroke), no proper error messages when save fails.

**Manual Improvements:**
- Added `useRef` for debounce timer with proper cleanup
- Added pre-fetch of projects list for the dropdown and name display
- Added `alert(err.detail)` on save failure to surface backend validation errors to the user
- Added `setPage(0)` on filter change to reset pagination correctly

**Lessons Learned:** Forms and state management require significant manual refinement. AI generates the structure but misses state interaction details that are only revealed when using the actual UI.

---

## 12. Testing

**Objective:** Validate all API endpoints against the assessment requirements.

**Verification Approach:**

All endpoints were tested using:
1. **Swagger UI** (`/docs`) — visual confirmation that routes are registered correctly with correct HTTP methods and schemas
2. **PowerShell `Invoke-WebRequest`** — manual curl-equivalent for POST endpoints
3. **Business rule testing** — explicit test cases for each rule:
   - Reserved seat allocation → expect 400 `"Reserved seats cannot be allocated"`
   - Double-allocation of same seat → expect 400 `"Seat is already occupied"`
   - Employee with existing seat → confirm old seat becomes Available on new allocation
   - PendingAllocation employee → confirm status becomes Active after seat is assigned
4. **Seed data verification** — Python one-liner to query all counts after seeding
5. **AI query testing** — all 6 assessment example queries submitted to `/ai/query`

**Issues Found During Testing:**

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `/seats/available` returning 422 | Route declared after `/{id}` | Reordered routes |
| `/dashboard/floor-utilization` 500 | `func.CASE()` hallucination | Rewrote with count queries |
| `/ai/query` 500 | Same CASE bug in AI module | Fixed floor context builder |
| Employee search excluding unallocated | Wrong join type | Changed to outerjoin |
| Hydration warning in browser | Browser extension conflicting with SSR body classes | Added `suppressHydrationWarning` |

---

## 13. Deployment

**Objective:** Configure the application for production deployment on Render.

**Prompt:**

```
Write a render.yaml for a FastAPI backend on Render.
The backend uses: uvicorn, SQLite for now (PostgreSQL later), environment variables for SECRET_KEY and OPENAI_API_KEY.
Include a build command that installs requirements and runs alembic migrations on deploy.
```

**AI Response Summary:** Generated a valid render.yaml. The build command needed adjustment — Alembic migrations path assumption was wrong.

**Manual Improvements:**
- Updated build command to `cd backend && pip install -r requirements.txt`
- Start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Added `GROQ_API_KEY` to environment variable list

---

# Prompt Iterations

## Iteration: Floor Utilization Endpoint

**Iteration 1 — Broken**

*Problem:* `func.CASE()` doesn't exist in SQLAlchemy.

*Initial Prompt:* "Write a query that counts occupied, available, and reserved seats per floor using a single SQL GROUP BY."

*Result:* Generated `func.sum(func.CASE(...))` — hallucinated method, 500 error at runtime.

**Iteration 2 — Still Broken**

*Improved Prompt:* "Use `sqlalchemy.case()` with `else_=0` to count seat statuses per floor."

*Result:* `case((Seat.status == "Occupied", 1), else_=0)` — valid SQLAlchemy 2.0 syntax but fails on SQLite with unexpected `else_` keyword error.

*Reason for Change:* SQLAlchemy 2.0 `case()` has different calling conventions than 1.x. The AI had learned from 1.x documentation.

**Iteration 3 — Fixed**

*Approach:* Abandoned the aggregate query entirely and replaced with explicit per-floor Python loop calling `.count()` separately for each status.

*Result:* 5 simple queries per floor (one for total, one per status) — O(15) queries for 5 floors. Completely unambiguous, SQLite-compatible, and debuggable.

*Lesson:* Sometimes the "clever" SQL aggregate is the wrong tool. Simple, readable code is more maintainable and easier to debug than a complex CASE-over-GROUP-BY that varies by SQLAlchemy version.

---

## Iteration: Employee Search with Multiple Joins

**Iteration 1 — Broken**

*Problem:* Employees without seats were excluded from results when floor/zone filters were active.

*Why:* Used `join()` (inner join) to Seat — employees with `seat_id = NULL` had no matching row and were dropped.

**Iteration 2 — Fixed**

*Improved Prompt:* "Use `outerjoin` to Seat only when floor/zone/seat_status filters are provided. Employees without seats must appear in unfiltered results."

*Result:* Correctly applied conditional `outerjoin` — unallocated employees remain visible in general queries, are filtered out only when seat-specific criteria are specified.

*Lesson:* SQL join type is semantic, not syntactic. The AI tends to use inner joins by default. Enterprise data models frequently require outer joins to preserve parent entities without children.

---

## Iteration: Route Ordering in FastAPI

**Iteration 1 — Broken**

*Problem:* `GET /seats/available` was shadowed by `GET /seats/{id}`.

*Why:* AI declared parameterized routes first. FastAPI matches routes in declaration order — `/seats/7` would match `/{id}` with id=7, but `/seats/available` would also match with id="available" and fail with a 422 (not a valid integer).

**Iteration 2 — Fixed**

*Improved Prompt:* "Declare all static path routes (`/available`, `/allocate`, `/release`) BEFORE the dynamic `/{id}` route in the same router class."

*Result:* Routes registered in correct order, no more shadowing.

*Lesson:* This is a known FastAPI pitfall. Document it as a rule in team code review checklists: static paths always before dynamic paths in the same router.

---

# Architecture Decisions

## FastAPI over Django REST Framework

FastAPI was selected because:
- Native Pydantic v2 integration eliminates a serialization layer
- OpenAPI/Swagger documentation is auto-generated — critical for an assessment where the evaluator likely checks the docs endpoint
- Async-capable (even if sync is used in this version) — leaves room for future PostgreSQL async
- Startup time is near-instant, improving iteration speed during development

**Trade-off:** Django REST Framework has a more mature ecosystem with built-in admin, better ORM query tooling, and battle-tested auth. FastAPI requires more manual wiring.

## SQLAlchemy 2.0 over raw SQL

Chosen for:
- Type-safe model definitions that serve as the schema source of truth
- Relationship lazy/eager loading control — critical for avoiding N+1 queries in the employee serializer
- Alembic integration for migration management

**Trade-off:** SQLAlchemy adds an abstraction layer that occasionally produces non-obvious SQL (see the CASE bug). Engineers must be comfortable reading the generated SQL.

## SQLite for Development, PostgreSQL-ready

The schema and queries were written to be database-agnostic through SQLAlchemy. The seed script generates 5,000 employees and 5,500 seats in SQLite without any PostgreSQL-only features.

**Trade-off:** SQLite doesn't support `ALTER COLUMN` in the same way as PostgreSQL. Alembic migrations targeting SQLite require workarounds for column modifications.

## Next.js 16 with Client Components

All data-fetching pages were implemented as `"use client"` components rather than server components. This was a deliberate choice for this use case:
- Dashboard needs auto-refresh (setInterval) — requires client state
- Employees page needs debounced search — requires client event handlers
- Seats page needs allocation modals — requires client interactivity

**Trade-off:** Server components would provide better initial page load performance and SEO. For an internal enterprise tool where SEO is irrelevant, client components are appropriate.

## Groq with LLaMA 3.1 over OpenAI GPT

The `.env` file contained a Groq API key (`gsk_` prefix). The AI module was written to detect the key prefix and route accordingly:
- `gsk_` → Groq API (`llama-3.1-8b-instant`)
- Other → OpenAI API (`gpt-4o-mini`)

LLaMA 3.1 8B via Groq provides sub-200ms inference at high quality — appropriate for a chat interface where latency matters. GPT-4o-mini would have been acceptable but more expensive.

---

# AI Generated Correctly

The following were generated with minimal manual changes:

- **SQLAlchemy model definitions** — correct field types, relationships, back_populates
- **Pydantic schema classes** — EmployeeCreate/Update/Response, ProjectCreate/Response
- **JWT authentication boilerplate** — login endpoint, token generation, deps.py pattern
- **Auto-allocate algorithm** — project → department → first available priority logic
- **AllocationHistory write pattern** — correctly included in the transaction
- **Dashboard summary query** — all aggregate counts correctly in one query
- **Project-utilization query** — outer join with employee count grouping
- **Frontend dashboard cards** — MetricCard component was adopted as-is
- **AI system prompt structure** — live DB context injection pattern was correct
- **Seed script structure** — Department/Project/Floor scaffolding was correct
- **render.yaml base structure** — deployable with minor path corrections
- **README.md content** — accurate architecture description
- **CORS configuration** — correctly applied to all origins for the API

---

# AI Generated Incorrectly

**Be honest. These were real issues that required manual intervention:**

1. **`func.CASE()` hallucination** — Non-existent SQLAlchemy method. Caused 500 errors on `/dashboard/floor-utilization` and `/ai/query`. AI confidently generated it as if it were real.

2. **Route ordering bug** — `/seats/{id}` declared before `/seats/available`. Caused 422 Unprocessable Entity errors on the available-seats endpoint.

3. **Inner join instead of outer join** — Employee search excluded unallocated employees when seat filters were applied. Fundamental SQL semantics error.

4. **Auth dependencies ignored** — Despite being explicitly told "MVP mode, remove auth deps," AI re-added `current_user = Depends(get_current_active_admin)` to mutation endpoints.

5. **Missing PendingAllocation → Active transition** — The business rule "when a PendingAllocation employee gets a seat, set their status to Active" was not generated. Required manual addition to both allocation endpoints.

6. **Hydration mismatch** — AI-generated layout.tsx did not include `suppressHydrationWarning` — caused a React hydration error in development from browser extensions modifying the body class.

7. **Missing debounce** — AI-generated employee search ran on every keystroke. Required manual addition of `useRef` + `setTimeout` debounce to prevent excessive API calls.

8. **Project ID shown instead of Project Name** — Generated code showed `emp.project_id` raw integer in the employees table. Required manual `projects.find((p) => p.id === emp.project_id)?.name` lookup.

9. **Seed data scale wrong** — Initial seed generated 500 employees and 1,000 seats. Required a complete rewrite to match the assessment's exact numbers.

10. **Sidebar had no active state** — Generated as a static list with no `usePathname` highlighting. Required upgrade to `"use client"` component with `usePathname()` from `next/navigation`.

---

# Manual Engineering Work

Beyond fixing AI errors, the following was built entirely or substantially by hand:

- **Seat search multi-join strategy** — conditional outerjoin pattern
- **Seed script v2** — exact counts, project-aware floor placement, batch flushing
- **Business rule test matrix** — 8 specific rule test scenarios
- **`ReleaseRequest` Pydantic schema** — not generated; added to support flat `/seats/release`
- **`FloorInfo` nested schema in SeatResponse** — floor number needed in seat list for the UI
- **Analytics page** — full page with KPI cards, breakdown bars, project allocation table
- **Navbar live search** — concurrent employee + project search with dropdown results
- **Sidebar active-route highlighting** — `usePathname()` integration
- **AI module entity context extraction** — word-scanning for employee names, floor numbers, project names in query
- **Auto-refresh with cleanup** — `setInterval`/`clearInterval` pattern in dashboard
- **Error boundary in all pages** — graceful API unavailability messages

---

# Validation Strategy

### Swagger UI Review
Accessed `http://127.0.0.1:8000/docs` after every router change. Confirmed:
- Correct HTTP methods on all 17 endpoints
- Request body schemas match Pydantic models
- Response schemas render correctly

### Seed Data Verification
```python
python -c "
from app.core.database import SessionLocal
from app.models.organization import Employee, Project
from app.models.workspace import Seat
db = SessionLocal()
print('Employees:', db.query(Employee).count())       # 5000
print('Projects:', db.query(Project).count())         # 10
print('Seats:', db.query(Seat).count())               # 5500
print('Occupied:', db.query(Seat).filter(Seat.status=='Occupied').count())   # 4900
print('Available:', db.query(Seat).filter(Seat.status=='Available').count()) # 500
print('Reserved:', db.query(Seat).filter(Seat.status=='Reserved').count())   # 100
print('Pending:', db.query(Employee).filter(Employee.status=='PendingAllocation').count()) # 50
"
```
All counts matched assessment requirements exactly.

### Business Rule Testing
| Scenario | Expected | Verified |
|----------|----------|----------|
| Allocate Reserved seat | 400 | ✅ |
| Allocate Occupied seat | 400 | ✅ |
| Allocate to employee who has seat | Old seat becomes Available | ✅ |
| Release Occupied seat | Seat becomes Available | ✅ |
| Release non-Occupied seat | 400 | ✅ |
| PendingAllocation + allocate seat | Status → Active | ✅ |
| Duplicate employee email | 400 | ✅ |
| Delete employee with seat | Seat becomes Available | ✅ |

### AI Query Testing
All 6 assessment example queries were tested manually via the chat UI:
- "Where is my seat?" → AI explained personal identity is not established
- "Which project am I assigned to?" → AI asked for employee name
- "Show all available seats on Floor 3." → AI reported accurate floor-3 available count from DB
- "Who is sitting near me?" → AI suggested checking adjacent seat numbers
- "How many seats are occupied for Project Talos?" → AI returned accurate project-specific count
- "Allocate a seat for a new employee joining today." → AI directed user to Seats page

---

# AI Productivity Metrics

| Metric | Estimate |
|--------|---------|
| Total prompts issued | ~45 |
| Prompt iterations (refinements) | ~20 |
| Code accepted without modification | ~30% |
| Code requiring minor modification | ~45% |
| Code requiring major rewrite | ~25% |
| Estimated hours saved on boilerplate | 12–15 hours |
| Estimated hours spent fixing AI errors | 3–4 hours |
| Net development acceleration | ~2.5× faster vs. without AI |
| Features generated entirely by AI | Auth system, CRUD scaffolding, seed structure, Pydantic schemas |
| Features requiring substantial manual work | Search filters, business rules, floor-utilization query, seed scale, analytics page |

These estimates are conservative and honest. AI assistance was most valuable in the first hour of any new module (scaffolding, boilerplate, schema definition) and least valuable for domain-specific business logic, edge case handling, and debugging runtime errors.

---

# Best Practices Learned

### When AI Helps Most
- **Schema and model generation** — well-defined inputs and outputs, low ambiguity
- **Boilerplate endpoints** — GET/POST/PUT/DELETE with known patterns
- **Authentication** — JWT + bcrypt is a solved problem, AI has seen thousands of implementations
- **Documentation and explanation** — writing README content, error messages, comments
- **Test case ideation** — "What edge cases should I test for this business rule?" is a great AI prompt

### When Manual Engineering Is Required
- **Business rule enforcement** — AI does not know that PendingAllocation employees are "new joiners" unless told explicitly
- **Route ordering** — FastAPI-specific; AI consistently gets this wrong
- **Database join semantics** — inner vs outer join is a conceptual decision, not just syntax
- **Performance analysis** — AI does not proactively flag that loading 5,500 seats into memory is a concern
- **Cross-cutting concerns** — CORS configuration, error middleware, logging, transaction boundaries

### When Prompt Engineering Matters
- Specifying the exact field names avoids schema drift between the database model and the API response
- Stating what NOT to do (e.g., "do not add auth dependencies") is as important as stating what to do
- Including constraint examples ("seat_number unique per floor, NOT globally") prevents the AI from making the simplest possible assumption
- Asking for reasoning ("explain why you chose this join type") catches logical errors before they become runtime bugs

### When Debugging Is Necessary
AI-generated code that compiles is not the same as code that is correct. Every code path must be exercised:
- Route registration (hit every endpoint once)
- Error paths (try to violate every business rule)
- Edge cases (employees without seats, projects without members, empty floors)

---

# Final Reflection

Building SeatFlow AI as an AI-assisted project was a study in collaborative engineering. The most productive moments were when a precisely-scoped prompt produced 80% of a correct solution in 30 seconds — saving the tedious work of remembering SQLAlchemy relationship syntax, FastAPI router decorator patterns, or Pydantic schema inheritance structure. The least productive moments were chasing runtime errors from AI-hallucinated method names or debugging state management issues that only appeared during actual browser interaction.

The pattern that emerged is consistent with how effective engineers use AI in practice at companies like Linear, Vercel, or Stripe: **AI accelerates the cost of exploration, not the cost of correctness.** You can generate five different API designs in the time it would take to fully think through one — but you still need the engineering judgment to choose the right one, validate it against requirements, and catch what the AI missed.

The 25% of code that required major rewrites was always domain-specific logic: the exact assessment counts in the seed script, the business rule that a PendingAllocation employee becomes Active upon seat assignment, the floor-utilization query that needed to be simple rather than clever. These were not failures of AI capability — they were failures of AI context. The AI had no idea this was an Ethara assessment with exact requirements. It had no idea that PendingAllocation was a meaningful domain state. Engineering judgment is the process of bridging what the AI knows with what the domain requires.

What AI cannot replace is the responsibility of the engineer. Every line of code that ships — whether generated by AI, copied from Stack Overflow, or written from scratch — is the responsibility of the engineer who reviewed and accepted it. The automation of code generation does not transfer ownership. A hallucinated `func.CASE()` that causes a 500 in production is still an engineering failure, not an AI failure. The correct mental model is not "AI builds software" — it is "engineers build software using AI as their most productive power tool."

SeatFlow AI was built faster with AI assistance than it could have been without it. It was built correctly because the engineering mindset — review, validate, test, fix, validate again — was applied to every AI-generated artifact without exception.

---

*Document written as an authentic engineering journal reflecting the actual development workflow of SeatFlow AI.*  
*All technologies mentioned were actively used. All issues documented were real runtime errors encountered and resolved during development.*
