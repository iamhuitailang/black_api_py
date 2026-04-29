from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    code: str = Field(..., description="分类代码")
    name: str = Field(..., description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    sort_order: int = Field(0, description="排序顺序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    description: Optional[str] = Field(None, description="分类描述")
    sort_order: Optional[int] = Field(None, description="排序顺序")
    is_active: Optional[int] = Field(None, description="是否启用 0/1")


class XqCategoryController:
    def __init__(self):
        from app.business.xq.category_business import XqCategoryBusiness
        self.category_business = XqCategoryBusiness()

    def ActionXqCategoryListGet(self, request: Request,
                                 only_active: int = Query(1, description="是否只显示启用的分类 0/1")):
        """
        获取分类列表接口
        GET /api/xq/category/list/get
        获取所有分类
        """
        return self.category_business.get_list(only_active=only_active == 1)

    def ActionXqCategoryCreatePost(self, request: Request, body: CreateCategoryRequest):
        """
        创建分类接口
        POST /api/xq/category/create
        管理员创建新分类
        """
        return self.category_business.create(
            code=body.code,
            name=body.name,
            description=body.description or '',
            sort_order=body.sort_order
        )

    def ActionXqCategoryUpdatePost(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                    body: UpdateCategoryRequest = None):
        """
        更新分类接口
        POST /api/xq/category/update
        管理员更新分类信息
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.description is not None:
            data['description'] = body.description
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.is_active is not None:
            data['is_active'] = body.is_active

        return self.category_business.update(category_id=category_id, data=data)

    def ActionXqCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        删除分类接口
        POST /api/xq/category/delete
        管理员删除分类
        """
        return self.category_business.delete(category_id=category_id)

    def ActionXqCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/xq/category/detail/get
        根据ID获取分类信息
        """
        return self.category_business.get_by_id(category_id=category_id)
