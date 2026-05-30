from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCommentRequest(BaseModel):
    post_id: int = Field(..., description="信息ID")
    content: str = Field(..., description="评论内容")
    parent_id: Optional[int] = Field(0, description="父评论ID")
    reply_to_user_id: Optional[int] = Field(0, description="回复的用户ID")


class ShiwuCommentController:
    def __init__(self):
        from app.business.shiwu.comment_business import CommentBusiness
        from app.business.shiwu.user_business import UserBusiness
        self.comment_business = CommentBusiness()
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

    def ActionShiwuCommentCreatePost(self, request: Request, body: CreateCommentRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发表评论接口
        POST /api/shiwu/comment/create
        用户对信息发表评论或回复
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.create_comment(
            user_id=user.get('id'),
            post_id=body.post_id,
            content=body.content,
            parent_id=body.parent_id or 0,
            reply_to_user_id=body.reply_to_user_id or 0
        )

    def ActionShiwuCommentByPostGet(self, request: Request,
                                   post_id: int = Query(..., description="信息ID"),
                                   page: int = Query(1, ge=1, description="页码"),
                                   page_size: int = Query(10, ge=1, le=100, description="每页数量")):
        """
        获取某信息的评论列表接口
        GET /api/shiwu/comment/by/post/get
        分页获取某信息的评论列表
        """
        return self.comment_business.get_comments_by_post(
            post_id=post_id,
            page=page,
            page_size=page_size
        )

    def ActionShiwuCommentMyListGet(self, request: Request,
                                    page: int = Query(1, ge=1, description="页码"),
                                    page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                    authorization: Optional[str] = Header(None)):
        """
        获取我的评论接口
        GET /api/shiwu/comment/my/list/get
        获取当前用户发表的评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.get_my_comments(
            user_id=user.get('id'),
            page=page,
            page_size=page_size
        )

    def ActionShiwuCommentLikePost(self, request: Request,
                                   comment_id: int = Query(..., description="评论ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        点赞评论接口
        POST /api/shiwu/comment/like
        点赞某条评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.like_comment(
            user_id=user.get('id'),
            comment_id=comment_id
        )

    def ActionShiwuCommentDeletePost(self, request: Request,
                                   comment_id: int = Query(..., description="评论ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        删除评论接口
        POST /api/shiwu/comment/delete
        删除自己发表的评论
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.delete_comment(
            user_id=user.get('id'),
            comment_id=comment_id
        )

    def ActionShiwuCommentAdminDeletePost(self, request: Request,
                                      comment_id: int = Query(..., description="评论ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        管理员删除评论接口
        POST /api/shiwu/comment/admin/delete
        管理员删除违规评论
        """
        from app.business.shiwu.admin_business import AdminBusiness
        admin_business = AdminBusiness()
        token = self._get_token_from_header(request, authorization)
        admin = admin_business.verify_token(token)

        if not admin:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.admin_delete_comment(
            admin_id=admin.get('id'),
            comment_id=comment_id
        )
