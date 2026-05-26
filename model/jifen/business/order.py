from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from datetime import datetime
import random
import string

from models.order import Order
from models.product import Product
from models.user import User
from schemas.order import OrderCreate, OrderUpdate


class OrderBusiness:

    @staticmethod
    def generate_order_no() -> str:
        now = datetime.now()
        rand = ''.join(random.choices(string.digits, k=6))
        return now.strftime("%Y%m%d%H%M%S") + rand

    @staticmethod
    def create(db: Session, user_id: int, data: OrderCreate) -> Order:
        product = db.query(Product).filter(Product.id == data.product_id).first()
        if not product:
            raise ValueError("商品不存在")
        if not product.is_online:
            raise ValueError("商品已下架")
        if product.stock < data.quantity:
            raise ValueError("库存不足")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")

        total_price = product.price * data.quantity
        if user.points < total_price:
            raise ValueError("积分不足")

        user.points -= total_price
        product.stock -= data.quantity
        product.exchange_count += data.quantity

        order_no = OrderBusiness.generate_order_no()
        while db.query(Order).filter(Order.order_no == order_no).first():
            order_no = OrderBusiness.generate_order_no()

        order = Order(
            order_no=order_no,
            user_id=user_id,
            product_id=data.product_id,
            product_name=product.name,
            product_image=product.image,
            price=product.price,
            quantity=data.quantity,
            total_price=total_price,
            status="pending",
            receiver_name=data.receiver_name or "",
            receiver_phone=data.receiver_phone or "",
            receiver_address=data.receiver_address or "",
            remark=data.remark or ""
        )

        db.add(order)

        from models.points_record import PointsRecord
        record = PointsRecord(
            user_id=user_id,
            points=-total_price,
            type="exchange",
            description=f"兑换商品: {product.name}",
            balance_after=user.points
        )
        db.add(record)

        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def get_by_id(db: Session, order_id: int) -> Optional[Order]:
        return db.query(Order).filter(Order.id == order_id).first()

    @staticmethod
    def get_by_order_no(db: Session, order_no: str) -> Optional[Order]:
        return db.query(Order).filter(Order.order_no == order_no).first()

    @staticmethod
    def list_by_user(db: Session, user_id: int, page: int = 1,
                     page_size: int = 10, status: Optional[str] = None) -> tuple:
        query = db.query(Order).filter(Order.user_id == user_id)
        if status:
            query = query.filter(Order.status == status)
        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()
        return orders, total

    @staticmethod
    def list_all(db: Session, page: int = 1, page_size: int = 10,
                 keyword: str = "", status: Optional[str] = None) -> tuple:
        query = db.query(Order)
        if keyword:
            query = query.filter(or_(
                Order.order_no.contains(keyword),
                Order.product_name.contains(keyword),
                Order.receiver_name.contains(keyword)
            ))
        if status:
            query = query.filter(Order.status == status)
        total = query.count()
        orders = query.order_by(Order.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for order in orders:
            user = db.query(User).filter(User.id == order.user_id).first()
            results.append({
                "id": order.id,
                "order_no": order.order_no,
                "user_id": order.user_id,
                "username": user.username if user else "",
                "product_id": order.product_id,
                "product_name": order.product_name,
                "product_image": order.product_image,
                "price": order.price,
                "quantity": order.quantity,
                "total_price": order.total_price,
                "status": order.status,
                "receiver_name": order.receiver_name,
                "receiver_phone": order.receiver_phone,
                "express_no": order.express_no,
                "created_at": order.created_at
            })
        return results, total

    @staticmethod
    def update_status(db: Session, order_id: int, status: str) -> Optional[Order]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        order.status = status
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def update_express(db: Session, order_id: int, express_no: str,
                       express_company: str) -> Optional[Order]:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        order.express_no = express_no
        order.express_company = express_company
        if order.status == "pending":
            order.status = "shipped"
        db.commit()
        db.refresh(order)
        return order

    @staticmethod
    def delete(db: Session, order_id: int) -> bool:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return False
        db.delete(order)
        db.commit()
        return True
