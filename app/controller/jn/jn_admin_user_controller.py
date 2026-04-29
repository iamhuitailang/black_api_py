from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class JnAdminUserController:
    def __init__(self):
        from app.business.jn.user_business import JnUserBusiness
        from app.business.jn.skill_business import JnSkillBusiness
        from app.business.jn.admin_business import JnAdminBusiness
        self.user_business = JnUserBusiness()
        self.skill_business = JnSkillBusiness()
        self.admin_business = JnAdminBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionJnAdminUserListGet(self, request: Request,
                                   page: int = Query(1, description="页码"),
                                   page_size: int = Query(10, description="每页数量"),
                                   status: Optional[int] = Query(None, description="用户状态"),
                                   keyword: Optional[str] = Query(None, description="搜索关键词"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口（管理端）
        GET /api/jn/admin/user/list/get
        管理员查看用户列表
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(
            page=page,
            page_size=page_size,
            status=status,
            keyword=keyword
        )

    def ActionJnAdminUserDetailGet(self, request: Request,
                                     user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户详情接口（管理端）
        GET /api/jn/admin/user/detail/get
        管理员查看用户详情
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_by_id(user_id)

    def ActionJnAdminUserBanPost(self, request: Request,
                                   user_id: int = Query(..., description="用户ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        封号接口（管理端）
        POST /api/jn/admin/user/ban
        管理员封禁用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.ban_user(user_id)

    def ActionJnAdminUserUnbanPost(self, request: Request,
                                     user_id: int = Query(..., description="用户ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        解封接口（管理端）
        POST /api/jn/admin/user/unban
        管理员解封用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.unban_user(user_id)

    def ActionJnAdminUserCreditResetPost(self, request: Request,
                                           user_id: int = Query(..., description="用户ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        重置信用分接口（管理端）
        POST /api/jn/admin/user/credit/reset
        管理员重置用户信用分
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.reset_credit(user_id)

    def ActionJnAdminUserSkillsGet(self, request: Request,
                                     user_id: int = Query(..., description="用户ID"),
                                     skill_type: Optional[str] = Query(None, description="技能类型"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取用户技能列表（管理端）
        GET /api/jn/admin/user/skills/get
        管理员查看用户技能
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.skill_business.get_user_skills(
            user_id=user_id,
            skill_type=skill_type
        )
