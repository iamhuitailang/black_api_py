from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional

from models.task import Task
from models.user_task import UserTask
from models.user import User
from models.signin import Signin
from schemas.task import TaskCreate, TaskUpdate


class TaskBusiness:

    @staticmethod
    def create(db: Session, data: TaskCreate) -> Task:
        task = Task(**data.dict())
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def list(db: Session, is_active: Optional[bool] = None) -> List[Task]:
        query = db.query(Task)
        if is_active is not None:
            query = query.filter(Task.is_active == is_active)
        return query.order_by(Task.sort.asc(), Task.id.asc()).all()

    @staticmethod
    def update(db: Session, task_id: int, data: TaskUpdate) -> Optional[Task]:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete(db: Session, task_id: int) -> bool:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return False
        db.delete(task)
        db.commit()
        return True

    @staticmethod
    def complete_task(db: Session, user_id: int, task_id: int) -> dict:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError("任务不存在")
        if not task.is_active:
            raise ValueError("任务已停用")

        today = datetime.now().strftime("%Y-%m-%d")
        period_key = today

        user_task = db.query(UserTask).filter(
            UserTask.user_id == user_id,
            UserTask.task_id == task_id,
            UserTask.period_date == period_key
        ).first()

        if not user_task:
            user_task = UserTask(
                user_id=user_id,
                task_id=task_id,
                completed_count=0,
                period_date=period_key
            )
            db.add(user_task)
            db.commit()
            db.refresh(user_task)

        if user_task.completed_count >= task.limit_count:
            raise ValueError("今日任务已完成")

        user_task.completed_count += 1
        user_task.last_completed_at = datetime.now()

        from business.user import UserBusiness
        user = UserBusiness.update_user_points(
            db, user_id, task.points,
            description=f"完成任务: {task.name}",
            points_type="task"
        )

        db.commit()
        db.refresh(user_task)

        return {
            "task_id": task.id,
            "task_name": task.name,
            "points": task.points,
            "completed_count": user_task.completed_count,
            "user_points": user.points
        }

    @staticmethod
    def get_user_tasks(db: Session, user_id: int) -> List[dict]:
        tasks = db.query(Task).filter(Task.is_active == True).order_by(
            Task.sort.asc(), Task.id.asc()).all()
        today = datetime.now().strftime("%Y-%m-%d")

        results = []
        for task in tasks:
            user_task = db.query(UserTask).filter(
                UserTask.user_id == user_id,
                UserTask.task_id == task.id,
                UserTask.period_date == today
            ).first()

            completed_count = user_task.completed_count if user_task else 0
            can_complete = completed_count < task.limit_count

            results.append({
                "id": task.id,
                "name": task.name,
                "description": task.description,
                "icon": task.icon,
                "points": task.points,
                "type": task.type,
                "limit_count": task.limit_count,
                "limit_period": task.limit_period,
                "completed_count": completed_count,
                "can_complete": can_complete
            })
        return results

    @staticmethod
    def signin(db: Session, user_id: int) -> dict:
        today = datetime.now().strftime("%Y-%m-%d")

        existing = db.query(Signin).filter(
            Signin.user_id == user_id,
            Signin.signin_date == today
        ).first()
        if existing:
            raise ValueError("今日已签到")

        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        last_signin = db.query(Signin).filter(
            Signin.user_id == user_id,
            Signin.signin_date == yesterday
        ).first()

        if last_signin:
            continuous_days = last_signin.continuous_days + 1
        else:
            continuous_days = 1

        if continuous_days % 7 == 0:
            points = 50
        elif continuous_days == 1:
            points = 10
        else:
            points = 10 + (continuous_days % 7 - 1) * 2

        signin = Signin(
            user_id=user_id,
            signin_date=today,
            continuous_days=continuous_days,
            points=points
        )
        db.add(signin)

        from business.user import UserBusiness
        description = f"每日签到(连续{continuous_days}天)"
        user = UserBusiness.update_user_points(
            db, user_id, points, description=description, points_type="signin"
        )

        db.commit()
        db.refresh(signin)

        return {
            "signin_date": today,
            "continuous_days": continuous_days,
            "points": points,
            "user_points": user.points
        }

    @staticmethod
    def get_signin_info(db: Session, user_id: int) -> dict:
        today = datetime.now().strftime("%Y-%m-%d")
        today_signed = db.query(Signin).filter(
            Signin.user_id == user_id,
            Signin.signin_date == today
        ).first() is not None

        last_signin = db.query(Signin).filter(
            Signin.user_id == user_id
        ).order_by(Signin.created_at.desc()).first()

        continuous_days = last_signin.continuous_days if last_signin else 0

        signin_points = [10, 12, 14, 16, 18, 20, 50]
        today_points = 10
        if continuous_days > 0 and continuous_days % 7 == 0:
            today_points = 50
        elif continuous_days > 0:
            today_points = 10 + (continuous_days % 7 - 1) * 2

        return {
            "today_signed": today_signed,
            "continuous_days": continuous_days,
            "signin_points": signin_points,
            "today_points": today_points
        }
