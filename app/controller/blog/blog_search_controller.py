from typing import Optional
from fastapi import Request, Query

from app.business.blog import BlogPostBusiness


class BlogSearchController:
    def __init__(self):
        self.post_business = BlogPostBusiness()

    def ActionBlogSearchPostsGet(self, request: Request,
                                  keyword: str = Query('', description="搜索关键词"),
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  category_id: Optional[int] = Query(None, description="分类 ID"),
                                  tag_id: Optional[int] = Query(None, description="标签 ID")):
        """
        搜索文章
        GET /api/blog/search/posts
        """
        return self.post_business.search_posts(
            keyword=keyword,
            page=page,
            page_size=page_size,
            category_id=category_id,
            tag_id=tag_id
        )
