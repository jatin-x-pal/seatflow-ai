from fastapi.testclient import TestClient
from app.main import app

def test_dashboard_metrics():
    client = TestClient(app)
    # The application is live, testing GET dashboard
    response = client.get("/api/v1/dashboard/metrics")
    
    assert response.status_code == 200, "Dashboard metrics endpoint failed!"
    data = response.json()
    assert "widgets" in data, "Dashboard JSON payload missing 'widgets'"
    assert "charts" in data, "Dashboard JSON payload missing 'charts'"
    
    widgets = data["widgets"]
    assert "total_employees" in widgets, "Total employees metric missing"
    assert widgets["total_seats"] > 0, "Seeding function failed to populate workspace zones."

def test_employee_fetching():
    client = TestClient(app)
    response = client.get("/api/v1/employees/?limit=5")
    assert response.status_code == 200, "Employee retrieval failed"
    employees = response.json()
    assert len(employees) <= 5, "Pagination limit enforcement failed."

def test_api_availability():
    client = TestClient(app)
    response = client.get("/docs")
    assert response.status_code == 200, "Swagger specification documentation is unavailable."

print("Unit test specs loaded.")
