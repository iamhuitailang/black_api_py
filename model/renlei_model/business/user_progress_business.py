from sqlalchemy.orm import Session
from datetime import datetime
from ..models import UserProgress


class UserProgressBusiness:
    @staticmethod
    def create_progress(db: Session, user_id: int, level_id: int):
        progress = UserProgress(
            user_id=user_id,
            level_id=level_id,
            is_completed=False,
            attempts=0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def get_progress(db: Session, user_id: int, level_id: int):
        return db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.level_id == level_id
        ).first()

    @staticmethod
    def get_or_create_progress(db: Session, user_id: int, level_id: int):
        progress = UserProgressBusiness.get_progress(db, user_id, level_id)
        if not progress:
            progress = UserProgressBusiness.create_progress(db, user_id, level_id)
        return progress

    @staticmethod
    def increment_attempts(db: Session, user_id: int, level_id: int):
        progress = UserProgressBusiness.get_or_create_progress(db, user_id, level_id)
        progress.attempts += 1
        progress.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def complete_level(db: Session, user_id: int, level_id: int, completion_time: float = None):
        progress = UserProgressBusiness.get_or_create_progress(db, user_id, level_id)
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        if completion_time:
            if not progress.best_time or completion_time < progress.best_time:
                progress.best_time = completion_time
        progress.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def get_user_progresses(db: Session, user_id: int):
        return db.query(UserProgress).filter(UserProgress.user_id == user_id).all()

    @staticmethod
    def update_progress(db: Session, progress_id: int, **kwargs):
        progress = db.query(UserProgress).filter(UserProgress.id == progress_id).first()
        if not progress:
            return None
        for key, value in kwargs.items():
            if hasattr(progress, key) and value is not None:
                setattr(progress, key, value)
        progress.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def delete_progress(db: Session, progress_id: int):
        progress = db.query(UserProgress).filter(UserProgress.id == progress_id).first()
        if not progress:
            return False
        db.delete(progress)
        db.commit()
        return True

    @staticmethod
    def get_completed_levels(db: Session, user_id: int):
        return db.query(UserProgress).filter(
            UserProgress.user_id == user_id,
            UserProgress.is_completed == True
        ).all()
