from sqlalchemy.orm import Session
from typing import List, Optional
from ..models.achievement import Achievement
from ..models.user_achievement import UserAchievement
from ..models.game_record import GameRecord
from sqlalchemy import func

class AchievementBusiness:
    @staticmethod
    def get_achievement_by_id(db: Session, achievement_id: int) -> Optional[Achievement]:
        return db.query(Achievement).filter(Achievement.id == achievement_id).first()

    @staticmethod
    def get_achievement_by_name(db: Session, name: str) -> Optional[Achievement]:
        return db.query(Achievement).filter(Achievement.name == name).first()

    @staticmethod
    def get_achievements(db: Session, skip: int = 0, limit: int = 100) -> List[Achievement]:
        return db.query(Achievement).offset(skip).limit(limit).all()

    @staticmethod
    def create_achievement(db: Session, name: str, description: str = "", achievement_type: str = "kill",
                           target_value: int = 0, icon: str = "") -> Achievement:
        db_achievement = Achievement(
            name=name,
            description=description,
            type=achievement_type,
            target_value=target_value,
            icon=icon
        )
        db.add(db_achievement)
        db.commit()
        db.refresh(db_achievement)
        return db_achievement

    @staticmethod
    def update_achievement(db: Session, achievement_id: int, **kwargs) -> Optional[Achievement]:
        achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
        if achievement:
            for key, value in kwargs.items():
                setattr(achievement, key, value)
            db.commit()
            db.refresh(achievement)
        return achievement

    @staticmethod
    def delete_achievement(db: Session, achievement_id: int) -> bool:
        achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
        if achievement:
            db.delete(achievement)
            db.commit()
            return True
        return False

    @staticmethod
    def get_user_achievements(db: Session, user_id: int) -> List[dict]:
        user_ach_ids = db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user_id).all()
        user_ach_ids = [a[0] for a in user_ach_ids]
        
        all_achievements = AchievementBusiness.get_achievements(db)
        result = []
        for ach in all_achievements:
            result.append({
                "id": ach.id,
                "name": ach.name,
                "description": ach.description,
                "type": ach.type,
                "target_value": ach.target_value,
                "icon": ach.icon,
                "unlocked": ach.id in user_ach_ids,
                "unlocked_at": None
            })
        return result

    @staticmethod
    def check_achievements(db: Session, user_id: int) -> List[Achievement]:
        stats = db.query(
            func.sum(GameRecord.kills).label('total_kills'),
            func.sum(GameRecord.is_win).label('total_wins'),
            func.count(GameRecord.id).label('total_games')
        ).filter(GameRecord.user_id == user_id).first()
        
        total_kills = stats.total_kills or 0
        total_wins = stats.total_wins or 0
        total_games = stats.total_games or 0
        
        user_ach_ids = db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user_id).all()
        user_ach_ids = [a[0] for a in user_ach_ids]
        
        all_achievements = AchievementBusiness.get_achievements(db)
        newly_unlocked = []
        
        for ach in all_achievements:
            if ach.id in user_ach_ids:
                continue
                
            unlocked = False
            if ach.type == "kill" and total_kills >= ach.target_value:
                unlocked = True
            elif ach.type == "win" and total_wins >= ach.target_value:
                unlocked = True
            elif ach.type == "game" and total_games >= ach.target_value:
                unlocked = True
            
            if unlocked:
                user_ach = UserAchievement(user_id=user_id, achievement_id=ach.id)
                db.add(user_ach)
                newly_unlocked.append(ach)
        
        if newly_unlocked:
            db.commit()
        
        return newly_unlocked
