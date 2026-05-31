from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class AddCollaboratorRequest(BaseModel):
    username: str = Field(..., description="协作者用户名")
    role: Optional[str] = Field('viewer', description="角色: editor/viewer")


class UpdateRoleRequest(BaseModel):
    role: str = Field(..., description="角色: editor/viewer")


class SiweiCollaborationController:
    def __init__(self):
        from app.business.siwei_077.collaboration_business import SiweiCollaborationBusiness
        from app.business.siwei_077.user_business import SiweiUserBusiness
        self.collab_business = SiweiCollaborationBusiness()
        self.user_business = SiweiUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSiweiCollaboratorAddPost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                         body: AddCollaboratorRequest = None,
                                         authorization: Optional[str] = Header(None)):
        """
        添加协作者接口
        POST /api/siwei/collaborator/add
        邀请其他用户协作编辑思维导图
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}

        search_result = self.collab_business.search_user_by_username(body.username)
        if search_result.get('code') != 0:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        target_user_id = search_result.get('data', {}).get('id')
        return self.collab_business.add_collaborator(
            owner_id=user.get('id'),
            map_id=map_id,
            user_id=target_user_id,
            role=body.role
        )

    def ActionSiweiCollaboratorRemovePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                             user_id: int = Query(..., description="协作者用户ID"),
                                             authorization: Optional[str] = Header(None)):
        """
        移除协作者接口
        POST /api/siwei/collaborator/remove
        移除思维导图的协作者
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.collab_business.remove_collaborator(user.get('id'), map_id, user_id)

    def ActionSiweiCollaboratorRoleUpdatePost(self, request: Request, map_id: int = Query(..., description="导图ID"),
                                                user_id: int = Query(..., description="协作者用户ID"),
                                                body: UpdateRoleRequest = None,
                                                authorization: Optional[str] = Header(None)):
        """
        更新协作者角色接口
        POST /api/siwei/collaborator/role/update
        修改协作者的编辑权限
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.collab_business.update_role(user.get('id'), map_id, user_id, body.role)

    def ActionSiweiCollaboratorListGet(self, request: Request, map_id: int = Query(..., description="导图ID")):
        """
        获取协作者列表接口
        GET /api/siwei/collaborator/list/get
        获取思维导图的所有协作者
        """
        return self.collab_business.get_collaborators(map_id)

    def ActionSiweiUserSearchGet(self, request: Request, username: str = Query(..., description="用户名")):
        """
        搜索用户接口
        GET /api/siwei/user/search/get
        根据用户名搜索用户
        """
        return self.collab_business.search_user_by_username(username)
