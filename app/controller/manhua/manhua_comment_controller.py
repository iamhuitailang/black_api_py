from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCommentRequest(BaseModel):
    comic_id: int = Field(..., description="漫画ID")
    content: str = Field(..., description="评论内容")
    chapter_id: Optional[int] = Field(None, description="章节ID")
    parent_id: Optional[int] = Field(0, description="父评论ID")


class ManhuaCommentController:
    def __init__(self):
        from app.business.manhua.comment_business import ManhuaCommentBusiness
        from app.business.manhua.user_business import ManhuaUserBusiness
        self.comment_business = ManhuaCommentBusiness()
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

    def ActionManhuaCommentCreatePost(self, request: Request, body: CreateCommentRequest,
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.create_comment(
            user.get('id'),
            body.comic_id,
            body.content,
            body.chapter_id,
            body.parent_id or 0
        )

    def ActionManhuaCommentListGet(self, request: Request,
                                    comic_id: int = Query(..., description="漫画ID"),
                                    page: int = Query(1, description="页码"),
                                    page_size: int = Query(20, description="每页数量")):
        return self.comment_business.get_comic_comments(comic_id, page, page_size)

    def ActionManhuaCommentRepliesGet(self, request: Request,
                                       parent_id: int = Query(..., description="父评论ID"),
                                       page: int = Query(1, description="页码"),
                                       page_size: int = Query(20, description="每页数量")):
        return self.comment_business.get_comment_replies(parent_id, page, page_size)

    def ActionManhuaCommentLikePost(self, request: Request,
                                     comment_id: int = Query(..., description="评论ID")):
        return self.comment_business.like_comment(comment_id)

    def ActionManhuaCommentDeletePost(self, request: Request,
                                       comment_id: int = Query(..., description="评论ID"),
                                       authorization: Optional[str] = Header(None)):
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.comment_business.delete_comment(user.get('id'), comment_id)

    def ActionManhuaCommentMyGet(self, request: Request,
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

        return self.comment_business.get_user_comments(user.get('id'), page, page_size)