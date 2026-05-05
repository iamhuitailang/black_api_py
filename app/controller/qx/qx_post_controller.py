from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreatePostRequest(BaseModel):
    content: Optional[str] = Field(None, description="文字内容")
    images: Optional[List[str]] = Field(None, description="图片URL列表")
    activity_id: Optional[int] = Field(0, description="关联活动ID")


class UpdatePostRequest(BaseModel):
    content: Optional[str] = Field(None, description="文字内容")
    images: Optional[List[str]] = Field(None, description="图片URL列表")


class QxPostController:
    def __init__(self):
        from app.business.qx.post_business import QxPostBusiness
        from app.business.qx.user_business import QxUserBusiness
        self.post_business = QxPostBusiness()
        self.user_business = QxUserBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        return self.user_business.verify_token(token)

    def ActionQxPostCreatePost(self, request: Request, body: CreatePostRequest,
                                 authorization: Optional[str] = Header(None)):
        """
        发布动态接口
        POST /api/qx/post/create
        用户发布骑行动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.create_post(
            user_id=user.get('id'),
            content=body.content or '',
            images=body.images,
            activity_id=body.activity_id or 0
        )

    def ActionQxPostDetailGet(self, request: Request, post_id: int = Query(..., description="动态ID")):
        """
        获取动态详情接口
        GET /api/qx/post/detail/get
        根据动态ID获取动态详情
        """
        return self.post_business.get_post_by_id(post_id)

    def ActionQxPostFeedGet(self, request: Request, page: int = Query(1, description="页码"),
                              page_size: int = Query(10, description="每页数量")):
        """
        获取首页动态接口
        GET /api/qx/post/feed/get
        获取首页动态流
        """
        return self.post_business.get_feed(
            page=page,
            page_size=page_size
        )

    def ActionQxPostMyListGet(self, request: Request, page: int = Query(1, description="页码"),
                                page_size: int = Query(10, description="每页数量"),
                                authorization: Optional[str] = Header(None)):
        """
        获取我的动态列表接口
        GET /api/qx/post/my/list/get
        获取当前用户发布的动态列表
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
            page_size=page_size
        )

    def ActionQxPostUserListGet(self, request: Request, user_id: int = Query(..., description="用户ID"),
                                  page: int = Query(1, description="页码"),
                                  page_size: int = Query(10, description="每页数量")):
        """
        获取用户动态列表接口
        GET /api/qx/post/user/list/get
        获取指定用户的动态列表
        """
        return self.post_business.get_posts_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

    def ActionQxPostActivityListGet(self, request: Request, activity_id: int = Query(..., description="活动ID"),
                                      page: int = Query(1, description="页码"),
                                      page_size: int = Query(10, description="每页数量")):
        """
        获取活动相关动态接口
        GET /api/qx/post/activity/list/get
        获取某个活动的所有相关动态
        """
        return self.post_business.get_posts_by_activity(
            activity_id=activity_id,
            page=page,
            page_size=page_size
        )

    def ActionQxPostUpdatePost(self, request: Request, body: UpdatePostRequest,
                                 post_id: int = Query(..., description="动态ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        更新动态接口
        POST /api/qx/post/update
        更新自己发布的动态
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
        if body.content is not None:
            data['content'] = body.content
        if body.images is not None:
            data['images'] = body.images

        return self.post_business.update_post(
            post_id=post_id,
            user_id=user.get('id'),
            data=data
        )

    def ActionQxPostDeletePost(self, request: Request, post_id: int = Query(..., description="动态ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        删除动态接口
        POST /api/qx/post/delete
        删除自己发布的动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.delete_post(
            post_id=post_id,
            user_id=user.get('id')
        )

    def ActionQxPostLikePost(self, request: Request, post_id: int = Query(..., description="动态ID")):
        """
        点赞动态接口
        POST /api/qx/post/like
        点赞动态
        """
        return self.post_business.like_post(post_id)

    def ActionQxPostAdminDeletePost(self, request: Request, post_id: int = Query(..., description="动态ID"),
                                      authorization: Optional[str] = Header(None)):
        """
        管理员删除动态接口
        POST /api/qx/post/admin/delete
        管理员删除任何动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.admin_delete_post(post_id)
