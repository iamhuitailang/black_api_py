from typing import Optional, Dict, Any, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from app.business.meng import MengUserBusiness, MengCreatureBusiness


class CreateCreatureRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    name: str = Field(..., description="生物名称")
    creature_type: str = Field(..., description="生物类型")
    x: float = Field(..., description="X坐标")
    y: float = Field(..., description="Y坐标")
    z: float = Field(..., description="Z坐标")
    behavior: Optional[str] = Field(None, description="行为模式")
    script: Optional[Dict[str, Any]] = Field(None, description="脚本配置")
    properties: Optional[Dict[str, Any]] = Field(None, description="属性配置")


class BatchCreateCreaturesRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    creatures: List[Dict[str, Any]] = Field(..., description="生物列表")


class UpdateCreatureRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    creature_id: int = Field(..., description="生物ID")
    name: Optional[str] = Field(None, description="生物名称")
    creature_type: Optional[str] = Field(None, description="生物类型")
    x: Optional[float] = Field(None, description="X坐标")
    y: Optional[float] = Field(None, description="Y坐标")
    z: Optional[float] = Field(None, description="Z坐标")
    behavior: Optional[str] = Field(None, description="行为模式")
    script: Optional[Dict[str, Any]] = Field(None, description="脚本配置")
    properties: Optional[Dict[str, Any]] = Field(None, description="属性配置")


class MengCreatureController:
    def __init__(self):
        self.user_business = MengUserBusiness()
        self.creature_business = MengCreatureBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengCreatureCreatePost(self, request: Request, body: CreateCreatureRequest, authorization: Optional[str] = Header(None)):
        """
        创建生物
        POST /api/meng/creature/create
        在指定梦境中创建生物
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.create_creature(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            name=body.name,
            creature_type=body.creature_type,
            x=body.x,
            y=body.y,
            z=body.z,
            behavior=body.behavior,
            script=body.script,
            properties=body.properties
        )

    def ActionMengCreatureBatchCreatePost(self, request: Request, body: BatchCreateCreaturesRequest, authorization: Optional[str] = Header(None)):
        """
        批量创建生物
        POST /api/meng/creature/batch/create
        在指定梦境中批量创建多个生物
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.batch_create_creatures(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            creatures=body.creatures
        )

    def ActionMengCreatureListGet(self, request: Request, dream_id: int = Query(..., description="梦境ID"), authorization: Optional[str] = Header(None)):
        """
        获取生物列表
        GET /api/meng/creature/list
        获取指定梦境中的所有生物
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.get_dream_creatures(dream_id=dream_id)

    def ActionMengCreatureDetailGet(self, request: Request, creature_id: int = Query(..., description="生物ID"), authorization: Optional[str] = Header(None)):
        """
        获取生物详情
        GET /api/meng/creature/detail
        获取指定生物的详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.get_creature_detail(creature_id=creature_id)

    def ActionMengCreatureUpdatePost(self, request: Request, body: UpdateCreatureRequest, authorization: Optional[str] = Header(None)):
        """
        更新生物
        POST /api/meng/creature/update
        更新指定生物的属性
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
        if body.creature_type is not None:
            data['creature_type'] = body.creature_type
        if body.x is not None:
            data['x'] = body.x
        if body.y is not None:
            data['y'] = body.y
        if body.z is not None:
            data['z'] = body.z
        if body.behavior is not None:
            data['behavior'] = body.behavior
        if body.script is not None:
            data['script'] = body.script
        if body.properties is not None:
            data['properties'] = body.properties

        return self.creature_business.update_creature(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            creature_id=body.creature_id,
            data=data
        )

    def ActionMengCreatureDeletePost(self, request: Request, dream_id: int, creature_id: int, authorization: Optional[str] = Header(None)):
        """
        删除生物
        POST /api/meng/creature/delete
        从指定梦境中删除指定生物
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.delete_creature(
            user_id=user.get('id'),
            dream_id=dream_id,
            creature_id=creature_id
        )

    def ActionMengCreatureClearPost(self, request: Request, dream_id: int, authorization: Optional[str] = Header(None)):
        """
        清空生物
        POST /api/meng/creature/clear
        清空指定梦境中的所有生物
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.creature_business.clear_dream_creatures(
            user_id=user.get('id'),
            dream_id=dream_id
        )
