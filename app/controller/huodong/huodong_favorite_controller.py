from typing import Optional
from fastapi import Request, Header, Query


class HuodongFavoriteController:
    def __init__(self):
        from app.business.huodong.favorite_business import FavoriteBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.favorite_business = FavoriteBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongFavoriteTogglePost(self, request: Request,
                                         activity_id: int = Query(..., description="活动ID"),
                                         authorization: Optional[str] = Header(None)):
        """
        切换收藏状态
        POST /api/huodong/favorite/toggle
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.favorite_business.toggle_favorite(user.get('id'), activity_id)

    def ActionHuodongFavoriteStatusGet(self, request: Request,
                                        activity_id: int = Query(..., description="活动ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        查询收藏状态
        GET /api/huodong/favorite/status/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.favorite_business.is_favorited(user.get('id'), activity_id)

    def ActionHuodongFavoriteMyListGet(self, request: Request,
                                        page: int = Query(1, ge=1),
                                        page_size: int = Query(10, ge=1, le=100),
                                        authorization: Optional[str] = Header(None)):
        """
        获取我的收藏列表
        GET /api/huodong/favorite/my/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.favorite_business.get_my_favorites(user.get('id'), page, page_size)
