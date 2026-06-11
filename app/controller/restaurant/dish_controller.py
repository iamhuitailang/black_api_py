from typing import Optional
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.restaurant import DishBusiness
from app.controller.restaurant.auth_controller import verify_staff_token


def _get_staff_token(request: Request) -> str:
    return request.headers.get('x-staff-token', '')


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
        return self.business.get_dish(id)

    def ActionDishGetlist(self, request: Request, category: Optional[str] = Query(None),
                          is_active: Optional[int] = Query(None)):
        return self.business.get_all_dishes(category, is_active)

    def ActionDishGetbycategory(self, request: Request, category: str = Query(...)):
        return self.business.get_dishes_by_category(category)

    def ActionDishCreatePost(self, request: Request, body: DishCreateRequest):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.create_dish(
            body.name, body.category, body.price, body.description,
            body.spicy_level, body.image_url, body.is_active
        )

    def ActionDishUpdatePost(self, request: Request, body: DishUpdateRequest):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.update_dish(
            body.id, body.name, body.category, body.price, body.description,
            body.spicy_level, body.image_url, body.is_active
        )

    def ActionDishDelete(self, request: Request, id: int = Query(..., ge=1)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.delete_dish(id)

    def ActionDishSetactivePost(self, request: Request, id: int = Query(..., ge=1),
                                is_active: int = Query(..., ge=0, le=1)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.set_dish_active(id, is_active)
