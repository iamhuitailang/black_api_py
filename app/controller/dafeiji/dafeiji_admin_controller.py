from fastapi import Request, Header
from typing import Optional
from app.business.dafeiji import AdminBusiness, DafeijiAuthBusiness


class DafeijiAdminController:
    def __init__(self):
        self.admin_business = AdminBusiness()
        self.auth_business = DafeijiAuthBusiness()

    async def ActionDafeijiAdminUsers(self, page: int = 1, page_size: int = 20, authorization: Optional[str] = Header(None)):
        """获取用户列表"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        return self.admin_business.get_users(user_info['role'], page, page_size)

    async def ActionDafeijiAdminUserStatusPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """更新用户状态"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        user_id = body.get('user_id', 0)
        status = body.get('status', 1)
        return self.admin_business.update_user_status(user_info['role'], user_id, status)

    async def ActionDafeijiAdminUserRolePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """更新用户角色"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        user_id = body.get('user_id', 0)
        role = body.get('role', 'user')
        return self.admin_business.update_user_role(user_info['role'], user_id, role)

    async def ActionDafeijiAdminUserDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """删除用户"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        user_id = body.get('user_id', 0)
        return self.admin_business.delete_user(user_info['role'], user_id)

    async def ActionDafeijiAdminPlanes(self, authorization: Optional[str] = Header(None)):
        """获取飞机列表"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        return self.admin_business.get_planes(user_info['role'])

    async def ActionDafeijiAdminPlaneCreatePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """创建飞机"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        return self.admin_business.create_plane(user_info['role'], body)

    async def ActionDafeijiAdminPlaneUpdatePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """更新飞机"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        plane_id = body.get('id', 0)
        data = {k: v for k, v in body.items() if k != 'id'}
        return self.admin_business.update_plane(user_info['role'], plane_id, data)

    async def ActionDafeijiAdminPlaneDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """删除飞机"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        plane_id = body.get('id', 0)
        return self.admin_business.delete_plane(user_info['role'], plane_id)

    async def ActionDafeijiAdminWaves(self, page: int = 1, page_size: int = 20, authorization: Optional[str] = Header(None)):
        """获取波次列表"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        return self.admin_business.get_waves(user_info['role'], page, page_size)

    async def ActionDafeijiAdminWaveCreatePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """创建波次"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        return self.admin_business.create_wave(user_info['role'], body)

    async def ActionDafeijiAdminWaveUpdatePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """更新波次"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        wave_id = body.get('id', 0)
        data = {k: v for k, v in body.items() if k != 'id'}
        return self.admin_business.update_wave(user_info['role'], wave_id, data)

    async def ActionDafeijiAdminWaveDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """删除波次"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        body = await request.json()
        wave_id = body.get('id', 0)
        return self.admin_business.delete_wave(user_info['role'], wave_id)

    async def ActionDafeijiAdminStatistics(self, authorization: Optional[str] = Header(None)):
        """获取数据统计"""
        user_info = self._verify_admin(authorization)
        if not user_info:
            return {'code': 1, 'message': '无权限访问', 'data': None}
        return self.admin_business.get_statistics(user_info['role'])

    def _verify_admin(self, authorization: Optional[str]) -> Optional[dict]:
        if not authorization:
            return None
        token = authorization[7:] if authorization.startswith('Bearer ') else authorization
        user_info = self.auth_business.verify_token(token)
        if not user_info or user_info.get('role') != 'admin':
            return None
        return user_info
