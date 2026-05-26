from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field

from app.business.blog import BlogCategoryBusiness


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    slug: str = Field(..., description="分类标识")
    description: Optional[str] = Field(None, description="分类描述")
    color: Optional[str] = Field(None, description="颜色")
    sort: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    id: int = Field(..., description="分类 ID")
    name: Optional[str] = Field(None, description="分类名称")
    slug: Optional[str] = Field(None, description="分类标识")
    description: Optional[str] = Field(None, description="分类描述")
    color: Optional[str] = Field(None, description="颜色")
    sort: Optional[int] = Field(None, description="排序")


class BlogCategoryController:
    def __init__(self):
        self.category_business = BlogCategoryBusiness()

    def ActionBlogCategoryCreatePost(self, request: Request, body: CreateCategoryRequest):
        """
        创建分类
        POST /api/blog/category/create
        """
        return self.category_business.create_category(
            name=body.name,
            slug=body.slug,
            description=body.description,
            color=body.color,
            sort=body.sort
        )

    def ActionBlogCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest):
        """
        更新分类
        POST /api/blog/category/update
        """
        data = {
            'name': body.name,
            'slug': body.slug,
            'description': body.description,
            'color': body.color,
            'sort': body.sort
        }
        return self.category_business.update_category(
            category_id=body.id,
            data={k: v for k, v in data.items() if v is not None}
        )

    def ActionBlogCategoryDeletePost(self, request: Request, id: int = Query(..., description="分类 ID")):
        """
        删除分类
        POST /api/blog/category/delete
        """
        return self.category_business.delete_category(category_id=id)

    def ActionBlogCategoryListGet(self, request: Request,
                                  page: int = Query(1, ge=1, description="页码"),
                                  page_size: int = Query(10, ge=1, le=100, description="每页数量"),
                                  keyword: Optional[str] = Query(None, description="搜索关键词")):
        """
        获取分类列表（分页）
        GET /api/blog/category/list/get
        """
        return self.category_business.get_category_list(page=page, page_size=page_size, keyword=keyword)

    def ActionBlogCategoryAllGet(self, request: Request):
        """
        获取全部分类
        GET /api/blog/category/all/get
        """
        return self.category_business.get_all_categories()

    def ActionBlogCategoryDetailGet(self, request: Request, id: int = Query(..., description="分类 ID")):
        """
        获取分类详情
        GET /api/blog/category/detail/get
        """
        return self.category_business.get_category_detail(category_id=id)
