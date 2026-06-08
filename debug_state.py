import requests

BASE = "http://localhost:8003/api/dafeiji"

r = requests.post(f"{BASE}/auth/login", json={"username": "testuser2024", "password": "test123456"})
token = r.json()['data']['token']

r = requests.post(f"{BASE}/game/state/save", 
    headers={"Authorization": f"Bearer {token}"},
    json={"plane_id": "vanguard", "state_data": {"x": 400}, "score": 1000, "wave": 3, "is_paused": False})

print("Status:", r.status_code)
print("Response:", r.json())
