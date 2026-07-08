import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

# Wait a second for server to come up just in case
time.sleep(2)

print("Attempting to login...")
response = requests.post(f"{BASE_URL}/login/access-token", data={
    "username": "admin@seatflow.ai",
    "password": "admin123"
})
if response.status_code != 200:
    print(f"Login failed: {response.text}")
    exit(1)

token = response.json().get("access_token")
print(f"Login successful! Acquired JWT token.")

headers = {"Authorization": f"Bearer {token}"}

print("\nFetching Dashboard Metrics...")
dash_res = requests.get(f"{BASE_URL}/dashboard/metrics", headers=headers)
if dash_res.status_code == 200:
    print("Dashboard Metrics Data:")
    print(json.dumps(dash_res.json(), indent=2))
else:
    print(f"Dashboard failed: {dash_res.text}")
