from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from utils.response import ResponseUtil
from utils.auth import get_current_user, get_current_admin
from schemas.order import OrderCreate, OrderUpdate
from models.user import User
from business.order import OrderBusiness

router = APIRouter(prefix="/api/order", tags=["订单"])


@router.post("/")
def create(data: OrderCreate, current_user: User = Depends(get_current_user),
           db: Session = Depends(get_db)):
    try:
        order = OrderBusiness.create(db, current_user.id, data)
        return ResponseUtil.success(data={
            "order_id": order.id,
            "order_no": order.order_no
        }, message="兑换成功")
    except ValueError as e:
        return ResponseUtil.error(message=str(e))
    except Exception as e:
        return ResponseUtil.error(message=f"兑换失败: {str(e)}")


@router.get("/my")
def my_orders(page: int = 1, page_size: int = 10, status: Optional[str] = None,
              current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    try:
        orders, total = OrderBusiness.list_by_user(
            db, current_user.id, page, page_size, status)
        return ResponseUtil.page(data=[{
            "id": o.id,
            "order_no": o.order_no,
            "product_id": o.product_id,
            "product_name": o.product_name,
            "product_image": o.product_image,
            "price": o.price,
            "quantity": o.quantity,
            "total_price": o.total_price,
            "status": o.status,
            "receiver_name": o.receiver_name,
            "receiver_phone": o.receiver_phone,
            "receiver_address": o.receiver_address,
            "express_no": o.express_no,
            "express_company": o.express_company,
            "remark": o.remark,
            "created_at": o.created_at
        } for o in orders], total=total, page=page, page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/list")
def list_orders(page: int = 1, page_size: int = 10, keyword: str = "",
               status: Optional[str] = None,
               current_user: User = Depends(get_current_admin),
               db: Session = Depends(get_db)):
    try:
        orders, total = OrderBusiness.list_all(db, page, page_size, keyword, status)
        return ResponseUtil.page(data=orders, total=total, page=page,
                                 page_size=page_size)
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.get("/{order_id}")
def get_by_id(order_id: int, current_user: User = Depends(get_current_user),
              db: Session = Depends(get_db)):
    try:
        order = OrderBusiness.get_by_id(db, order_id)
        if not order:
            return ResponseUtil.error(message="订单不存在", code=404)
        if order.user_id != current_user.id and current_user.role != "admin":
            return ResponseUtil.error(message="无权限", code=403)
        return ResponseUtil.success(data={
            "id": order.id,
            "order_no": order.order_no,
            "user_id": order.user_id,
            "product_id": order.product_id,
            "product_name": order.product_name,
            "product_image": order.product_image,
            "price": order.price,
            "quantity": order.quantity,
            "total_price": order.total_price,
            "status": order.status,
            "receiver_name": order.receiver_name,
            "receiver_phone": order.receiver_phone,
            "receiver_address": order.receiver_address,
            "express_no": order.express_no,
            "express_company": order.express_company,
            "remark": order.remark,
            "created_at": order.created_at,
            "updated_at": order.updated_at
        })
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/status/{order_id}")
def update_status(order_id: int, status: str,
                  current_user: User = Depends(get_current_admin),
                  db: Session = Depends(get_db)):
    try:
        order = OrderBusiness.update_status(db, order_id, status)
        if not order:
            return ResponseUtil.error(message="订单不存在", code=404)
        return ResponseUtil.success(message="状态更新成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.put("/express/{order_id}")
def update_express(order_id: int, express_no: str, express_company: str,
                   current_user: User = Depends(get_current_admin),
                   db: Session = Depends(get_db)):
    try:
        order = OrderBusiness.update_express(db, order_id, express_no, express_company)
        if not order:
            return ResponseUtil.error(message="订单不存在", code=404)
        return ResponseUtil.success(message="发货成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))


@router.delete("/{order_id}")
def delete(order_id: int, current_user: User = Depends(get_current_admin),
           db: Session = Depends(get_db)):
    try:
        result = OrderBusiness.delete(db, order_id)
        if not result:
            return ResponseUtil.error(message="订单不存在", code=404)
        return ResponseUtil.success(message="删除成功")
    except Exception as e:
        return ResponseUtil.error(message=str(e))
