from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import random

from models.lottery_record import LotteryRecord
from models.product import Product
from models.user import User


class LotteryBusiness:

    @staticmethod
    def draw_gacha(db: Session, user_id: int, product_id: int) -> dict:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("抽奖商品不存在")

        if product.category_id != 5:
            raise ValueError("非抽奖类商品")

        if not product.is_online:
            raise ValueError("抽奖已下架")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("用户不存在")

        if user.points < product.price:
            raise ValueError("积分不足")

        today = datetime.now().strftime("%Y-%m-%d")
        today_records = db.query(LotteryRecord).filter(
            LotteryRecord.user_id == user_id,
            LotteryRecord.product_id == product_id
        ).filter(
            LotteryRecord.created_at >= datetime.strptime(today, "%Y-%m-%d")
        ).count()

        if product.limit_type == "day" and today_records >= product.limit_count:
            raise ValueError("今日抽奖次数已用完")

        user.points -= product.price

        if product.name == "幸运的扭蛋":
            result_points = random.choice([50, 80, 100, 150, 200, 300, 500])
            user.points += result_points
            user.total_points += result_points
            result_description = f"获得 {result_points} 积分"
        elif product.name == "超级盲盒":
            result_points = random.choice([100, 200, 300, 500, 800, 1000, 1500, 2000])
            user.points += result_points
            user.total_points += result_points
            result_description = f"获得价值 {result_points} 积分的商品"
        else:
            result_points = random.randint(50, 500)
            user.points += result_points
            user.total_points += result_points
            result_description = f"获得 {result_points} 积分"

        record = LotteryRecord(
            user_id=user_id,
            product_id=product_id,
            result=result_points,
            result_description=result_description
        )
        db.add(record)

        from models.points_record import PointsRecord
        cost_record = PointsRecord(
            user_id=user_id,
            points=-product.price,
            type="lottery",
            description=f"抽奖消耗: {product.name}",
            balance_after=user.points
        )
        db.add(cost_record)

        reward_record = PointsRecord(
            user_id=user_id,
            points=result_points,
            type="lottery",
            description=f"抽奖获得: {result_description}",
            balance_after=user.points
        )
        db.add(reward_record)

        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "product_id": product_id,
            "product_name": product.name,
            "result": result_points,
            "result_description": result_description,
            "user_points": user.points,
            "created_at": record.created_at
        }

    @staticmethod
    def get_user_records(db: Session, user_id: int, page: int = 1,
                         page_size: int = 10) -> tuple:
        query = db.query(LotteryRecord).filter(LotteryRecord.user_id == user_id)
        total = query.count()
        records = query.order_by(LotteryRecord.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for r in records:
            product = db.query(Product).filter(Product.id == r.product_id).first()
            results.append({
                "id": r.id,
                "product_id": r.product_id,
                "product_name": product.name if product else "",
                "result": r.result,
                "result_description": r.result_description,
                "created_at": r.created_at
            })
        return results, total

    @staticmethod
    def get_all_records(db: Session, page: int = 1, page_size: int = 10,
                        keyword: str = "") -> tuple:
        query = db.query(LotteryRecord)
        if keyword:
            query = query.filter(LotteryRecord.result_description.contains(keyword))
        total = query.count()
        records = query.order_by(LotteryRecord.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for r in records:
            user = db.query(User).filter(User.id == r.user_id).first()
            product = db.query(Product).filter(Product.id == r.product_id).first()
            results.append({
                "id": r.id,
                "user_id": r.user_id,
                "username": user.username if user else "",
                "product_id": r.product_id,
                "product_name": product.name if product else "",
                "result": r.result,
                "result_description": r.result_description,
                "created_at": r.created_at
            })
        return results, total
