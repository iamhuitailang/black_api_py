import requests

BASE = "http://localhost:8003/api/dafeiji"

r = requests.post(f"{BASE}/auth/login", json={"username": "testuser2024", "password": "test123456"})
print("Login response:", r.json())

token = r.json()['data']['token']

r2 = requests.get(f"{BASE}/auth/user-info", headers={"Authorization": f"Bearer {token}"})
print("User info response:", r2.json())

r3 = requests.get(f"{BASE}/game/planes")
print("Planes status:", r3.status_code)
print("Planes response keys:", list(r3.json().keys()))
