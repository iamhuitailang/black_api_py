from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field
import json


class CreatePostRequest(BaseModel):
    content: Optional[str] = Field(None, description="文字内容")
    images: Optional[str] = Field(None, description="图片JSON字符串")
    activity_id: Optional[int] = Field(None, description="关联活动ID")


class UpdatePostRequest(BaseModel):
    content: Optional[str] = Field(None, description="文字内容")
    images: Optional[List[str]] = Field(None, description="图片列表")


class YeyouPostController:
    def __init__(self):
        from app.business.yeyou.post_business import PostBusiness
        self.post_business = PostBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def _get_current_user(self, token: str) -> Optional[dict]:
        from app.business.yeyou.user_business import YeyouUserBusiness
        user_business = YeyouUserBusiness()
        return user_business.verify_token(token)

    def ActionYeyouPostList(self, request: Request,
                                page: int = Query(1, description="页码"),
                                page_size: int = Query(20, description="每页数量"),
                                user_id: Optional[int] = Query(None, description="用户ID"),
                                activity_id: Optional[int] = Query(None, description="活动ID"),
                                keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取动态列表接口
        GET /api/yeyou/post/list
        获取动态列表，支持按用户、活动、关键词筛选
        """
        result = self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            user_id=user_id,
            activity_id=activity_id,
            keyword=keyword
        )

        if result.get('code') == 0 and result.get('data'):
            data = result['data']
            items = data.get('items', []) if isinstance(data, dict) else data
            result['data'] = items

        return result

    def ActionYeyouPostDetail(self, request: Request,
                                  id: int = Query(..., description="动态ID")):
        """
        获取动态详情接口
        GET /api/yeyou/post/detail
        获取动态的详细信息
        """
        return self.post_business.get_post_detail(id)

    def ActionYeyouPostCreatePost(self, request: Request, body: CreatePostRequest,
                                   authorization: Optional[str] = Header(None)):
        """
        发布动态接口
        POST /api/yeyou/post/create
        用户发布户外动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        images = None
        if body.images:
            if isinstance(body.images, str):
                try:
                    images = json.loads(body.images)
                except:
                    images = []
            else:
                images = body.images

        return self.post_business.create_post(
            user_id=user.get('id'),
            content=body.content or '',
            images=images,
            activity_id=body.activity_id
        )

    def ActionYeyouPostUpdatePost(self, request: Request, body: UpdatePostRequest,
                                    id: int = Query(..., description="动态ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        更新动态接口
        POST /api/yeyou/post/update
        修改已发布的动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.update_post(
            post_id=id,
            user_id=user.get('id'),
            content=body.content,
            images=body.images
        )

    def ActionYeyouPostDeletePost(self, request: Request,
                                    id: int = Query(..., description="动态ID"),
                                    authorization: Optional[str] = Header(None)):
        """
        删除动态接口
        POST /api/yeyou/post/delete
        删除已发布的动态
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.delete_post(id, user.get('id'))

    def ActionYeyouPostLikePost(self, request: Request,
                                 id: int = Query(..., description="动态ID"),
                                 authorization: Optional[str] = Header(None)):
        """
        点赞动态接口
        POST /api/yeyou/post/like
        为动态点赞
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.like_post(id)

    def ActionYeyouPostUnlikePost(self, request: Request,
                                   id: int = Query(..., description="动态ID"),
                                   authorization: Optional[str] = Header(None)):
        """
        取消点赞接口
        POST /api/yeyou/post/unlike
        取消对动态的点赞
        """
        token = self._get_token_from_header(request, authorization)
        user = self._get_current_user(token)

        if not user:
            return {
                'code': 1,
                'msg': '请先登录',
                'data': None
            }

        return self.post_business.unlike_post(id)
