from typing import Optional
from fastapi import Request, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogTagBusiness


class CreateTagRequest(BaseModel):
    name: str = Field(..., description="标签名称")
    slug: Optional[str] = Field(None, description="标签标识")
    color: Optional[str] = Field(None, description="颜色")


class UpdateTagRequest(BaseModel):
    id: int = Field(..., description="标签 ID")
    name: Optional[str] = Field(None, description="标签名称")
    slug: Optional[str] = Field(None, description="标签标识")
    color: Optional[str] = Field(None, description="颜色")


class BlogTagController:
    def __init__(self):
        self.tag_business = BlogTagBusiness()

    def ActionBlogTagCreatePost(self, request: Request, body: CreateTagRequest):
        """
        创建标签
        POST /api/blog/tag/create
        """
        return self.tag_business.create_tag(name=body.name, slug=body.slug, color=body.color)

    def ActionBlogTagUpdatePost(self, request: Request, body: UpdateTagRequest):
        """
        更新标签
        POST /api/blog/tag/update
        """
        data = {
            'name': body.name,
            'slug': body.slug,
            'color': body.color
        }
        return self.tag_business.update_tag(
            tag_id=body.id,
            data={k: v for k, v in data.items() if v is not None}
        )

    def ActionBlogTagDeletePost(self, request: Request, id: int = Query(..., description="标签 ID")):
        """
        删除标签
        POST /api/blog/tag/delete
        """
        return self.tag_business.delete_tag(tag_id=id)

    def ActionBlogTagListGet(self, request: Request,
                              page: int = Query(1, ge=1, description="页码"),
                              page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                              keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取标签列表（分页）
        GET /api/blog/tag/list/get
        """
        return self.tag_business.get_tag_list(page=page, page_size=page_size, keyword=keyword)

    def ActionBlogTagAllGet(self, request: Request):
        """
        获取全部标签
        GET /api/blog/tag/all/get
        """
        return self.tag_business.get_all_tags()

    def ActionBlogTagDetailGet(self, request: Request, id: int = Query(..., description="标签 ID")):
        """
        获取标签详情
        GET /api/blog/tag/detail/get
        """
        return self.tag_business.get_tag_detail(tag_id=id)
