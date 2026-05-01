from typing import Optional
from fastapi import Request, Header, Query
from pydantic import BaseModel, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    parent_id: Optional[int] = Field(0, description="父级分类ID")
    price: Optional[float] = Field(0.0, description="参考价格（元/公斤）")
    description: Optional[str] = Field('', description="描述")
    icon: Optional[str] = Field('', description="图标")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    price: Optional[float] = Field(None, description="参考价格")
    description: Optional[str] = Field(None, description="描述")
    icon: Optional[str] = Field(None, description="图标")
    sort_order: Optional[int] = Field(None, description="排序")
    is_active: Optional[int] = Field(None, description="是否启用")


class FeipinCategoryController:
    def __init__(self):
        from app.business.feipin.category_business import FeipinCategoryBusiness
        self.category_business = FeipinCategoryBusiness()

    def _get_token_from_header(self, request: Request, authorization: Optional[str] = Header(None)) -> str:
        if authorization and authorization.startswith('Bearer '):
            return authorization[7:]

        token = request.query_params.get('token')
        if token:
            return token

        return ''

    def ActionFeipinCategoryTreeGet(self, request: Request):
        """
        获取分类树形结构接口
        GET /api/feipin/category/tree/get
        获取所有分类的树形结构
        """
        return self.category_business.get_tree()

    def ActionFeipinCategoryListGet(self, request: Request):
        """
        获取分类列表接口
        GET /api/feipin/category/list/get
        获取所有分类列表
        """
        return self.category_business.get_category_list()

    def ActionFeipinCategoryParentGet(self, request: Request):
        """
        获取一级分类接口
        GET /api/feipin/category/parent/get
        获取所有一级分类
        """
        return self.category_business.get_parent_categories()

    def ActionFeipinCategorySubGet(self, request: Request, parent_id: int = Query(..., description="父级分类ID")):
        """
        获取子分类接口
        GET /api/feipin/category/sub/get
        获取指定父级分类的子分类
        """
        return self.category_business.get_sub_categories(parent_id)

    def ActionFeipinCategoryDetailGet(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        获取分类详情接口
        GET /api/feipin/category/detail/get
        根据ID获取分类详情
        """
        return self.category_business.get_category_by_id(category_id)

    def ActionFeipinCategoryCreatePost(self, request: Request, body: CreateCategoryRequest):
        """
        创建分类接口
        POST /api/feipin/category/create
        管理端创建新分类
        """
        return self.category_business.create_category(
            name=body.name,
            parent_id=body.parent_id or 0,
            price=body.price or 0.0,
            description=body.description or '',
            icon=body.icon or '',
            sort_order=body.sort_order or 0
        )

    def ActionFeipinCategoryUpdatePost(self, request: Request, body: UpdateCategoryRequest,
                                         category_id: int = Query(..., description="分类ID")):
        """
        更新分类接口
        POST /api/feipin/category/update
        管理端更新分类信息
        """
        data = {}
        if body.name is not None:
            data['name'] = body.name
        if body.price is not None:
            data['price'] = body.price
        if body.description is not None:
            data['description'] = body.description
        if body.icon is not None:
            data['icon'] = body.icon
        if body.sort_order is not None:
            data['sort_order'] = body.sort_order
        if body.is_active is not None:
            data['is_active'] = body.is_active

        return self.category_business.update_category(category_id, data)

    def ActionFeipinCategoryDeletePost(self, request: Request, category_id: int = Query(..., description="分类ID")):
        """
        删除分类接口
        POST /api/feipin/category/delete
        管理端删除分类
        """
        return self.category_business.delete_category(category_id)

    def ActionFeipinCategoryPriceGet(self, request: Request, category_id: int = Query(..., description="分类ID"),
                                       weight: float = Query(..., description="重量（公斤）")):
        """
        计算价格接口
        GET /api/feipin/category/price/get
        根据分类和重量计算预估价格
        """
        return self.category_business.calculate_price(category_id, weight)
