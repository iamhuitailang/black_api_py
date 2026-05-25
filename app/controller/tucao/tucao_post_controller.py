from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    content: str = Field(..., description="吐槽内容")
    category: Optional[str] = Field(None, description="分类")


class ReplyPostRequest(BaseModel):
    content: str = Field(..., description="回复内容")
    parent_id: Optional[int] = Field(0, description="父回复ID")
    reply_to_id: Optional[int] = Field(0, description="回复目标ID")


class EditPostRequest(BaseModel):
    content: str = Field(..., description="编辑内容")
    category: Optional[str] = Field(None, description="分类")


class DeletePostRequest(BaseModel):
    delete_code: str = Field(..., description="删除码")


class ReportPostRequest(BaseModel):
    report_type: str = Field(..., description="举报类型")
    description: Optional[str] = Field('', description="举报描述")


class TucaoPostController:
    def __init__(self):
        from app.business.tucao.post_business import TucaoPostBusiness
        from app.business.tucao.user_business import TucaoUserBusiness
        self.post_business = TucaoPostBusiness()
        self.user_business = TucaoUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def _get_client_ip(self, request: Request) -> str:
        if hasattr(request, 'client') and request.client:
            return request.client.host or ''
        return ''

    def ActionTucaoPostCreatePost(self, request: Request, body: CreatePostRequest,
                                  authorization: Optional[str] = Header(None)):
        """
        发布吐槽接口
        POST /api/tucao/post/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0

        ip_address = self._get_client_ip(request)

        return self.post_business.create_post(
            content=body.content,
            category=body.category or '',
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostDetailGet(self, request: Request,
                                 post_id: int = Query(..., description="吐槽ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        获取吐槽详情接口
        GET /api/tucao/post/detail/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        ip_address = self._get_client_ip(request)

        return self.post_business.get_post_detail(
            post_id=post_id,
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostListGet(self, request: Request,
                               page: int = Query(1, ge=1, description="页码"),
                               page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                               category: Optional[str] = Query(None, description="分类"),
                               keyword: Optional[str] = Query(None, description="搜索关键词"),
                               order_by: str = Query('created_at DESC', description="排序方式"),
                               authorization: Optional[str] = Header(None)):
        """
        获取吐槽列表接口
        GET /api/tucao/post/list/get
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        ip_address = self._get_client_ip(request)

        return self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            category=category,
            keyword=keyword,
            order_by=order_by,
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostLikePost(self, request: Request, post_id: int = Query(..., description="吐槽ID"),
                                authorization: Optional[str] = Header(None)):
        """
        点赞吐槽接口
        POST /api/tucao/post/like
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        ip_address = self._get_client_ip(request)

        return self.post_business.like_post(
            post_id=post_id,
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostReplyPost(self, request: Request, post_id: int = Query(..., description="吐槽ID"),
                                 body: ReplyPostRequest = None,
                                 authorization: Optional[str] = Header(None)):
        """
        回复吐槽接口
        POST /api/tucao/post/reply
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        ip_address = self._get_client_ip(request)

        return self.post_business.reply_post(
            post_id=post_id,
            content=body.content,
            parent_id=body.parent_id or 0,
            reply_to_id=body.reply_to_id or 0,
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostReportPost(self, request: Request, post_id: int = Query(..., description="吐槽ID"),
                                  body: ReportPostRequest = None,
                                  authorization: Optional[str] = Header(None)):
        """
        举报吐槽接口
        POST /api/tucao/post/report
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        user_id = user.get('id') if user else 0
        ip_address = self._get_client_ip(request)

        return self.post_business.report_post(
            post_id=post_id,
            report_type=body.report_type,
            description=body.description or '',
            user_id=user_id,
            ip_address=ip_address
        )

    def ActionTucaoPostEditPost(self, request: Request, post_id: int = Query(..., description="吐槽ID"),
                                body: EditPostRequest = None):
        """
        编辑吐槽接口
        POST /api/tucao/post/edit
        """
        delete_code = request.query_params.get('delete_code', '')
        if not delete_code:
            return {
                'code': 1,
                'msg': '删除码不能为空',
                'data': None
            }

        return self.post_business.edit_post(
            post_id=post_id,
            delete_code=delete_code,
            content=body.content,
            category=body.category
        )

    def ActionTucaoPostDeletePost(self, request: Request, post_id: int = Query(..., description="吐槽ID"),
                                  body: DeletePostRequest = None):
        """
        删除吐槽接口
        POST /api/tucao/post/delete
        """
        return self.post_business.delete_post(
            post_id=post_id,
            delete_code=body.delete_code
        )

    def ActionTucaoPostMyListGet(self, request: Request,
                                 page: int = Query(1, ge=1, description="页码"),
                                 page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                 delete_code: str = Query(..., description="删除码")):
        """
        获取我的吐槽列表接口
        GET /api/tucao/post/my/list/get
        """
        return self.post_business.get_my_posts(
            delete_code=delete_code,
            page=page,
            page_size=page_size
        )

    def ActionTucaoPostShareGet(self, request: Request,
                                post_id: int = Query(..., description="吐槽ID")):
        """
        获取分享吐槽接口
        GET /api/tucao/post/share/get
        """
        return self.post_business.get_share_post(post_id)

    def ActionTucaoPostCategoriesGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/tucao/post/categories/get
        """
        return self.post_business.get_categories()

    def ActionTucaoPostStatisticsGet(self, request: Request):
        """
        获取统计数据接口
        GET /api/tucao/post/statistics/get
        """
        return self.post_business.get_statistics()
