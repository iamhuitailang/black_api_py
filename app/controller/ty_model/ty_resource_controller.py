from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BuyResourceRequest(BaseModel):
    resource_id: int = Field(..., description="资源ID")
    quantity: int = Field(1, description="购买数量")


class UseResourceRequest(BaseModel):
    resource_id: int = Field(..., description="资源ID")
    quantity: int = Field(1, description="使用数量")


class TyResourceController:
    def __init__(self):
        from app.business.ty_model.resource_business import TyResourceBusiness
        self.resource_business = TyResourceBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.ty_model.auth_business import TyAuthBusiness
        auth_business = TyAuthBusiness()
        return auth_business.verify_token(token)

    def ActionTyResourceListGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(20, description="每页数量"),
                                 resource_type: Optional[str] = Query(None, description="资源类型"),
                                 rarity: Optional[int] = Query(None, description="稀有度")):
        """
        获取资源商店列表接口
        GET /api/ty/resource/list
        分页获取可购买的资源列表
        """
        return self.resource_business.get_all_resources(page, page_size, resource_type, rarity)

    def ActionTyResourceMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我的资源列表接口
        GET /api/ty/resource/my/list
        分页获取当前用户的资源列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resource_business.get_user_resources(user.get('id'), page, page_size)

    def ActionTyResourceBuyPost(self, request: Request, body: BuyResourceRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        购买资源接口
        POST /api/ty/resource/buy
        消耗金币购买资源
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resource_business.buy_resource(
            user_id=user.get('id'),
            resource_id=body.resource_id,
            quantity=body.quantity
        )

    def ActionTyResourceUsePost(self, request: Request, body: UseResourceRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        使用资源接口
        POST /api/ty/resource/use
        使用指定数量的资源
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.resource_business.use_resource(
            user_id=user.get('id'),
            resource_id=body.resource_id,
            quantity=body.quantity
        )
