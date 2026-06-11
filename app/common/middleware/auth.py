from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.business.auth import AuthBusiness

auth_business = AuthBusiness()

EXCLUDED_PATHS = ("/docs", "/redoc", "/openapi.json", "/health", "/static/")
EXCLUDED_PREFIXES = ("/api/auth/",)


class AuthMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")

        if scope.get("method") == "OPTIONS":
            await self.app(scope, receive, send)
            return

        for excluded in EXCLUDED_PATHS:
            if path == excluded or path.startswith(excluded):
                await self.app(scope, receive, send)
                return

        for prefix in EXCLUDED_PREFIXES:
            if path.startswith(prefix):
                await self.app(scope, receive, send)
                return

        if path.startswith("/api/"):
            headers = dict(
                (k.decode("latin-1"), v.decode("latin-1"))
                for k, v in scope.get("headers", [])
            )
            authorization = headers.get("authorization", "")
            token = None
            if authorization.startswith("Bearer "):
                token = authorization[7:]

            if not token or not auth_business.verify_token(token):
                response = JSONResponse(
                    status_code=401,
                    content={"code": 401, "message": "请先登录", "data": None},
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
