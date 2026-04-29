from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateNeedRequest(BaseModel):
    category: str = Field(..., description="分类代码")
    title: str = Field(..., description="标题")
    content: str = Field(..., description="描述内容")
    expect_time: Optional[str] = Field(None, description="期望时间")


class CreateHelpRequest(BaseModel):
    category: str = Field(..., description="分类代码")
    title: str = Field(..., description="标题")
    content: str = Field(..., description="描述内容")
    expect_time: Optional[str] = Field(None, description="期望时间")


class UpdatePostRequest(BaseModel):
    category: Optional[str] = Field(None, description="分类代码")
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="描述内容")
    expect_time: Optional[str] = Field(None, description="期望时间")


class XqPostController:
    def __init__(self):
        from app.business.xq.post_business import XqPostBusiness
        from app.business.xq.user_business import XqUserBusiness
        self.post_business = XqPostBusiness()
        self.user_business = XqUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionXqPostNeedCreatePost(self, request: Request, body: CreateNeedRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发布求助接口
        POST /api/xq/post/need/create
        用户发布求助信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.create_need(
            user_id=user.get('id'),
            category=body.category,
            title=body.title,
            content=body.content,
            expect_time=body.expect_time
        )

    def ActionXqPostHelpCreatePost(self, request: Request, body: CreateHelpRequest,
                                     authorization: Optional[str] = Header(None)):
        """
        发布帮助接口
        POST /api/xq/post/help/create
        用户发布能提供的帮助
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.create_help(
            user_id=user.get('id'),
            category=body.category,
            title=body.title,
            content=body.content,
            expect_time=body.expect_time
        )

    def ActionXqPostDetailGet(self, request: Request, post_id: int = Query(..., description="帖子ID"),
                               authorization: Optional[str] = Header(None)):
        """
        获取帖子详情接口
        GET /api/xq/post/detail/get
        根据帖子ID获取详细信息
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)
        viewer_user_id = user.get('id') if user else None

        return self.post_business.get_post_detail(
            post_id=post_id,
            viewer_user_id=viewer_user_id
        )

    def ActionXqPostListGet(self, request: Request,
                             page: int = Query(1, ge=1, description="页码"),
                             page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                             type: Optional[str] = Query(None, description="类型: need/help"),
                             category: Optional[str] = Query(None, description="分类代码"),
                             status: Optional[int] = Query(None, description="状态"),
                             keyword: Optional[str] = Query(None, description="搜索关键词"),
                             order_by: str = Query('created_at DESC', description="排序方式")):
        """
        获取帖子列表接口
        GET /api/xq/post/list/get
        分页获取帖子列表，支持筛选
        """
        return self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            post_type=type,
            category=category,
            status=status,
            keyword=keyword,
            order_by=order_by
        )

    def ActionXqPostMyListGet(self, request: Request,
                               page: int = Query(1, ge=1, description="页码"),
                               page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                               type: Optional[str] = Query(None, description="类型: need/help"),
                               status: Optional[int] = Query(None, description="状态"),
                               authorization: Optional[str] = Header(None)):
        """
        获取我的帖子列表接口
        GET /api/xq/post/my/list/get
        获取当前用户发布的帖子
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.get_my_posts(
            user_id=user.get('id'),
            page=page,
            page_size=page_size,
            post_type=type,
            status=status
        )

    def ActionXqPostUpdatePost(self, request: Request, post_id: int = Query(..., description="帖子ID"),
                                body: UpdatePostRequest = None,
                                authorization: Optional[str] = Header(None)):
        """
        更新帖子接口
        POST /api/xq/post/update
        更新自己发布的帖子
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        data = {}
        if body.category is not None:
            data['category'] = body.category
        if body.title is not None:
            data['title'] = body.title
        if body.content is not None:
            data['content'] = body.content
        if body.expect_time is not None:
            data['expect_time'] = body.expect_time

        return self.post_business.update_post(
            user_id=user.get('id'),
            post_id=post_id,
            data=data
        )

    def ActionXqPostCancelPost(self, request: Request, post_id: int = Query(..., description="帖子ID"),
                                authorization: Optional[str] = Header(None)):
        """
        取消帖子接口
        POST /api/xq/post/cancel
        取消自己发布的帖子
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.cancel_post(
            user_id=user.get('id'),
            post_id=post_id
        )

    def ActionXqPostCategoriesGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/xq/post/categories/get
        获取所有可用的分类
        """
        return self.post_business.get_categories()

    def ActionXqPostStatisticsGet(self, request: Request, authorization: Optional[str] = Header(None)):
        """
        获取帖子统计接口
        GET /api/xq/post/statistics/get
        获取发布量、完成率等统计数据
        """
        return self.post_business.get_statistics()

    def ActionXqPostAdminListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  type: Optional[str] = Query(None, description="类型: need/help"),
                                  category: Optional[str] = Query(None, description="分类代码"),
                                  status: Optional[int] = Query(None, description="状态"),
                                  is_checked: Optional[int] = Query(None, description="审核状态 0/1"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        管理端获取帖子列表接口
        GET /api/xq/post/admin/list/get
        管理员获取所有帖子列表
        """
        return self.post_business.get_admin_post_list(
            page=page,
            page_size=page_size,
            post_type=type,
            category=category,
            status=status,
            is_checked=is_checked,
            keyword=keyword
        )

    def ActionXqPostCheckPost(self, request: Request, post_id: int = Query(..., description="帖子ID"),
                               is_checked: int = Query(..., description="审核状态 0/1")):
        """
        审核帖子接口
        POST /api/xq/post/check
        管理员审核帖子
        """
        return self.post_business.check_post(
            post_id=post_id,
            is_checked=is_checked
        )
