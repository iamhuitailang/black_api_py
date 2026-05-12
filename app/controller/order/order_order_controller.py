from pydantic import BaseModel, Field
from typing import Optional, List


class OrderItem(BaseModel):
    dish_id: int = Field(..., description="菜品ID")
    quantity: int = Field(..., description="数量")
    remark: Optional[str] = Field('', description="备注")


class CreateOrderRequest(BaseModel):
    user_id: int = Field(..., description="用户ID")
    menu_date: str = Field(..., description="取餐日期 YYYY-MM-DD")
    meal_type: str = Field(..., description="餐段 breakfast/lunch/dinner")
    items: List[OrderItem] = Field(..., description="菜品列表")
    remark: Optional[str] = Field('', description="订单备注")


class CancelOrderRequest(BaseModel):
    order_id: int = Field(..., description="订单ID")
    user_id: int = Field(..., description="用户ID")
    reason: Optional[str] = Field('', description="取消原因")


class VerifyOrderRequest(BaseModel):
    qrcode: str = Field(..., description="取餐码")
    verified_by: int = Field(..., description="核销人ID")


class OrderOrderController:
    def __init__(self):
        from app.business.order.order_business import OrderBusiness
        self.order_business = OrderBusiness()

    def ActionOrderCreatePost(self, body: CreateOrderRequest):
        items = [item.model_dump() for item in body.items]
        return self.order_business.create(
            user_id=body.user_id,
            menu_date=body.menu_date,
            meal_type=body.meal_type,
            items=items,
            remark=body.remark
        )

    def ActionOrderCancelPost(self, body: CancelOrderRequest):
        return self.order_business.cancel(
            order_id=body.order_id,
            user_id=body.user_id,
            reason=body.reason
        )

    def ActionOrderVerifyPost(self, body: VerifyOrderRequest):
        return self.order_business.verify(
            qrcode=body.qrcode,
            verified_by=body.verified_by
        )

    def ActionOrderDetailGet(self, order_id: int):
        return self.order_business.get_by_id(order_id)

    def ActionOrderByQrcodeGet(self, qrcode: str):
        return self.order_business.get_by_qrcode(qrcode)

    def ActionOrderUserListGet(self, user_id: int, page: int = 1, page_size: int = 10):
        return self.order_business.get_by_user_id(user_id, page, page_size)

    def ActionOrderAllGet(self, page: int = 1, page_size: int = 10,
                          status: Optional[str] = None, menu_date: Optional[str] = None,
                          meal_type: Optional[str] = None, user_id: Optional[int] = None):
        return self.order_business.get_all(page, page_size, status, menu_date, meal_type, user_id)

    def ActionOrderReorderPost(self, order_id: int, user_id: int):
        return self.order_business.reorder(order_id, user_id)