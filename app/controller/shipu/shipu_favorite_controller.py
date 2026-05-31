from typing import Optional
from fastapi import Request, Header, Query


class ShipuFavoriteController:
    def __init__(self):
        from app.business.shipu.favorite_business import ShipuFavoriteBusiness
        from app.business.shipu.user_business import ShipuUserBusiness
        self.favorite_business = ShipuFavoriteBusiness()
        self.user_business = ShipuUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShipuFavoriteTogglePost(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        切换收藏状态接口
        POST /api/shipu/favorite/toggle
        收藏或取消收藏食谱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.toggle(user.get('id'), recipe_id)

    def ActionShipuFavoriteCheckGet(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        检查收藏状态接口
        GET /api/shipu/favorite/check/get
        检查当前用户是否已收藏某食谱
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'is_favorited': False}
            }

        return self.favorite_business.is_favorited(user.get('id'), recipe_id)

    def ActionShipuFavoriteMyGet(self, request: Request, page: int = Query(1, description="页码"),
                                 page_size: int = Query(10, description="每页数量"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的收藏列表接口
        GET /api/shipu/favorite/my/get
        获取当前用户收藏的食谱列表
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.get_by_user(user.get('id'), page, page_size)
