from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.business.auth import AuthBusiness

auth_business = AuthBusiness()

EXCLUDED_PATHS = ("/docs", "/redoc", "/openapi.json", "/health", "/static/")
EXCLUDED_PREFIXES = ("/api/auth/",)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path

        for excluded in EXCLUDED_PATHS:
            if path == excluded or path.startswith(excluded):
                return await call_next(request)

        for prefix in EXCLUDED_PREFIXES:
            if path.startswith(prefix):
                return await call_next(request)

        if path.startswith("/api/"):
            authorization = request.headers.get("Authorization", "")
            token = None
            if authorization.startswith("Bearer "):
                token = authorization[7:]

            if not token or not auth_business.verify_token(token):
                return JSONResponse(
                    status_code=401,
                    content={"code": 401, "message": "请先登录", "data": None},
                )

        return await call_next(request)
