import requests

BASE = "http://localhost:8003/api/dafeiji"

r = requests.post(f"{BASE}/auth/login", json={"username": "testuser2024", "password": "test123456"})
token = r.json()['data']['token']

paths = [
    "/auth/user-info",
    "/auth/user/info",
    "/auth/userInfo",
]

for path in paths:
    r = requests.get(f"{BASE}{path}", headers={"Authorization": f"Bearer {token}"})
    print(f"GET {path}: {r.status_code} - {r.json().get('message', r.json().get('detail', ''))}")

print()
print("Checking all routes...")
r = requests.get("http://localhost:8003/docs")
print(f"Docs page: {r.status_code}")
