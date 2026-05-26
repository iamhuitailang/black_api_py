from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List

from models.points_record import PointsRecord
from models.user import User


class PointsBusiness:

    @staticmethod
    def get_user_records(db: Session, user_id: int, page: int = 1,
                         page_size: int = 10, points_type: Optional[str] = None) -> tuple:
        query = db.query(PointsRecord).filter(PointsRecord.user_id == user_id)
        if points_type:
            query = query.filter(PointsRecord.type == points_type)
        total = query.count()
        records = query.order_by(PointsRecord.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()
        return records, total

    @staticmethod
    def get_summary(db: Session, user_id: int) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}

        today = datetime.now().strftime("%Y-%m-%d")
        today_records = db.query(PointsRecord).filter(
            PointsRecord.user_id == user_id,
            PointsRecord.created_at >= datetime.strptime(today, "%Y-%m-%d")
        ).all()
        today_points = sum(r.points for r in today_records if r.points > 0)

        month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
        month_records = db.query(PointsRecord).filter(
            PointsRecord.user_id == user_id,
            PointsRecord.created_at >= datetime.strptime(month_start, "%Y-%m-%d")
        ).all()
        month_points = sum(r.points for r in month_records if r.points > 0)

        return {
            "total_points": user.total_points,
            "current_points": user.points,
            "today_points": today_points,
            "month_points": month_points
        }

    @staticmethod
    def get_all_records(db: Session, page: int = 1, page_size: int = 10,
                        keyword: str = "") -> tuple:
        query = db.query(PointsRecord)
        if keyword:
            query = query.filter(PointsRecord.description.contains(keyword))
        total = query.count()
        records = query.order_by(PointsRecord.created_at.desc()).offset(
            (page - 1) * page_size).limit(page_size).all()

        results = []
        for r in records:
            user = db.query(User).filter(User.id == r.user_id).first()
            results.append({
                "id": r.id,
                "user_id": r.user_id,
                "username": user.username if user else "",
                "points": r.points,
                "type": r.type,
                "description": r.description,
                "balance_after": r.balance_after,
                "created_at": r.created_at
            })
        return results, total
