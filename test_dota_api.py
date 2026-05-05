import time
import threading
import uvicorn
import urllib.request
import json

class TestServer(uvicorn.Server):
    def install_signal_handlers(self):
        pass

config = uvicorn.Config("main:app", host="127.0.0.1", port=8888, log_level="info")
server = TestServer(config=config)
thread = threading.Thread(target=server.run)
thread.start()

time.sleep(3)

BASE_URL = "http://127.0.0.1:8888"

def http_get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode('utf-8')

def http_post(url, data, headers=None):
    req_headers = {'Content-Type': 'application/json'}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(
        url, 
        data=json.dumps(data).encode('utf-8'), 
        headers=req_headers
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status, resp.read().decode('utf-8')

print("Testing Dota API...")
print("=" * 50)

try:
    status, text = http_get(f"{BASE_URL}/health")
    print(f"1. Health check: status={status}")
    print(f"   Response: {text}")
    
    print("\n2. Testing user registration...")
    status, text = http_post(
        f"{BASE_URL}/api/dota/user/register",
        {"username": "apitest001", "password": "123456", "nickname": "API测试玩家"}
    )
    print(f"   Register: status={status}")
    print(f"   Response: {text}")
    
    print("\n3. Testing user login...")
    status, text = http_post(
        f"{BASE_URL}/api/dota/user/login",
        {"username": "apitest001", "password": "123456"}
    )
    print(f"   Login: status={status}")
    print(f"   Response: {text}")
    
    login_data = json.loads(text)
    if login_data.get('code') == 0:
        token = login_data['data']['token']
        auth_headers = {"Authorization": f"Bearer {token}"}
        print(f"\n   Got token: {token[:20]}...")
        
        print("\n4. Testing get hero list...")
        status, text = http_get(f"{BASE_URL}/api/dota/hero/list/get", auth_headers)
        print(f"   Hero list: status={status}")
        hero_data = json.loads(text)
        if hero_data.get('code') == 0 and hero_data.get('data'):
            heroes = hero_data['data']
            print(f"   Found {len(heroes)} heroes")
            for h in heroes[:3]:
                print(f"     - {h.get('name')}: {h.get('description', '')[:30]}")
        
        print("\n5. Testing get equipment shop...")
        status, text = http_get(f"{BASE_URL}/api/dota/equipment/shop/get", auth_headers)
        print(f"   Shop list: status={status}")
        shop_data = json.loads(text)
        if shop_data.get('code') == 0 and shop_data.get('data'):
            items = shop_data['data']
            print(f"   Found {len(items)} shop items")
            for item in items[:3]:
                print(f"     - {item.get('name')}: {item.get('price', 0)} gold")
        
        print("\n6. Testing select hero (敌法师 ID=1)...")
        status, text = http_post(
            f"{BASE_URL}/api/dota/hero/select",
            {"hero_id": 1},
            auth_headers
        )
        print(f"   Select hero: status={status}")
        print(f"   Response: {text}")
        
        print("\n7. Testing get current stage info...")
        status, text = http_get(f"{BASE_URL}/api/dota/stage/current/get", auth_headers)
        print(f"   Stage info: status={status}")
        print(f"   Response: {text}")
        
finally:
    server.should_exit = True
    thread.join(timeout=5)
    print("\n" + "=" * 50)
    print("API test completed!")
