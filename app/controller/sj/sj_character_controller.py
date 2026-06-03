from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCharacterRequest(BaseModel):
    name: str = Field(..., description="角色名")
    class_type: str = Field(..., description="职业类型: warrior/mage/thief")


class UpdateCharacterRequest(BaseModel):
    name: Optional[str] = Field(None, description="角色名")


class SjCharacterController:
    def __init__(self):
        from app.business.sj.character_business import SjCharacterBusiness
        self.character_business = SjCharacterBusiness()
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

    def ActionSjCharacterClassesGet(self, request: Request):
        """
        获取职业列表
        GET /api/sj/character/classes/get
        """
        return self.character_business.get_classes()

    def ActionSjCharacterListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取角色列表
        GET /api/sj/character/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.character_business.get_characters(user.get('id'))

    def ActionSjCharacterCreatePost(self, request: Request, body: CreateCharacterRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建角色
        POST /api/sj/character/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.character_business.create_character(
            user_id=user.get('id'),
            name=body.name,
            class_type=body.class_type
        )

    def ActionSjCharacterDetailGet(self, request: Request, character_id: int = Query(..., description="角色ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取角色详情
        GET /api/sj/character/detail/get
        """
        return self.character_business.get_character(character_id)

    def ActionSjCharacterDeletePost(self, request: Request, character_id: int = Query(..., description="角色ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除角色
        POST /api/sj/character/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.character_business.delete_character(character_id, user.get('id'))

    def ActionSjCharacterTimeAbilitiesGet(self, request: Request,
                                           character_id: int = Query(..., description="角色ID"),
                                           authorization: Optional[str] = Header(None)):
        """
        获取角色时间能力
        GET /api/sj/character/time/abilities/get
        """
        return self.character_business.get_time_abilities(character_id)
