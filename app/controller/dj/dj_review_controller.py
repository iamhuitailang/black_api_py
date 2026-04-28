from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjReviewBusiness, DjAuthBusiness


class CreateReviewRequest(BaseModel):
    market_id: Optional[int] = Field(None, description="集市ID")
    booth_id: Optional[int] = Field(None, description="摊位ID")
    item_name: Optional[str] = Field(None, description="物品名称")
    rating: int = Field(..., description="评分 1-5")
    content: Optional[str] = Field(None, description="评价内容")
    images: Optional[str] = Field(None, description="评价图片JSON")


class ReplyReviewRequest(BaseModel):
    review_id: int = Field(..., description="评价ID")
    reply_content: str = Field(..., description="回复内容")
    reply_images: Optional[str] = Field(None, description="回复图片JSON")


class UpdateReviewStatusRequest(BaseModel):
    review_id: int = Field(..., description="评价ID")
    status: int = Field(..., description="状态 1正常/2已回复")


class DjReviewController:
    def __init__(self):
        self.review_business = DjReviewBusiness()
        self.auth_business = DjAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _verify_auth(self, request: Request, authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return None
        return user

    def ActionDjReviewCreatePost(self, request: Request, body: CreateReviewRequest, authorization: Optional[str] = Header(None)):
        """
        创建评价接口
        POST /api/dj/review/create
        用户对集市或摊位进行评价
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {
            'market_id': body.market_id,
            'booth_id': body.booth_id,
            'item_name': body.item_name,
            'rating': body.rating,
            'content': body.content,
            'images': body.images
        }

        return self.review_business.create_review(user.get('id'), data)

    def ActionDjReviewDetailGet(self, request: Request, review_id: int = Query(..., description="评价ID")):
        """
        获取评价详情接口
        GET /api/dj/review/detail
        获取评价详情
        """
        return self.review_business.get_review_detail(review_id)

    def ActionDjReviewMarketGet(self, request: Request, market_id: int = Query(..., description="集市ID"), page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量")):
        """
        获取集市评价列表接口
        GET /api/dj/review/market
        获取集市的评价列表
        """
        return self.review_business.get_market_reviews(market_id, page, page_size)

    def ActionDjReviewBoothGet(self, request: Request, booth_id: int = Query(..., description="摊位ID"), page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量")):
        """
        获取摊位评价列表接口
        GET /api/dj/review/booth
        获取摊位的评价列表
        """
        return self.review_business.get_booth_reviews(booth_id, page, page_size)

    def ActionDjReviewMyGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取我的评价接口
        GET /api/dj/review/my
        获取当前用户的评价列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_user_reviews(user.get('id'))

    def ActionDjReviewReplyPost(self, request: Request, body: ReplyReviewRequest, authorization: Optional[str] = Header(None)):
        """
        回复评价接口
        POST /api/dj/review/reply
        回复用户评价
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.reply_review(body.review_id, body.reply_content, body.reply_images)

    def ActionDjReviewStatusUpdatePost(self, request: Request, body: UpdateReviewStatusRequest, authorization: Optional[str] = Header(None)):
        """
        更新评价状态接口
        POST /api/dj/review/status/update
        更新评价状态
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.update_status(body.review_id, body.status)

    def ActionDjReviewDeletePost(self, request: Request, review_id: int = Query(..., description="评价ID"), authorization: Optional[str] = Header(None)):
        """
        删除评价接口
        POST /api/dj/review/delete
        删除评价
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.delete_review(review_id, user.get('id'))

    def ActionDjReviewListGet(self, request: Request, page: int = Query(1, description="页码"), page_size: int = Query(10, description="每页数量"), status: Optional[int] = Query(None, description="状态"), authorization: Optional[str] = Header(None)):
        """
        获取所有评价列表接口
        GET /api/dj/review/list
        分页获取所有评价列表（管理端使用）
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_all_reviews(page, page_size, status)

    def ActionDjReviewStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取评价统计接口
        GET /api/dj/review/statistics
        获取评价统计数据
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.review_business.get_statistics()
