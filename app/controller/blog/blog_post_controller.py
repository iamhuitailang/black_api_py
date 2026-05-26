from typing import Optional, List
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogPostBusiness, BlogAuthBusiness


class CreatePostRequest(BaseModel):
    title: str = Field(..., description="标题")
    content: Optional[str] = Field('', description="内容")
    summary: Optional[str] = Field('', description="摘要")
    category_id: Optional[int] = Field(None, description="分类 ID")
    cover: Optional[str] = Field(None, description="封面图")
    slug: Optional[str] = Field(None, description="URL 标识")
    status: Optional[int] = Field(0, description="状态 0 草稿 1 发布")
    tag_ids: Optional[List[int]] = Field(default_factory=list, description="标签 ID 列表")
    is_top: Optional[int] = Field(0, description="是否置顶")


class UpdatePostRequest(BaseModel):
    id: int = Field(..., description="文章 ID")
    title: Optional[str] = Field(None, description="标题")
    content: Optional[str] = Field(None, description="内容")
    summary: Optional[str] = Field(None, description="摘要")
    category_id: Optional[int] = Field(None, description="分类 ID")
    cover: Optional[str] = Field(None, description="封面图")
    slug: Optional[str] = Field(None, description="URL 标识")
    status: Optional[int] = Field(None, description="状态")
    tag_ids: Optional[List[int]] = Field(None, description="标签 ID 列表")
    is_top: Optional[int] = Field(None, description="是否置顶")


class BlogPostController:
    def __init__(self):
        self.post_business = BlogPostBusiness()
        self.auth_business = BlogAuthBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]
        token = request.query_params.get('token')
        if token:
            return token
        return ''

    def ActionBlogPostCreatePost(self, request: Request, body: CreatePostRequest, authorization: Optional[str] = Header(None)):
        """
        创建文章
        POST /api/blog/post/create
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.post_business.create_post(
            user_id=user.get('id'),
            title=body.title,
            content=body.content,
            summary=body.summary,
            category_id=body.category_id,
            cover=body.cover,
            slug=body.slug,
            status=body.status,
            tag_ids=body.tag_ids,
            is_top=body.is_top
        )

    def ActionBlogPostUpdatePost(self, request: Request, body: UpdatePostRequest, authorization: Optional[str] = Header(None)):
        """
        更新文章
        POST /api/blog/post/update
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        data = {
            'title': body.title,
            'content': body.content,
            'summary': body.summary,
            'category_id': body.category_id,
            'cover': body.cover,
            'slug': body.slug,
            'status': body.status,
            'tag_ids': body.tag_ids,
            'is_top': body.is_top
        }
        return self.post_business.update_post(
            user_id=user.get('id'),
            post_id=body.id,
            data={k: v for k, v in data.items() if v is not None}
        )

    def ActionBlogPostDeletePost(self, request: Request, id: int = Query(..., description="文章 ID"), authorization: Optional[str] = Header(None)):
        """
        删除文章
        POST /api/blog/post/delete
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.post_business.delete_post(user_id=user.get('id'), post_id=id)

    def ActionBlogPostPublishPost(self, request: Request, id: int = Query(..., description="文章 ID"), authorization: Optional[str] = Header(None)):
        """
        发布文章
        POST /api/blog/post/publish
        """
        token = self._get_token_from_header(request, authorization)
        user = self.auth_business.verify_token(token)
        if not user:
            return {'code': 1, 'message': '请先登录', 'data': None}
        return self.post_business.publish_post(user_id=user.get('id'), post_id=id)

    def ActionBlogPostDetailGet(self, request: Request, id: int = Query(..., description="文章 ID"), authorization: Optional[str] = Header(None)):
        """
        获取文章详情
        GET /api/blog/post/detail/get
        """
        return self.post_business.get_post_detail(post_id=id, increment_view=True)

    def ActionBlogPostListGet(self, request: Request,
                              page: int = Query(1, ge=1, description="页码"),
                              page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                              category_id: Optional[int] = Query(None, description="分类 ID"),
                              tag_id: Optional[int] = Query(None, description="标签 ID"),
                              status: Optional[int] = Query(1, description="状态 0 草稿 1 已发布"),
                              user_id: Optional[int] = Query(None, description="用户 ID"),
                              keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取文章列表
        GET /api/blog/post/list/get
        """
        return self.post_business.get_post_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            tag_id=tag_id,
            status=status,
            user_id=user_id,
            keyword=keyword
        )

    def ActionBlogPostLikePost(self, request: Request, id: int = Query(..., description="文章 ID")):
        """
        点赞文章
        POST /api/blog/post/like
        """
        return self.post_business.like_post(post_id=id)
