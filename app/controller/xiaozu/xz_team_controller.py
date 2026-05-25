from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTeamRequest(BaseModel):
    name: str = Field(..., description="小组名称")
    description: Optional[str] = Field(None, description="小组描述")


class UpdateTeamRequest(BaseModel):
    name: Optional[str] = Field(None, description="小组名称")
    description: Optional[str] = Field(None, description="小组描述")


class JoinTeamRequest(BaseModel):
    invite_code: str = Field(..., description="邀请码")


class UpdateMemberRoleRequest(BaseModel):
    team_id: int = Field(..., description="小组ID")
    target_user_id: int = Field(..., description="目标用户ID")
    role: str = Field(..., description="角色")


class RemoveMemberRequest(BaseModel):
    team_id: int = Field(..., description="小组ID")
    target_user_id: int = Field(..., description="目标用户ID")


class XzTeamController:
    def __init__(self):
        from app.business.xiaozu.team_business import XzTeamBusiness
        from app.business.xiaozu.member_business import XzMemberBusiness
        self.team_business = XzTeamBusiness()
        self.member_business = XzMemberBusiness()

    def _get_token(self, request: Request, authorization: Optional[str]) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token or ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.xiaozu.auth_business import XzAuthBusiness
        auth = XzAuthBusiness()
        return auth.verify_token(token)

    def ActionXzTeamCreatePost(self, request: Request, body: CreateTeamRequest,
                                authorization: Optional[str] = Header(None)):
        """创建小组"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.create_team(user['id'], body.name, body.description or '')

    def ActionXzTeamDetailGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                               authorization: Optional[str] = Header(None)):
        """获取小组详情"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.get_team(team_id, user['id'])

    def ActionXzTeamUpdatePost(self, request: Request, body: UpdateTeamRequest,
                                authorization: Optional[str] = Header(None)):
        """更新小组信息"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.update_team(
            request.query_params.get('team_id'), user['id'], body.name, body.description
        )

    def ActionXzTeamDeletePost(self, request: Request, authorization: Optional[str] = Header(None)):
        """解散小组"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        team_id = int(request.query_params.get('team_id', 0))
        return self.team_business.delete_team(team_id, user['id'])

    def ActionXzTeamMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """获取我的小组列表"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.get_my_teams(user['id'])

    def ActionXzTeamMembersGet(self, request: Request, team_id: int = Query(..., description="小组ID"),
                                authorization: Optional[str] = Header(None)):
        """获取小组成员列表"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.get_team_members(team_id, user['id'])

    def ActionXzTeamJoinPost(self, request: Request, body: JoinTeamRequest,
                              authorization: Optional[str] = Header(None)):
        """通过邀请码加入小组"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.team_business.join_team_by_code(user['id'], body.invite_code)

    def ActionXzTeamInviteCodeRegeneratePost(self, request: Request,
                                              authorization: Optional[str] = Header(None)):
        """重新生成邀请码"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        team_id = int(request.query_params.get('team_id', 0))
        return self.team_business.regenerate_invite_code(team_id, user['id'])

    def ActionXzTeamMemberRoleUpdatePost(self, request: Request, body: UpdateMemberRoleRequest,
                                          authorization: Optional[str] = Header(None)):
        """更新成员角色"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.member_business.update_role(body.team_id, user['id'], body.target_user_id, body.role)

    def ActionXzTeamMemberRemovePost(self, request: Request, body: RemoveMemberRequest,
                                      authorization: Optional[str] = Header(None)):
        """移除成员/退出小组"""
        token = self._get_token(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.member_business.remove_member(body.team_id, user['id'], body.target_user_id)
