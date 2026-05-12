from pydantic import BaseModel, Field
from typing import Optional, List


class CreateCategoryRequest(BaseModel):
    name: str = Field(..., description="分类名称")
    icon: Optional[str] = Field('', description="图标")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, description="分类名称")
    icon: Optional[str] = Field(None, description="图标")
    sort_order: Optional[int] = Field(None, description="排序")


class OrderCategoryController:
    def __init__(self):
        from app.business.order.category_business import OrderCategoryBusiness
        self.category_business = OrderCategoryBusiness()

    def ActionOrderCategoryCreatePost(self, body: CreateCategoryRequest):
        return self.category_business.create(
            name=body.name,
            icon=body.icon,
            sort_order=body.sort_order
        )

    def ActionOrderCategoryUpdatePost(self, category_id: int, body: UpdateCategoryRequest):
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.category_business.update(category_id, data)

    def ActionOrderCategoryDeletePost(self, category_id: int):
        return self.category_business.delete(category_id)

    def ActionOrderCategoryDetailGet(self, category_id: int):
        return self.category_business.get_by_id(category_id)

    def ActionOrderCategoryListGet(self):
        return self.category_business.get_list()

    def ActionOrderCategoryAllGet(self, page: int = 1, page_size: int = 10):
        return self.category_business.get_all(page, page_size)