from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.restaurant import DishBusiness


class DishCreateRequest(BaseModel):
    name: str
    category: str
    price: float
    description: Optional[str] = None
    spicy_level: int = 0
    image_url: Optional[str] = None
    is_active: int = 1


class DishUpdateRequest(BaseModel):
    id: int
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    spicy_level: Optional[int] = None
    image_url: Optional[str] = None
    is_active: Optional[int] = None


class DishController:
    def __init__(self):
        self.business = DishBusiness()

    def ActionDishGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取菜品详情
        GET /api/dish/get
        参数: id - 菜品ID
        """
        return self.business.get_dish(id)

    def ActionDishGetlist(self, request: Request, category: Optional[str] = Query(None),
                          is_active: Optional[int] = Query(None)):
        """
        获取菜品列表
        GET /api/dish/getlist
        参数: category - 分类(可选), is_active - 是否上架(可选)
        """
        return self.business.get_all_dishes(category, is_active)

    def ActionDishGetbycategory(self, request: Request, category: str = Query(...)):
        """
        按分类获取菜品
        GET /api/dish/getbycategory
        参数: category - 分类
        """
        return self.business.get_dishes_by_category(category)

    def ActionDishCreatePost(self, request: Request, body: DishCreateRequest):
        """
        创建菜品
        POST /api/dish/create
        """
        return self.business.create_dish(
            body.name,
            body.category,
            body.price,
            body.description,
            body.spicy_level,
            body.image_url,
            body.is_active
        )

    def ActionDishUpdatePost(self, request: Request, body: DishUpdateRequest):
        """
        更新菜品
        POST /api/dish/update
        """
        return self.business.update_dish(
            body.id,
            body.name,
            body.category,
            body.price,
            body.description,
            body.spicy_level,
            body.image_url,
            body.is_active
        )

    def ActionDishDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除菜品
        DELETE /api/dish/delete
        参数: id - 菜品ID
        """
        return self.business.delete_dish(id)

    def ActionDishSetactivePost(self, request: Request, id: int = Query(..., ge=1),
                                is_active: int = Query(..., ge=0, le=1)):
        """
        设置菜品上下架
        POST /api/dish/setactive
        参数: id - 菜品ID, is_active - 1上架 0下架
        """
        return self.business.set_dish_active(id, is_active)
