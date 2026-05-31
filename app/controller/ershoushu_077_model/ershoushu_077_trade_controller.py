from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateTradeRequest(BaseModel):
    book_id: int = Field(..., description="书籍ID")


class CreateReviewRequest(BaseModel):
    trade_id: int = Field(..., description="交易ID")
    rating: int = Field(..., description="评分1-5")
    content: Optional[str] = Field('', description="评价内容")


class ErshoushuTradeController:
    def __init__(self):
        from app.business.ershoushu_077_model.trade_business import ErshoushuTradeBusiness
        from app.business.ershoushu_077_model.review_business import ErshoushuReviewBusiness
        from app.business.ershoushu_077_model.user_business import ErshoushuUserBusiness
        self.trade_business = ErshoushuTradeBusiness()
        self.review_business = ErshoushuReviewBusiness()
        self.user_business = ErshoushuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionErshoushuTradeCreatePost(self, request: Request, body: CreateTradeRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        发起交易接口
        POST /api/ershoushu/trade/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.trade_business.create_trade(user.get('id'), body.book_id)

    def ActionErshoushuTradeConfirmPost(self, request: Request, trade_id: int = Query(..., description="交易ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        确认交易接口
        POST /api/ershoushu/trade/confirm
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.trade_business.confirm_trade(user.get('id'), trade_id)

    def ActionErshoushuTradeCompletePost(self, request: Request, trade_id: int = Query(..., description="交易ID"),
                                          authorization: Optional[str] = Header(None)):
        """
        完成交易接口
        POST /api/ershoushu/trade/complete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.trade_business.complete_trade(user.get('id'), trade_id)

    def ActionErshoushuTradeCancelPost(self, request: Request, trade_id: int = Query(..., description="交易ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        取消交易接口
        POST /api/ershoushu/trade/cancel
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.trade_business.cancel_trade(user.get('id'), trade_id)

    def ActionErshoushuTradeDetailGet(self, request: Request, trade_id: int = Query(..., description="交易ID")):
        """
        获取交易详情接口
        GET /api/ershoushu/trade/detail/get
        """
        return self.trade_business.get_trade_detail(trade_id)

    def ActionErshoushuTradeMyListGet(self, request: Request,
                                       page: int = Query(1, ge=1, description="页码"),
                                       page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                       status: Optional[int] = Query(None, description="状态"),
                                       authorization: Optional[str] = Header(None)):
        """
        获取我的交易列表接口
        GET /api/ershoushu/trade/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.trade_business.get_my_trades(user.get('id'), page, page_size, status)

    def ActionErshoushuTradeAdminListGet(self, request: Request,
                                          page: int = Query(1, ge=1, description="页码"),
                                          page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                          status: Optional[int] = Query(None, description="状态"),
                                          authorization: Optional[str] = Header(None)):
        """
        管理端获取交易列表接口
        GET /api/ershoushu/trade/admin/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        if user.get('role') != 'admin':
            return {'code': 1, 'msg': '无权限', 'data': None}
        return self.trade_business.get_all_trades(page, page_size, status)

    def ActionErshoushuTradeStatisticsGet(self, request: Request):
        """
        获取交易统计接口
        GET /api/ershoushu/trade/statistics/get
        """
        return self.trade_business.get_statistics()

    def ActionErshoushuTradeReviewPost(self, request: Request, body: CreateReviewRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        评价交易接口
        POST /api/ershoushu/trade/review
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.review_business.create_review(
            trade_id=body.trade_id,
            reviewer_id=user.get('id'),
            rating=body.rating,
            content=body.content or ''
        )

    def ActionErshoushuTradeReviewsGet(self, request: Request, trade_id: int = Query(..., description="交易ID")):
        """
        获取交易评价接口
        GET /api/ershoushu/trade/reviews/get
        """
        return self.review_business.get_trade_reviews(trade_id)
