from pydantic import BaseModel, Field
from typing import Optional, List


class DishItem(BaseModel):
    dish_id: int = Field(..., description="菜品ID")
    price_override: Optional[float] = Field(None, description="当日特价")
    max_quantity: Optional[int] = Field(10, description="每人限购数量")


class CreateDailyMenuRequest(BaseModel):
    menu_date: str = Field(..., description="菜单日期 YYYY-MM-DD")
    meal_type: str = Field(..., description="餐段 breakfast/lunch/dinner")
    dish_list: List[DishItem] = Field(..., description="菜品列表")


class UpdateDailyMenuRequest(BaseModel):
    price_override: Optional[float] = Field(None, description="当日特价")
    max_quantity: Optional[int] = Field(None, description="每人限购数量")
    status: Optional[int] = Field(None, description="状态")


class OrderDailyMenuController:
    def __init__(self):
        from app.business.order.daily_menu_business import OrderDailyMenuBusiness
        self.daily_menu_business = OrderDailyMenuBusiness()

    def ActionOrderDailyMenuCreatePost(self, body: CreateDailyMenuRequest):
        dish_list = [item.model_dump() for item in body.dish_list]
        return self.daily_menu_business.create(
            menu_date=body.menu_date,
            meal_type=body.meal_type,
            dish_list=dish_list
        )

    def ActionOrderDailyMenuUpdatePost(self, menu_id: int, body: UpdateDailyMenuRequest):
        data = {k: v for k, v in body.model_dump().items() if v is not None}
        return self.daily_menu_business.update(menu_id, data)

    def ActionOrderDailyMenuDeletePost(self, menu_id: int):
        return self.daily_menu_business.delete(menu_id)

    def ActionOrderDailyMenuListGet(self, menu_date: str, meal_type: str):
        return self.daily_menu_business.get_by_date_and_type(menu_date, meal_type)

    def ActionOrderDailyMenuAllGet(self, page: int = 1, page_size: int = 10,
                                    menu_date: Optional[str] = None, meal_type: Optional[str] = None,
                                    status: Optional[int] = None):
        return self.daily_menu_business.get_all(page, page_size, menu_date, meal_type, status)

    def ActionOrderMealTypeGet(self):
        return self.daily_menu_business.get_meal_types()