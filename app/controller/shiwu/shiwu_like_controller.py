from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class ToggleLikeRequest(BaseModel):
    target_id: int = Field(..., description="目标ID")
    target_type: str = Field(..., description="目标类型: post/comment")


class ShiwuLikeController:
    def __init__(self):
        from app.business.shiwu.like_business import LikeBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.like_business = LikeBusiness()
        self.user_business = UserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionShiwuLikeTogglePost(self, request: Request, body: ToggleLikeRequest,
                                    authorization: Optional[str] = Header(None)):
        """
        点赞/取消点赞接口
        POST /api/shiwu/like/toggle
        对信息或评论进行点赞或取消点赞
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.like_business.toggle_like(
            user_id=user.get('id'),
            target_id=body.target_id,
            target_type=body.target_type
        )

    def ActionShiwuLikeCheckGet(self, request: Request,
                               target_id: int = Query(..., description="目标ID"),
                               target_type: str = Query(..., description="目标类型: post/comment"),
                               authorization: Optional[str] = Header(None)):
        """
        检查是否已点赞接口
        GET /api/shiwu/like/check/get
        检查当前用户是否已点赞某内容
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 0,
                'msg': 'success',
                'data': {'liked': False}
            }

        return self.like_business.has_liked(
            user_id=user.get('id'),
            target_id=target_id,
            target_type=target_type
        )

    def ActionShiwuLikeCountGet(self, request: Request,
                             target_id: int = Query(..., description="目标ID"),
                             target_type: str = Query(..., description="目标类型: post/comment")):
        """
        获取点赞数量接口
        GET /api/shiwu/like/count/get
        获取某内容的点赞数量
        """
        return self.like_business.get_like_count(
            target_id=target_id,
            target_type=target_type
        )

    def ActionShiwuLikeMyListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 target_type: Optional[str] = Query(None, description="目标类型: post/comment"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取我的点赞列表接口
        GET /api/shiwu/like/my/list/get
        获取当前用户点赞过的内容
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.like_business.get_my_likes(
            user_id=user.get('id'),
            target_type=target_type,
            page=page,
            page_size=page_size
        )
