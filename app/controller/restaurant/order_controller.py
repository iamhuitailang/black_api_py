from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.restaurant import OrderBusiness


class OrderItemRequest(BaseModel):
    dish_id: int
    quantity: int = 1


class OrderCreateRequest(BaseModel):
    table_number: int
    items: List[OrderItemRequest]


class OrderController:
    def __init__(self):
        self.business = OrderBusiness()

    def ActionOrderGet(self, request: Request, id: int = Query(..., ge=1)):
        """
        获取订单详情
        GET /api/order/get
        参数: id - 订单ID
        """
        return self.business.get_order(id)

    def ActionOrderGetbytable(self, request: Request, table_number: int = Query(..., ge=1, le=20)):
        """
        获取某桌的所有订单
        GET /api/order/getbytable
        参数: table_number - 桌号(1-20)
        """
        return self.business.get_orders_by_table(table_number)

    def ActionOrderGetlist(self, request: Request, status: Optional[str] = Query(None),
                           table_number: Optional[int] = Query(None)):
        """
        获取订单列表
        GET /api/order/getlist
        参数: status - 状态(可选), table_number - 桌号(可选)
        """
        return self.business.get_all_orders(status, table_number)

    def ActionOrderCreatePost(self, request: Request, body: OrderCreateRequest):
        """
        创建订单
        POST /api/order/create
        """
        items = [item.dict() for item in body.items]
        return self.business.create_order(body.table_number, items)

    def ActionOrderUpdatestatusPost(self, request: Request, id: int = Query(..., ge=1),
                                    status: str = Query(...)):
        """
        更新订单状态
        POST /api/order/updatestatus
        参数: id - 订单ID, status - 状态(pending/cooking/served)
        """
        return self.business.update_order_status(id, status)

    def ActionOrderDelete(self, request: Request, id: int = Query(..., ge=1)):
        """
        删除订单
        DELETE /api/order/delete
        参数: id - 订单ID
        """
        return self.business.delete_order(id)

    def ActionOrderGetdailysummary(self, request: Request, date: Optional[str] = Query(None)):
        """
        获取每日汇总
        GET /api/order/getdailysummary
        参数: date - 日期(YYYY-MM-DD, 可选, 默认今天)
        """
        return self.business.get_daily_summary(date)
