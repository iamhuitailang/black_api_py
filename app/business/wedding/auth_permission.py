from enum import Enum
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException, status
from app.model.auth import TokenModel


class Role(str, Enum):
    PLANNER = "planner"
    PARTNER = "partner"
    GUEST = "guest"


class RolePermission:
    ROLE_PERMISSIONS = {
        Role.PLANNER: {
            "guests": ["create", "read", "update", "delete", "rsvp"],
            "budget_items": ["create", "read", "update", "delete"],
            "vendors": ["create", "read", "update", "delete"],
            "tasks": ["create", "read", "update", "delete"],
            "wedding_settings": ["read", "update"],
            "countdown": ["read"],
        },
        Role.PARTNER: {
            "guests": ["create", "read", "update", "rsvp"],
            "budget_items": ["create", "read", "update"],
            "vendors": ["create", "read", "update"],
            "tasks": ["create", "read", "update"],
            "wedding_settings": ["read", "update"],
            "countdown": ["read"],
        },
        Role.GUEST: {
            "guests": ["read", "rsvp"],
            "countdown": ["read"],
        },
    }

    CORE_DATA = ["guests", "budget_items", "vendors", "wedding_settings"]

    @classmethod
    def has_permission(cls, role: Role, resource: str, action: str) -> bool:
        if role not in cls.ROLE_PERMISSIONS:
            return False
        permissions = cls.ROLE_PERMISSIONS.get(role, {})
        resource_perms = permissions.get(resource, [])
        return action in resource_perms

    @classmethod
    def can_delete_core(cls, role: Role, resource: str) -> bool:
        if role == Role.PLANNER:
            return True
        return False


_token_model = None


def get_token_model():
    global _token_model
    if _token_model is None:
        _token_model = TokenModel()
    return _token_model


def extract_token_from_request(request: Request) -> Optional[str]:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.query_params.get("token")
    if not token:
        token = request.cookies.get("auth_token")
    return token


def get_role_from_request(request: Request) -> Optional[Role]:
    token = extract_token_from_request(request)
    if not token:
        return None

    token_model = get_token_model()
    user = token_model.get_user_by_token(token)

    if not user or user.get('status') != 1:
        return None

    role_str = user.get('role', 'guest')
    try:
        return Role(role_str)
    except ValueError:
        return Role.GUEST


def get_user_from_request(request: Request) -> Optional[Dict[str, Any]]:
    token = extract_token_from_request(request)
    if not token:
        return None

    token_model = get_token_model()
    user = token_model.get_user_by_token(token)

    if not user or user.get('status') != 1:
        return None

    return user


def require_role(role: Role, resource: str, action: str):
    def decorator(func):
        import functools
        import inspect

        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            current_role = get_role_from_request(request) if request else None
            if current_role is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "code": 401,
                        "message": "请先登录",
                        "data": None
                    }
                )
            if not RolePermission.has_permission(current_role, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": 403,
                        "message": f"当前角色({current_role.value})无权限执行此操作",
                        "data": None
                    }
                )
            if inspect.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        return wrapper
    return decorator


def check_delete_permission(request: Request, resource: str) -> Dict[str, Any]:
    role = get_role_from_request(request)
    if role is None:
        return {
            "allowed": False,
            "message": "请先登录"
        }
    if not RolePermission.can_delete_core(role, resource):
        return {
            "allowed": False,
            "message": f"角色({role.value})不可删除核心数据，仅策划师可删除"
        }
    return {"allowed": True, "message": "ok"}
