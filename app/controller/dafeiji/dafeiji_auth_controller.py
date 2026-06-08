from fastapi import Request, Header
from typing import Optional
from app.business.dafeiji import DafeijiAuthBusiness


class DafeijiAuthController:
    def __init__(self):
        self.auth_business = DafeijiAuthBusiness()

    async def ActionDafeijiAuthRegisterPost(self, request: Request):
        """用户注册"""
        body = await request.json()
        username = body.get('username', '')
        password = body.get('password', '')
        confirm_password = body.get('confirm_password', '')
        return self.auth_business.register(username, password, confirm_password)

    async def ActionDafeijiAuthLoginPost(self, request: Request):
        """用户登录"""
        body = await request.json()
        username = body.get('username', '')
        password = body.get('password', '')
        return self.auth_business.login(username, password)

    async def ActionDafeijiAuthChangePasswordPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """修改密码"""
        token = self._extract_token(authorization)
        if not token:
            return {'code': 1, 'message': '请先登录', 'data': None}

        user_info = self.auth_business.verify_token(token)
        if not user_info:
            return {'code': 1, 'message': 'token无效或已过期', 'data': None}

        body = await request.json()
        old_password = body.get('old_password', '')
        new_password = body.get('new_password', '')
        return self.auth_business.change_password(user_info['user_id'], old_password, new_password)

    async def ActionDafeijiAuthUserInfo(self, authorization: Optional[str] = Header(None)):
        """获取当前用户信息"""
        token = self._extract_token(authorization)
        if not token:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.auth_business.get_current_user(token)

    def _extract_token(self, auth_header: Optional[str]) -> Optional[str]:
        if not auth_header:
            return None
        if auth_header.startswith('Bearer '):
            return auth_header[7:]
        return auth_header
