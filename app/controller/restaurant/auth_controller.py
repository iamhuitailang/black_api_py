import os
import hmac
import time
import base64
import json
from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel


STAFF_PASSWORD = os.environ.get('RESTAURANT_STAFF_PASSWORD', '8888')
TOKEN_EXPIRY = 86400
_SECRET_KEY = os.environ.get('RESTAURANT_SECRET_KEY', 'restaurant-secret-key-2024')


class StaffLoginRequest(BaseModel):
    password: str


def _create_token() -> str:
    payload = {
        'role': 'staff',
        'iat': int(time.time()),
        'exp': int(time.time()) + TOKEN_EXPIRY
    }
    payload_json = json.dumps(payload, sort_keys=True)
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode()).decode()
    signature = hmac.new(_SECRET_KEY.encode(), payload_b64.encode(), 'sha256').hexdigest()
    return f'{payload_b64}.{signature}'


def verify_staff_token(token: str) -> bool:
    if not token:
        return False
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return False
        payload_b64, signature = parts
        expected_sig = hmac.new(_SECRET_KEY.encode(), payload_b64.encode(), 'sha256').hexdigest()
        if not hmac.compare_digest(signature, expected_sig):
            return False
        payload_json = base64.urlsafe_b64decode(payload_b64.encode()).decode()
        payload = json.loads(payload_json)
        if time.time() > payload.get('exp', 0):
            return False
        return True
    except Exception:
        return False


class RestaurantAuthController:
    def __init__(self):
        pass

    def ActionAuthStaffLoginPost(self, request: Request, body: StaffLoginRequest):
        """
        员工登录
        POST /api/auth/staff/login
        """
        if body.password != STAFF_PASSWORD:
            return {
                'code': 1,
                'message': '密码错误',
                'data': None
            }

        token = _create_token()
        return {
            'code': 0,
            'message': '登录成功',
            'data': {
                'token': token,
                'expires_in': TOKEN_EXPIRY
            }
        }

    def ActionAuthStaffVerifyGet(self, request: Request, token: Optional[str] = Query(None)):
        """
        验证员工token
        GET /api/auth/staff/verify
        """
        if not verify_staff_token(token):
            return {
                'code': 1,
                'message': '未登录或登录已过期',
                'data': None
            }
        return {
            'code': 0,
            'message': '验证通过',
            'data': {
                'role': 'staff'
            }
        }

    def ActionAuthStaffLogoutPost(self, request: Request, token: Optional[str] = Query(None)):
        """
        员工登出
        POST /api/auth/staff/logout
        """
        return {
            'code': 0,
            'message': '已登出',
            'data': None
        }
