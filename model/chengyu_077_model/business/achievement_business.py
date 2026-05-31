from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from models import Achievement, UserAchievement, User
from schemas import AchievementCreate


def get_achievement(db: Session, achievement_id: int) -> Optional[Achievement]:
    return db.query(Achievement).filter(Achievement.id == achievement_id).first()


def get_achievement_by_name(db: Session, name: str) -> Optional[Achievement]:
    return db.query(Achievement).filter(Achievement.name == name).first()


def get_all_achievements(db: Session) -> List[Achievement]:
    return db.query(Achievement).order_by(Achievement.points.desc()).all()


def create_achievement(db: Session, achievement: AchievementCreate) -> Achievement:
    db_achievement = get_achievement_by_name(db, name=achievement.name)
    if db_achievement:
        return db_achievement
    
    db_achievement = Achievement(
        name=achievement.name,
        description=achievement.description,
        icon=achievement.icon,
        condition_type=achievement.condition_type,
        condition_value=achievement.condition_value,
        points=achievement.points
    )
    db.add(db_achievement)
    db.commit()
    db.refresh(db_achievement)
    return db_achievement


def delete_achievement(db: Session, achievement_id: int) -> bool:
    db_achievement = get_achievement(db, achievement_id=achievement_id)
    if not db_achievement:
        return False
    db.delete(db_achievement)
    db.commit()
    return True


def get_user_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    return db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()


def has_achievement(db: Session, user_id: int, achievement_id: int) -> bool:
    return db.query(UserAchievement).filter(
        UserAchievement.user_id == user_id,
        UserAchievement.achievement_id == achievement_id
    ).first() is not None


def unlock_achievement(db: Session, user_id: int, achievement_id: int) -> Optional[UserAchievement]:
    if has_achievement(db, user_id, achievement_id):
        return None
    
    user_achievement = UserAchievement(
        user_id=user_id,
        achievement_id=achievement_id,
        unlocked_at=datetime.utcnow()
    )
    db.add(user_achievement)
    db.commit()
    db.refresh(user_achievement)
    return user_achievement


def check_and_unlock_achievements(db: Session, user_id: int) -> List[UserAchievement]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    all_achievements = get_all_achievements(db)
    unlocked = []
    
    for achievement in all_achievements:
        if has_achievement(db, user_id, achievement.id):
            continue
        
        should_unlock = False
        
        if achievement.condition_type == "total_games":
            should_unlock = user.total_games >= achievement.condition_value
        elif achievement.condition_type == "total_wins":
            should_unlock = user.total_wins >= achievement.condition_value
        elif achievement.condition_type == "total_score":
            should_unlock = user.total_score >= achievement.condition_value
        elif achievement.condition_type == "win_streak":
            should_unlock = user.total_wins >= achievement.condition_value
        
        if should_unlock:
            ua = unlock_achievement(db, user_id, achievement.id)
            if ua:
                unlocked.append(ua)
    
    return unlocked


def init_default_achievements(db: Session) -> List[Achievement]:
    default_achievements = [
        {"name": "初出茅庐", "description": "完成第一场游戏", "condition_type": "total_games", "condition_value": 1, "points": 10},
        {"name": "小有成就", "description": "完成10场游戏", "condition_type": "total_games", "condition_value": 10, "points": 20},
        {"name": "身经百战", "description": "完成100场游戏", "condition_type": "total_games", "condition_value": 100, "points": 100},
        {"name": "首战告捷", "description": "赢得第一场游戏", "condition_type": "total_wins", "condition_value": 1, "points": 15},
        {"name": "常胜将军", "description": "赢得10场游戏", "condition_type": "total_wins", "condition_value": 10, "points": 30},
        {"name": "战无不胜", "description": "赢得100场游戏", "condition_type": "total_wins", "condition_value": 100, "points": 150},
        {"name": "崭露头角", "description": "累计获得100分", "condition_type": "total_score", "condition_value": 100, "points": 20},
        {"name": "积分达人", "description": "累计获得1000分", "condition_type": "total_score", "condition_value": 1000, "points": 50},
        {"name": "积分王者", "description": "累计获得10000分", "condition_type": "total_score", "condition_value": 10000, "points": 200},
    ]
    
    created = []
    for ach in default_achievements:
        db_ach = create_achievement(db, AchievementCreate(**ach))
        created.append(db_ach)
    
    return created
