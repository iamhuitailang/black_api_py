from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class BuyPartRequest(BaseModel):
    part_id: int = Field(..., description="零件ID")


class SellPartRequest(BaseModel):
    user_part_id: int = Field(..., description="用户零件ID")
    quantity: int = Field(..., description="出售数量")


class ScPartController:
    def __init__(self):
        from app.business.sc.sc_part_business import ScPartBusiness
        self.part_business = ScPartBusiness()

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

    def ActionScPartListGet(self, request: Request, page: int = Query(1, description="页码"),
                            page_size: int = Query(20, description="每页数量"),
                            part_type: Optional[str] = Query(None, description="零件类型")):
        """
        获取零件列表接口
        GET /api/sc/part/list/get
        分页获取所有零件，可按类型筛选
        """
        return self.part_business.get_all_parts(
            page=page,
            page_size=page_size,
            part_type=part_type
        )

    def ActionScPartDetailGet(self, request: Request, part_id: int = Query(..., description="零件ID")):
        """
        获取零件详情接口
        GET /api/sc/part/detail/get
        根据零件ID获取详情
        """
        return self.part_business.get_part_detail(part_id=part_id)

    def ActionScPartBuyPost(self, request: Request, body: BuyPartRequest,
                            authorization: Optional[str] = Header(None)):
        """
        购买零件接口
        POST /api/sc/part/buy
        用户购买零件，需要登录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.part_business.buy_part(
            user_id=user.get('id'),
            part_id=body.part_id
        )

    def ActionScPartUserListGet(self, request: Request, page: int = Query(1, description="页码"),
                                page_size: int = Query(20, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取用户零件列表接口
        GET /api/sc/part/user/list/get
        获取当前用户拥有的零件，需要登录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0
                }
            }

        return self.part_business.get_user_parts(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionScPartSellPost(self, request: Request, body: SellPartRequest,
                             authorization: Optional[str] = Header(None)):
        """
        出售零件接口
        POST /api/sc/part/sell
        用户出售零件，需要登录
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.part_business.sell_part(
            user_id=user.get('id'),
            user_part_id=body.user_part_id,
            quantity=body.quantity
        )
