from pydantic import BaseModel, Field
from typing import Optional


class CreateDishRequest(BaseModel):
    category_id: int = Field(..., description="分类ID")
    name: str = Field(..., description="菜品名称")
    price: float = Field(..., description="价格")
    cost: Optional[float] = Field(0, description="成本价")
    stock: Optional[int] = Field(999, description="库存")
    image_url: Optional[str] = Field('', description="图片URL")
    description: Optional[str] = Field('', description="描述")
    sort_order: Optional[int] = Field(0, description="排序")


class UpdateDishRequest(BaseModel):
    category_id: Optional[int] = Field(None, description="分类ID")
    name: Optional[str] = Field(None, description="菜品名称")
    price: Optional[float] = Field(None, description="价格")
    cost: Optional[float] = Field(None, description="成本价")
    stock: Optional[int] = Field(None, description="库存")
    image_url: Optional[str] = Field(None, description="图片URL")
    description: Optional[str] = Field(None, description="描述")
    sort_order: Optional[int] = Field(None, description="排序")
    status: Optional[int] = Field(None, description="状态")


class OrderDishController:
    def __init__(self):
        from app.business.order.dish_business import OrderDishBusiness
        self.dish_business = OrderDishBusiness()

    def ActionOrderDishCreatePost(self, body: CreateDishRequest):
        return self.dish_business.create(
            category_id=body.category_id,
            name=body.name,
            price=body.price,
            cost=body.cost,
            stock=body.stock,
            image_url=body.image_url,
            description=body.description,
            sort_order=body.sort_order
        )

    def ActionOrderDishUpdatePost(self, dish_id: int, body: UpdateDishRequest):
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.dish_business.update(dish_id, data)

    def ActionOrderDishDeletePost(self, dish_id: int):
        return self.dish_business.delete(dish_id)

    def ActionOrderDishDetailGet(self, dish_id: int):
        return self.dish_business.get_by_id(dish_id)

    def ActionOrderDishListGet(self, category_id: Optional[int] = None):
        return self.dish_business.get_list(category_id)

    def ActionOrderDishAllGet(self, page: int = 1, page_size: int = 10,
                              status: Optional[int] = None, category_id: Optional[int] = None,
                              keyword: Optional[str] = None):
        return self.dish_business.get_all(page, page_size, status, category_id, keyword)