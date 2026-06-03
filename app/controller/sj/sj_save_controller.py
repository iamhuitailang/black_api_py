from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateSaveRequest(BaseModel):
    character_id: int = Field(..., description="角色ID")
    save_name: Optional[str] = Field('', description="存档名")


class LoadSaveRequest(BaseModel):
    save_id: int = Field(..., description="存档ID")


class DeleteSaveRequest(BaseModel):
    save_id: int = Field(..., description="存档ID")


class SjSaveController:
    def __init__(self):
        from app.business.sj.save_business import SjSaveBusiness
        self.save_business = SjSaveBusiness()
        from app.business.sj.user_business import SjUserBusiness
        self.user_business = SjUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionSjSaveListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取存档列表
        GET /api/sj/save/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.save_business.get_saves(user.get('id'))

    def ActionSjSaveCreatePost(self, request: Request, body: CreateSaveRequest,
                                authorization: Optional[str] = Header(None)):
        """
        创建存档
        POST /api/sj/save/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.save_business.create_save(
            user_id=user.get('id'),
            character_id=body.character_id,
            save_name=body.save_name or ''
        )

    def ActionSjSaveLoadPost(self, request: Request, body: LoadSaveRequest,
                              authorization: Optional[str] = Header(None)):
        """
        读取存档
        POST /api/sj/save/load
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.save_business.load_save(body.save_id, user.get('id'))

    def ActionSjSaveDeletePost(self, request: Request, body: DeleteSaveRequest,
                                authorization: Optional[str] = Header(None)):
        """
        删除存档
        POST /api/sj/save/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.save_business.delete_save(body.save_id, user.get('id'))
