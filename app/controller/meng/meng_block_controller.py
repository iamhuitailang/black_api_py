from typing import Optional, Dict, Any, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
from app.business.meng import MengUserBusiness, MengBlockBusiness


class PlaceBlockRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    x: int = Field(..., description="X坐标")
    y: int = Field(..., description="Y坐标")
    z: int = Field(..., description="Z坐标")
    block_type: str = Field(..., description="方块类型")
    color: Optional[str] = Field('#ffffff', description="方块颜色，默认#ffffff")
    properties: Optional[Dict[str, Any]] = Field(None, description="方块属性")


class BatchPlaceBlocksRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    blocks: List[Dict[str, Any]] = Field(..., description="方块列表")


class UpdateBlockRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    block_id: int = Field(..., description="方块ID")
    block_type: Optional[str] = Field(None, description="方块类型")
    color: Optional[str] = Field(None, description="方块颜色")
    properties: Optional[Dict[str, Any]] = Field(None, description="方块属性")


class BatchRemoveBlocksRequest(BaseModel):
    dream_id: int = Field(..., description="梦境ID")
    block_ids: List[int] = Field(..., description="方块ID列表")


class MengBlockController:
    def __init__(self):
        self.user_business = MengUserBusiness()
        self.block_business = MengBlockBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengBlockPlacePost(self, request: Request, body: PlaceBlockRequest, authorization: Optional[str] = Header(None)):
        """
        放置方块
        POST /api/meng/block/place
        在指定梦境的指定位置放置方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.place_block(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            x=body.x,
            y=body.y,
            z=body.z,
            block_type=body.block_type,
            color=body.color,
            properties=body.properties
        )

    def ActionMengBlockBatchPlacePost(self, request: Request, body: BatchPlaceBlocksRequest, authorization: Optional[str] = Header(None)):
        """
        批量放置方块
        POST /api/meng/block/batch/place
        在指定梦境中批量放置多个方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.batch_place_blocks(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            blocks=body.blocks
        )

    def ActionMengBlockRemovePost(self, request: Request, dream_id: int, block_id: int, authorization: Optional[str] = Header(None)):
        """
        移除方块
        POST /api/meng/block/remove
        从指定梦境中移除指定方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.remove_block(
            user_id=user.get('id'),
            dream_id=dream_id,
            block_id=block_id
        )

    def ActionMengBlockBatchRemovePost(self, request: Request, body: BatchRemoveBlocksRequest, authorization: Optional[str] = Header(None)):
        """
        批量移除方块
        POST /api/meng/block/batch/remove
        从指定梦境中批量移除多个方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.batch_remove_blocks(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            block_ids=body.block_ids
        )

    def ActionMengBlockListGet(self, request: Request, dream_id: int = Query(..., description="梦境ID"), authorization: Optional[str] = Header(None)):
        """
        获取梦境方块列表
        GET /api/meng/block/list
        获取指定梦境中的所有方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.get_dream_blocks(dream_id=dream_id)

    def ActionMengBlockUpdatePost(self, request: Request, body: UpdateBlockRequest, authorization: Optional[str] = Header(None)):
        """
        更新方块
        POST /api/meng/block/update
        更新指定方块的属性
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
        if body.block_type is not None:
            data['block_type'] = body.block_type
        if body.color is not None:
            data['color'] = body.color
        if body.properties is not None:
            data['properties'] = body.properties

        return self.block_business.update_block(
            user_id=user.get('id'),
            dream_id=body.dream_id,
            block_id=body.block_id,
            data=data
        )

    def ActionMengBlockClearPost(self, request: Request, dream_id: int, authorization: Optional[str] = Header(None)):
        """
        清空方块
        POST /api/meng/block/clear
        清空指定梦境中的所有方块
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.block_business.clear_dream_blocks(
            user_id=user.get('id'),
            dream_id=dream_id
        )
