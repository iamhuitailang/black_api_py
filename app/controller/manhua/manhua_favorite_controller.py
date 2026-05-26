from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class FavoriteRequest(BaseModel):
    comic_id: int = Field(..., description="漫画ID")


class ManhuaFavoriteController:
    def __init__(self):
        from app.business.manhua.favorite_business import ManhuaFavoriteBusiness
        from app.business.manhua.user_business import ManhuaUserBusiness
        self.favorite_business = ManhuaFavoriteBusiness()
        self.user_business = ManhuaUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionManhuaFavoriteAddPost(self, request: Request, body: FavoriteRequest,
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.add_favorite(user.get('id'), body.comic_id)

    def ActionManhuaFavoriteRemovePost(self, request: Request, body: FavoriteRequest,
                                        authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.remove_favorite(user.get('id'), body.comic_id)

    def ActionManhuaFavoriteCheckGet(self, request: Request,
                                      comic_id: int = Query(..., description="漫画ID"),
                                      authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'is_favorite': False}
            }

        return self.favorite_business.is_favorite(user.get('id'), comic_id)

    def ActionManhuaFavoriteListGet(self, request: Request,
                                     page: int = Query(1, description="页码"),
                                     page_size: int = Query(20, description="每页数量"),
                                     authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.favorite_business.get_favorite_list(user.get('id'), page, page_size)