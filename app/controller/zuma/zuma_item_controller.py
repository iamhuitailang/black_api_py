from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BuyItemRequest(BaseModel):
    item_type: str = Field(..., description="道具类型")
    quantity: Optional[int] = Field(1, description="购买数量")


class UseItemRequest(BaseModel):
    item_type: str = Field(..., description="道具类型")


class ZumaItemController:
    def __init__(self):
        from app.business.zuma.item_business import ZumaItemBusiness
        from app.business.zuma.user_business import ZumaUserBusiness
        self.item_business = ZumaItemBusiness()
        self.user_business = ZumaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionZumaItemAllGet(self, request: Request):
        """
        获取所有道具列表接口
        GET /api/zuma/item/all
        获取所有可购买的道具信息
        """
        return self.item_business.get_all_items()

    def ActionZumaItemMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的道具接口
        GET /api/zuma/item/my
        获取当前用户拥有的道具
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.item_business.get_user_items(user.get('id'))

    def ActionZumaItemBuyPost(self, request: Request, body: BuyItemRequest,
                              authorization: Optional[str] = Header(None)):
        """
        购买道具接口
        POST /api/zuma/item/buy
        使用金币购买道具
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.item_business.buy_item(
            user_id=user.get('id'),
            item_type=body.item_type,
            quantity=body.quantity
        )

    def ActionZumaItemUsePost(self, request: Request, body: UseItemRequest,
                              authorization: Optional[str] = Header(None)):
        """
        使用道具接口
        POST /api/zuma/item/use
        使用一个道具
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.item_business.use_item(
            user_id=user.get('id'),
            item_type=body.item_type
        )
