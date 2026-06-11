from typing import Optional, List
from fastapi import APIRouter, Query, Request
from pydantic import BaseModel
from app.business.restaurant import OrderBusiness
from app.controller.restaurant.auth_controller import verify_staff_token


def _get_staff_token(request: Request) -> str:
    return request.headers.get('x-staff-token', '')


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
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.get_order(id)

    def ActionOrderGetbytable(self, request: Request, table_number: int = Query(..., ge=1, le=20)):
        return self.business.get_orders_by_table(table_number)

    def ActionOrderGetlist(self, request: Request, status: Optional[str] = Query(None),
                           table_number: Optional[int] = Query(None)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.get_all_orders(status, table_number)

    def ActionOrderCreatePost(self, request: Request, body: OrderCreateRequest):
        items = [item.dict() for item in body.items]
        return self.business.create_order(body.table_number, items)

    def ActionOrderUpdatestatusPost(self, request: Request, id: int = Query(..., ge=1),
                                    status: str = Query(...)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.update_order_status(id, status)

    def ActionOrderDelete(self, request: Request, id: int = Query(..., ge=1)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.delete_order(id)

    def ActionOrderGetdailysummary(self, request: Request, date: Optional[str] = Query(None)):
        token = _get_staff_token(request)
        if not verify_staff_token(token):
            return {'code': 401, 'message': '需要员工身份验证', 'data': None}
        return self.business.get_daily_summary(date)
