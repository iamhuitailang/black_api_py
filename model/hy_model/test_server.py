#!/usr/bin/env python3
import sys
import traceback

print("=== Step 1: Testing main import ===")
try:
    import main
    print("✓ main import successful")
except Exception as e:
    print(f"✗ main import failed: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n=== Step 2: Testing FastAPI app ===")
try:
    app = main.app
    print(f"✓ FastAPI app created: {app.title}")
    print(f"  - Version: {app.version}")
except Exception as e:
    print(f"✗ FastAPI app test failed: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n=== Step 3: Testing routes ===")
try:
    routes = [route.path for route in app.routes]
    print(f"✓ Routes loaded: {len(routes)} routes")
    for route in sorted(routes)[:10]:
        print(f"  - {route}")
    print(f"  ... and {len(routes) - 10} more")
except Exception as e:
    print(f"✗ Routes test failed: {e}")
    traceback.print_exc()
    sys.exit(1)

print("\n=== Step 4: Starting server (will run for 10 seconds) ===")
print("Server will be available at: http://localhost:8000")
print("API docs at: http://localhost:8000/docs")

try:
    import uvicorn
    import threading
    import time
    
    def run_server():
        uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    
    # Wait for server to start
    time.sleep(3)
    
    # Test health endpoint
    import requests
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=5)
        print(f"\n✓ Health check response: {response.status_code}")
        print(f"  {response.json()}")
    except Exception as e:
        print(f"\n⚠ Health check warning: {e}")
    
    print("\n✅ Server is running! Press Ctrl+C to stop.")
    print("Testing for 10 seconds...")
    time.sleep(10)
    print("\nTest complete!")
    
except Exception as e:
    print(f"\n✗ Server start failed: {e}")
    traceback.print_exc()
