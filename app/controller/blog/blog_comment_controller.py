from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogCommentBusiness, BlogAuthBusiness


class CreateCommentRequest(BaseModel):
    post_id: int = Field(..., description="文章 ID")
    content: str = Field(..., description="评论内容")
    parent_id: Optional[int] = Field(None, description="回复的评论 ID")
    nickname: Optional[str] = Field(None, description="访客昵称")
    email: Optional[str] = Field(None, description="访客邮箱")


class BlogCommentController:
    def __init__(self):
        self.comment_business = BlogCommentBusiness()
        self.auth_business = BlogAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def ActionBlogCommentCreatePost(self, request: Request, body: CreateCommentRequest, authorization: Optional[str] = Header(None)):
        """
        创建评论
        POST /api/blog/comment/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        user_id = user.get('id') if user else None

        return self.comment_business.create_comment(
            post_id=body.post_id,
            content=body.content,
            user_id=user_id,
            parent_id=body.parent_id,
            nickname=body.nickname if not user else user.get('nickname') or user.get('username'),
            email=body.email if not user else user.get('email')
        )

    def ActionBlogCommentDeletePost(self, request: Request, id: int = Query(..., description="评论 ID"), authorization: Optional[str] = Header(None)):
        """
        删除评论
        POST /api/blog/comment/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        user_id = user.get('id') if user else None
        return self.comment_business.delete_comment(comment_id=id, user_id=user_id)

    def ActionBlogCommentListGet(self, request: Request,
                                  post_id: int = Query(..., description="文章 ID"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(100, ge=1, le=500, description="每页数量"),
                                  status: Optional[int] = Query(1, description="状态")):
        """
        获取评论列表
        GET /api/blog/comment/list/get
        """
        return self.comment_business.get_comment_list(
            post_id=post_id,
            page=page,
            page_size=page_size,
            status=status
        )

    def ActionBlogCommentLikePost(self, request: Request, id: int = Query(..., description="评论 ID")):
        """
        点赞评论
        POST /api/blog/comment/like
        """
        return self.comment_business.like_comment(comment_id=id)
