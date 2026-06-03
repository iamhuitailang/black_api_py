from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTeamRequest(BaseModel):
    name: str = Field(..., description="团队名称")
    description: Optional[str] = Field('', description="团队描述")
    logo: Optional[str] = Field('', description="团队Logo")


class UpdateTeamRequest(BaseModel):
    team_id: int = Field(..., description="团队ID")
    name: Optional[str] = Field(None, description="团队名称")
    description: Optional[str] = Field(None, description="团队描述")
    logo: Optional[str] = Field(None, description="团队Logo")


class InviteMemberRequest(BaseModel):
    team_id: int = Field(..., description="团队ID")
    invitee_user_id: int = Field(..., description="被邀请用户ID")
    role: str = Field(..., description="角色")


class RemoveMemberRequest(BaseModel):
    team_id: int = Field(..., description="团队ID")
    member_id: int = Field(..., description="成员ID")


class UpdateRoleRequest(BaseModel):
    team_id: int = Field(..., description="团队ID")
    member_id: int = Field(..., description="成员ID")
    new_role: str = Field(..., description="新角色")


class ContributeRequest(BaseModel):
    team_id: int = Field(..., description="团队ID")
    points: int = Field(..., description="贡献点数")


class ScTeamController:
    def __init__(self):
        from app.business.sc.sc_team_business import ScTeamBusiness
        self.team_business = ScTeamBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.sc.sc_user_business import ScUserBusiness
        user_business = ScUserBusiness()
        return user_business.verify_token(token)

    def ActionScTeamCreatePost(self, request: Request, body: CreateTeamRequest,
                                authorization: Optional[str] = Header(None)):
        """
        创建团队接口
        POST /api/sc/team/create
        创建新团队，需要消耗金币
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.create_team(
            user_id=user.get('id'),
            name=body.name,
            description=body.description or '',
            logo=body.logo or ''
        )

    def ActionScTeamDetailGet(self, request: Request, team_id: int = Query(..., description="团队ID")):
        """
        获取团队详情接口
        GET /api/sc/team/detail/get
        根据团队ID获取团队详情和成员列表
        """
        return self.team_business.get_team_detail(team_id)

    def ActionScTeamUserListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取用户团队列表接口
        GET /api/sc/team/user/list/get
        获取当前用户加入的所有团队
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.get_user_teams(user_id=user.get('id'))

    def ActionScTeamUpdatePost(self, request: Request, body: UpdateTeamRequest,
                                authorization: Optional[str] = Header(None)):
        """
        更新团队信息接口
        POST /api/sc/team/update
        只有队长可以修改团队信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.logo is not None:
            data['logo'] = body.logo

        return self.team_business.update_team(
            user_id=user.get('id'),
            team_id=body.team_id,
            data=data
        )

    def ActionScTeamDisbandPost(self, request: Request, body: dict,
                                 authorization: Optional[str] = Header(None)):
        """
        解散团队接口
        POST /api/sc/team/disband
        只有队长可以解散团队
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        team_id = body.get('team_id')
        return self.team_business.disband_team(
            user_id=user.get('id'),
            team_id=team_id
        )

    def ActionScTeamMemberInvitePost(self, request: Request, body: InviteMemberRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        邀请成员接口
        POST /api/sc/team/member/invite
        只有队长可以邀请成员
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.invite_member(
            user_id=user.get('id'),
            team_id=body.team_id,
            invitee_user_id=body.invitee_user_id,
            role=body.role
        )

    def ActionScTeamMemberRemovePost(self, request: Request, body: RemoveMemberRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        移除成员接口
        POST /api/sc/team/member/remove
        只有队长可以移除成员
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.remove_member(
            user_id=user.get('id'),
            team_id=body.team_id,
            member_id=body.member_id
        )

    def ActionScTeamMemberRoleUpdatePost(self, request: Request, body: UpdateRoleRequest,
                                          authorization: Optional[str] = Header(None)):
        """
        更新成员角色接口
        POST /api/sc/team/member/role/update
        只有队长可以修改成员角色
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.update_member_role(
            user_id=user.get('id'),
            team_id=body.team_id,
            member_id=body.member_id,
            new_role=body.new_role
        )

    def ActionScTeamContributePost(self, request: Request, body: ContributeRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        贡献点数接口
        POST /api/sc/team/contribute
        团队成员为团队贡献点数
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.team_business.contribute_points(
            user_id=user.get('id'),
            team_id=body.team_id,
            points=body.points
        )
