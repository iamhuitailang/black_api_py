from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")


class AdminChangePasswordRequest(BaseModel):
    old_password: str = Field(..., description="原密码")
    new_password: str = Field(..., description="新密码")


class CreateAdminRequest(BaseModel):
    username: str = Field(..., description="用户名")
    password: str = Field(..., description="密码")
    real_name: Optional[str] = Field(None, description="真实姓名")


class XiangqiAdminController:
    def __init__(self):
        from app.business.xiangqi077_model.admin_business import XiangqiAdminBusiness
        from app.business.xiangqi077_model.user_business import XiangqiUserBusiness
        from app.business.xiangqi077_model.game_business import XiangqiGameBusiness
        from app.business.xiangqi077_model.stats_business import XiangqiStatsBusiness
        self.admin_business = XiangqiAdminBusiness()
        self.user_business = XiangqiUserBusiness()
        self.game_business = XiangqiGameBusiness()
        self.stats_business = XiangqiStatsBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_admin(self, token: str) -> Optional[dict]:
        return self.admin_business.verify_token(token)

    def ActionXiangqiAdminLoginPost(self, request: Request, body: AdminLoginRequest):
        """管理员登录"""
        return self.admin_business.login(username=body.username, password=body.password)

    def ActionXiangqiAdminLogoutPost(self, request: Request, authorization: Optional[str] = Header(None)):
        """管理员登出"""
        token = self._get_token_from_header(request, authorization)
        return self.admin_business.logout(token)

    def ActionXiangqiAdminCurrentGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """获取当前管理员信息"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.get_current_admin(token)

    def ActionXiangqiAdminPasswordChangePost(self, request: Request, body: AdminChangePasswordRequest,
                                              authorization: Optional[str] = Header(None)):
        """修改管理员密码"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.change_password(
            admin_id=admin.get('id'),
            old_password=body.old_password,
            new_password=body.new_password
        )

    def ActionXiangqiAdminCreatePost(self, request: Request, body: CreateAdminRequest,
                                      authorization: Optional[str] = Header(None)):
        """创建管理员"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if admin.get('username') != 'admin':
            return {'code': 1, 'msg': '只有超级管理员可以创建管理员', 'data': None}
        return self.admin_business.create_admin(
            username=body.username,
            password=body.password,
            real_name=body.real_name or ''
        )

    def ActionXiangqiAdminListGet(self, request: Request,
                                   page: int = Query(1, ge=1),
                                   page_size: int = Query(10, ge=1, le=100),
                                   authorization: Optional[str] = Header(None)):
        """管理员列表"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.admin_business.get_admin_list(page=page, page_size=page_size)

    def ActionXiangqiAdminDeletePost(self, request: Request, admin_id: int = Query(...),
                                      authorization: Optional[str] = Header(None)):
        """删除管理员"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if admin.get('username') != 'admin':
            return {'code': 1, 'msg': '只有超级管理员可以删除管理员', 'data': None}
        return self.admin_business.delete_admin(admin_id=admin_id)

    def ActionXiangqiAdminUserListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       status: Optional[int] = Query(None),
                                       keyword: Optional[str] = Query(None),
                                       authorization: Optional[str] = Header(None)):
        """获取用户列表"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.get_user_list(
            page=page, page_size=page_size, status=status, keyword=keyword
        )

    def ActionXiangqiAdminUserMutePost(self, request: Request, user_id: int = Query(...),
                                        authorization: Optional[str] = Header(None)):
        """禁言用户"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.mute_user(user_id=user_id)

    def ActionXiangqiAdminUserBanPost(self, request: Request, user_id: int = Query(...),
                                       authorization: Optional[str] = Header(None)):
        """封号用户"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.ban_user(user_id=user_id)

    def ActionXiangqiAdminUserUnbanPost(self, request: Request, user_id: int = Query(...),
                                         authorization: Optional[str] = Header(None)):
        """解封用户"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.unban_user(user_id=user_id)

    def ActionXiangqiAdminUserDeletePost(self, request: Request, user_id: int = Query(...),
                                          authorization: Optional[str] = Header(None)):
        """删除用户"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.user_business.delete_user(user_id=user_id)

    def ActionXiangqiAdminGameListGet(self, request: Request,
                                       page: int = Query(1, ge=1),
                                       page_size: int = Query(10, ge=1, le=100),
                                       game_type: Optional[int] = Query(None),
                                       status: Optional[int] = Query(None),
                                       authorization: Optional[str] = Header(None)):
        """获取对局列表"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.game_business.get_all_games(
            page=page, page_size=page_size, game_type=game_type, status=status
        )

    def ActionXiangqiAdminDashboardGet(self, request: Request,
                                        authorization: Optional[str] = Header(None)):
        """管理后台仪表盘数据"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_dashboard_stats()

    def ActionXiangqiAdminTopPlayersGet(self, request: Request,
                                         limit: int = Query(10, ge=1, le=100),
                                         authorization: Optional[str] = Header(None)):
        """获取排行榜Top玩家"""
        token = self._get_token_from_header(request, authorization)
        admin = self._get_current_admin(token)
        if not admin:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.stats_business.get_top_players(limit=limit)
