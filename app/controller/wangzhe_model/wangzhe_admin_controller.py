from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    nickname: Optional[str] = Field(None, description="昵称")


class ChangeAdminPasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class WangzheAdminController:
    def __init__(self):
        from app.business.wangzhe_model.admin_business import WangzheAdminBusiness
        from app.business.wangzhe_model.user_business import WangzheUserBusiness
        from app.business.wangzhe_model.hero_business import WangzheHeroBusiness
        from app.business.wangzhe_model.equipment_business import WangzheEquipmentBusiness
        from app.business.wangzhe_model.game_business import WangzheGameBusiness
        from app.business.wangzhe_model.achievement_business import WangzheAchievementBusiness
        self.admin_business = WangzheAdminBusiness()
        self.user_business = WangzheUserBusiness()
        self.hero_business = WangzheHeroBusiness()
        self.equipment_business = WangzheEquipmentBusiness()
        self.game_business = WangzheGameBusiness()
        self.achievement_business = WangzheAchievementBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionWangzheAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """
        管理员登录接口
        POST /api/wangzhe/admin/login
        管理员用户名密码登录
        """
        return self.admin_business.login(
            username=body.username,
            password=body.password
        )

    def ActionWangzheAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        管理员登出接口
        POST /api/wangzhe/admin/logout
        使当前token失效
        """
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionWangzheAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取当前管理员信息接口
        GET /api/wangzhe/admin/current/get
        根据token获取当前登录管理员信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': admin
        }

    def ActionWangzheAdminPasswordChangePost(self, request: Request, body: ChangeAdminPasswordRequest,
                                             authorization: Optional[str] = Header(None)):
        """
        修改管理员密码接口
        POST /api/wangzhe/admin/password/change
        验证原密码后修改为新密码
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionWangzheAdminUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(10, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       keyword: Optional[str] = Query(None, description="关键词"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取用户列表接口
        GET /api/wangzhe/admin/user/list/get
        分页获取所有用户信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.get_user_list(page, page_size, status, keyword)

    def ActionWangzheAdminUserStatusUpdatePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                                status: int = Query(..., description="状态"),
                                                authorization: Optional[str] = Header(None)):
        """
        更新用户状态接口
        POST /api/wangzhe/admin/user/status/update
        封禁、解封用户等
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.update_user_status(user_id, status)

    def ActionWangzheAdminUserDeletePost(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        删除用户接口
        POST /api/wangzhe/admin/user/delete
        删除指定用户
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.user_business.delete_user(user_id)

    def ActionWangzheAdminHeroListGet(self, request: Request, page: int = Query(1, description="页码"),
                                       page_size: int = Query(20, description="每页数量"),
                                       position: Optional[str] = Query(None, description="位置"),
                                       difficulty: Optional[str] = Query(None, description="难度"),
                                       keyword: Optional[str] = Query(None, description="关键词"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取英雄列表接口（管理员）
        GET /api/wangzhe/admin/hero/list/get
        分页获取所有英雄信息
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.hero_business.get_admin_hero_list(page, page_size, position, difficulty, keyword, status)

    def ActionWangzheAdminStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取数据统计接口
        GET /api/wangzhe/admin/statistics/get
        获取游戏统计数据
        """
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.game_business.get_game_statistics()
