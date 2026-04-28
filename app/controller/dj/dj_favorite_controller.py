from typing import Optional
from fastapi import APIRouter, Query, Request, Header
from pydantic import BaseModel, Field
from app.business.dj import DjFavoriteBusiness, DjCheckinBusiness, DjAuthBusiness


class ToggleFavoriteRequest(BaseModel):
    market_id: int = Field(..., description="集市ID")


class CheckinRequest(BaseModel):
    market_id: int = Field(..., description="集市ID")


class DjFavoriteController:
    def __init__(self):
        self.favorite_business = DjFavoriteBusiness()
        self.checkin_business = DjCheckinBusiness()
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

    def ActionDjFavoriteTogglePost(self, request: Request, body: ToggleFavoriteRequest, authorization: Optional[str] = Header(None)):
        """
        切换收藏接口
        POST /api/dj/favorite/toggle
        收藏或取消收藏集市
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.toggle_favorite(user.get('id'), body.market_id)

    def ActionDjFavoriteListGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取收藏列表接口
        GET /api/dj/favorite/list
        获取当前用户的收藏列表
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.get_user_favorites(user.get('id'))

    def ActionDjFavoriteCheckGet(self, request: Request, market_id: int = Query(..., description="集市ID"), authorization: Optional[str] = Header(None)):
        """
        检查是否收藏接口
        GET /api/dj/favorite/check
        检查当前用户是否已收藏某集市
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.is_favorited(user.get('id'), market_id)

    def ActionDjFavoriteRemovePost(self, request: Request, body: ToggleFavoriteRequest, authorization: Optional[str] = Header(None)):
        """
        取消收藏接口
        POST /api/dj/favorite/remove
        取消收藏集市
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.remove_favorite(user.get('id'), body.market_id)

    def ActionDjCheckinPost(self, request: Request, body: CheckinRequest, authorization: Optional[str] = Header(None)):
        """
        打卡接口
        POST /api/dj/checkin
        用户在集市打卡
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.checkin(user.get('id'), body.market_id)

    def ActionDjCheckinListGet(self, request: Request, limit: int = Query(20, description="数量"), authorization: Optional[str] = Header(None)):
        """
        获取打卡记录接口
        GET /api/dj/checkin/list
        获取当前用户的打卡记录
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.get_user_checkins(user.get('id'), limit)

    def ActionDjCheckinStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取打卡统计接口
        GET /api/dj/checkin/statistics
        获取当前用户的打卡统计
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.get_checkin_statistics(user.get('id'))

    def ActionDjCheckinTodayGet(self, request: Request, market_id: int = Query(..., description="集市ID"), authorization: Optional[str] = Header(None)):
        """
        检查今日是否打卡接口
        GET /api/dj/checkin/today
        检查当前用户今日是否已在某集市打卡
        """
        user = self._verify_auth(request, authorization)
        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.checkin_business.has_checked_in_today(user.get('id'), market_id)
