from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ItemCreateRequest(BaseModel):
    name: str = Field(..., description="道具名称")
    item_type: str = Field(..., description="道具类型")
    price: int = Field(..., description="价格")
    description: Optional[str] = Field(None, description="描述")
    effect: Optional[str] = Field(None, description="效果")


class ItemUpdateRequest(BaseModel):
    item_id: int = Field(..., description="道具ID")
    name: Optional[str] = Field(None, description="道具名称")
    item_type: Optional[str] = Field(None, description="道具类型")
    price: Optional[int] = Field(None, description="价格")
    description: Optional[str] = Field(None, description="描述")
    effect: Optional[str] = Field(None, description="效果")


class ItemDeleteRequest(BaseModel):
    item_id: int = Field(..., description="道具ID")


class DafuwengItemController:
    def __init__(self):
        from app.business.dafuweng.item_business import ItemBusiness
        self.item_business = ItemBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_admin(self, token):
        from app.business.dafuweng.admin_business import DafuwengAdminBusiness
        business = DafuwengAdminBusiness()
        admin = business.verify_token(token)
        if not admin:
            return {'code': 1, 'msg': '管理员未登录', 'data': None}
        return None

    def ActionDafuwengItemListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        return self.item_business.get_all_items()

    def ActionDafuwengItemDetailGet(self, request: Request, item_id: int = Query(..., description="道具ID")):
        return self.item_business.get_item_by_id(item_id=item_id)

    def ActionDafuwengItemCreatePost(self, request: Request, body: ItemCreateRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.item_business.create_item(
            data={'name': body.name, 'item_type': body.item_type, 'price': body.price, 'description': body.description, 'effect': body.effect}
        )

    def ActionDafuwengItemUpdatePost(self, request: Request, body: ItemUpdateRequest,
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.item_type is not None:
            data['item_type'] = body.item_type
        if body.price is not None:
            data['price'] = body.price
        if body.description is not None:
            data['description'] = body.description
        if body.effect is not None:
            data['effect'] = body.effect

        return self.item_business.update_item(
            item_id=body.item_id,
            data=data
        )

    def ActionDafuwengItemDeleteDelete(self, request: Request, body: ItemDeleteRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.item_business.delete_item(item_id=body.item_id)

    def ActionDafuwengItemResetPost(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        verify = self._verify_admin(token)
        if verify:
            return verify

        return self.item_business.reset_items()
