from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCommentRequest(BaseModel):
    activity_id: int = Field(..., description="活动ID")
    content: str = Field(..., description="评论内容")
    parent_id: Optional[int] = Field(0, description="父评论ID,0=顶级评论")


class HuodongCommentController:
    def __init__(self):
        from app.business.huodong.comment_business import CommentBusiness
        from app.business.huodong.user_business import HuodongUserBusiness
        self.comment_business = CommentBusiness()
        self.user_business = HuodongUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        return token if token else ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionHuodongCommentCreatePost(self, request: Request, body: CreateCommentRequest,
                                        authorization: Optional[str] = Header(None)):
        """
        发表评论
        POST /api/huodong/comment/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.comment_business.create_comment(
            user_id=user.get('id'),
            activity_id=body.activity_id,
            content=body.content,
            parent_id=body.parent_id or 0
        )

    def ActionHuodongCommentListGet(self, request: Request,
                                     activity_id: int = Query(..., description="活动ID"),
                                     page: int = Query(1, ge=1),
                                     page_size: int = Query(20, ge=1, le=100)):
        """
        获取活动评论列表
        GET /api/huodong/comment/list/get
        """
        return self.comment_business.get_comments_by_activity(activity_id, page, page_size)

    def ActionHuodongCommentDeletePost(self, request: Request,
                                        comment_id: int = Query(..., description="评论ID"),
                                        authorization: Optional[str] = Header(None)):
        """
        删除评论
        POST /api/huodong/comment/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        if not user:
            return {'code': 1, 'msg': '请先登录', 'data': None}
        return self.comment_business.delete_comment(user.get('id'), comment_id)
