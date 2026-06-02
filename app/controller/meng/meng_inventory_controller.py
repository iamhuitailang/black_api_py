from typing import Optional, List, Dict, Any
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class InventoryAddRequest(BaseModel):
    item_type: str = Field(..., description="物品类型")
    item_subtype: str = Field(..., description="物品子类型")
    quantity: int = Field(1, description="数量", ge=1)
    properties: Optional[Dict[str, Any]] = Field(None, description="物品属性")


class InventoryRemoveRequest(BaseModel):
    item_type: str = Field(..., description="物品类型")
    item_subtype: str = Field(..., description="物品子类型")
    quantity: int = Field(1, description="数量", ge=1)


class InventoryBatchAddRequest(BaseModel):
    items: List[Dict[str, Any]] = Field(..., description="物品列表")


class MengInventoryController:
    def __init__(self):
        from app.business.meng import MengInventoryBusiness, MengUserBusiness
        self.inventory_business = MengInventoryBusiness()
        self.user_business = MengUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionMengInventoryListGet(self, request: Request, item_type: Optional[str] = Query(None, description="物品类型"),
                                   authorization: Optional[str] = Header(None)):
        """
        获取库存列表接口
        GET /api/meng/inventory/list/get
        根据token获取当前用户的库存列表，可按item_type筛选
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.inventory_business.get_inventory(
            user_id=user.get('id'),
            item_type=item_type
        )

    def ActionMengInventoryAddPost(self, request: Request, body: InventoryAddRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        添加物品接口
        POST /api/meng/inventory/add
        向当前用户库存中添加物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.inventory_business.add_item(
            user_id=user.get('id'),
            item_type=body.item_type,
            item_subtype=body.item_subtype,
            quantity=body.quantity,
            properties=body.properties
        )

    def ActionMengInventoryRemovePost(self, request: Request, body: InventoryRemoveRequest,
                                      authorization: Optional[str] = Header(None)):
        """
        移除物品接口
        POST /api/meng/inventory/remove
        从当前用户库存中移除物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.inventory_business.remove_item(
            user_id=user.get('id'),
            item_type=body.item_type,
            item_subtype=body.item_subtype,
            quantity=body.quantity
        )

    def ActionMengInventoryDetailGet(self, request: Request, item_type: str = Query(..., description="物品类型"),
                                     item_subtype: str = Query(..., description="物品子类型"),
                                     authorization: Optional[str] = Header(None)):
        """
        获取物品详情接口
        GET /api/meng/inventory/detail/get
        获取当前用户库存中指定物品的详情
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.inventory_business.get_item(
            user_id=user.get('id'),
            item_type=item_type,
            item_subtype=item_subtype
        )

    def ActionMengInventoryBatchAddPost(self, request: Request, body: InventoryBatchAddRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        批量添加物品接口
        POST /api/meng/inventory/batch/add
        向当前用户库存中批量添加多个物品
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.inventory_business.batch_add_items(
            user_id=user.get('id'),
            items=body.items
        )
