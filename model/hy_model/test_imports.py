#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')

print('Testing imports...')

try:
    from database import engine, Base
    print('✓ database import OK')
except Exception as e:
    print(f'✗ database import failed: {e}')
    import traceback
    traceback.print_exc()

try:
    from models import User
    print('✓ models import OK')
except Exception as e:
    print(f'✗ models import failed: {e}')
    import traceback
    traceback.print_exc()

try:
    from schemas import UserCreate, ResponseModel
    print('✓ schemas import OK')
except Exception as e:
    print(f'✗ schemas import failed: {e}')
    import traceback
    traceback.print_exc()

try:
    from services import UserService
    print('✓ services import OK')
except Exception as e:
    print(f'✗ services import failed: {e}')
    import traceback
    traceback.print_exc()

try:
    from controllers import auth_controller
    print('✓ controllers import OK')
except Exception as e:
    print(f'✗ controllers import failed: {e}')
    import traceback
    traceback.print_exc()

print('All imports tested!')
