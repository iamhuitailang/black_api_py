from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCommentRequest(BaseModel):
    recipe_id: int = Field(..., description="食谱ID")
    content: str = Field(..., description="评论内容")
    parent_id: Optional[int] = Field(0, description="父评论ID")


class ShipuCommentController:
    def __init__(self):
        from app.business.shipu.comment_business import ShipuCommentBusiness
        from app.business.shipu.user_business import ShipuUserBusiness
        self.comment_business = ShipuCommentBusiness()
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

    def ActionShipuCommentCreatePost(self, request: Request, body: CreateCommentRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        创建评论接口
        POST /api/shipu/comment/create
        对食谱发表评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.create(
            user_id=user.get('id'),
            recipe_id=body.recipe_id,
            content=body.content,
            parent_id=body.parent_id or 0
        )

    def ActionShipuCommentDeletePost(self, request: Request, comment_id: int = Query(..., description="评论ID"),
                                     authorization: Optional[str] = Header(None)):
        """
        删除评论接口
        POST /api/shipu/comment/delete
        删除自己的评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.delete(comment_id, user.get('id'))

    def ActionShipuCommentLikePost(self, request: Request, comment_id: int = Query(..., description="评论ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        点赞评论接口
        POST /api/shipu/comment/like
        对评论点赞
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.like(comment_id)

    def ActionShipuCommentListGet(self, request: Request, recipe_id: int = Query(..., description="食谱ID"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取评论列表接口
        GET /api/shipu/comment/list/get
        获取食谱的评论列表
        """
        return self.comment_business.get_by_recipe(recipe_id, page, page_size)
