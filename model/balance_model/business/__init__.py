from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from models import User, Level, GameSave, ScoreRecord, BlockTemplate
from datetime import datetime
import json


class UserBusiness:
    @staticmethod
    def get_user(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_user(db: Session, username: str, password: str, nickname: str = None) -> User:
        db_user = User(
            username=username,
            password=password,
            nickname=nickname or username
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def update_user(db: Session, user_id: int, **kwargs) -> Optional[User]:
        db_user = UserBusiness.get_user(db, user_id)
        if db_user:
            for key, value in kwargs.items():
                setattr(db_user, key, value)
            db_user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_user)
        return db_user
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        db_user = UserBusiness.get_user(db, user_id)
        if db_user:
            db.delete(db_user)
            db.commit()
            return True
        return False


class LevelBusiness:
    @staticmethod
    def get_level(db: Session, level_id: int) -> Optional[Level]:
        return db.query(Level).filter(Level.id == level_id).first()
    
    @staticmethod
    def get_levels(db: Session, skip: int = 0, limit: int = 100, active_only: bool = True) -> List[Level]:
        query = db.query(Level)
        if active_only:
            query = query.filter(Level.is_active == True)
        return query.order_by(Level.difficulty).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_level(db: Session, **kwargs) -> Level:
        db_level = Level(**kwargs)
        db.add(db_level)
        db.commit()
        db.refresh(db_level)
        return db_level
    
    @staticmethod
    def update_level(db: Session, level_id: int, **kwargs) -> Optional[Level]:
        db_level = LevelBusiness.get_level(db, level_id)
        if db_level:
            for key, value in kwargs.items():
                setattr(db_level, key, value)
            db.commit()
            db.refresh(db_level)
        return db_level
    
    @staticmethod
    def delete_level(db: Session, level_id: int) -> bool:
        db_level = LevelBusiness.get_level(db, level_id)
        if db_level:
            db.delete(db_level)
            db.commit()
            return True
        return False


class GameSaveBusiness:
    @staticmethod
    def get_save(db: Session, save_id: int) -> Optional[GameSave]:
        return db.query(GameSave).filter(GameSave.id == save_id).first()
    
    @staticmethod
    def get_saves_by_user(db: Session, user_id: int, limit: int = 20) -> List[GameSave]:
        return db.query(GameSave).filter(GameSave.user_id == user_id).order_by(GameSave.updated_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_auto_save(db: Session, user_id: int, level_id: int) -> Optional[GameSave]:
        return db.query(GameSave).filter(
            GameSave.user_id == user_id,
            GameSave.level_id == level_id,
            GameSave.is_auto_save == True
        ).first()
    
    @staticmethod
    def create_save(db: Session, user_id: int, level_id: int, blocks_data: str, 
                    save_name: str = None, current_score: int = 0, 
                    current_height: float = 0, is_auto_save: bool = False) -> GameSave:
        if is_auto_save:
            existing = GameSaveBusiness.get_auto_save(db, user_id, level_id)
            if existing:
                existing.blocks_data = blocks_data
                existing.current_score = current_score
                existing.current_height = current_height
                existing.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing)
                return existing
        
        db_save = GameSave(
            user_id=user_id,
            level_id=level_id,
            blocks_data=blocks_data,
            save_name=save_name or f"存档_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            current_score=current_score,
            current_height=current_height,
            is_auto_save=is_auto_save
        )
        db.add(db_save)
        db.commit()
        db.refresh(db_save)
        return db_save
    
    @staticmethod
    def update_save(db: Session, save_id: int, **kwargs) -> Optional[GameSave]:
        db_save = GameSaveBusiness.get_save(db, save_id)
        if db_save:
            for key, value in kwargs.items():
                setattr(db_save, key, value)
            db_save.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_save)
        return db_save
    
    @staticmethod
    def delete_save(db: Session, save_id: int) -> bool:
        db_save = GameSaveBusiness.get_save(db, save_id)
        if db_save:
            db.delete(db_save)
            db.commit()
            return True
        return False


class ScoreRecordBusiness:
    @staticmethod
    def get_score(db: Session, score_id: int) -> Optional[ScoreRecord]:
        return db.query(ScoreRecord).filter(ScoreRecord.id == score_id).first()
    
    @staticmethod
    def get_scores_by_user(db: Session, user_id: int, limit: int = 50) -> List[ScoreRecord]:
        return db.query(ScoreRecord).filter(ScoreRecord.user_id == user_id).order_by(ScoreRecord.score.desc()).limit(limit).all()
    
    @staticmethod
    def get_scores_by_level(db: Session, level_id: int, limit: int = 50) -> List[ScoreRecord]:
        return db.query(ScoreRecord).filter(ScoreRecord.level_id == level_id).order_by(ScoreRecord.score.desc()).limit(limit).all()
    
    @staticmethod
    def create_score(db: Session, user_id: int, level_id: int, score: int, 
                     height: float = 0, blocks_used: int = 0, 
                     is_stable: bool = False, play_time: float = 0) -> ScoreRecord:
        db_score = ScoreRecord(
            user_id=user_id,
            level_id=level_id,
            score=score,
            height=height,
            blocks_used=blocks_used,
            is_stable=is_stable,
            play_time=play_time
        )
        db.add(db_score)
        
        user = UserBusiness.get_user(db, user_id)
        if user:
            user.total_score += score
            user.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_score)
        return db_score
    
    @staticmethod
    def delete_score(db: Session, score_id: int) -> bool:
        db_score = ScoreRecordBusiness.get_score(db, score_id)
        if db_score:
            db.delete(db_score)
            db.commit()
            return True
        return False


class BlockTemplateBusiness:
    @staticmethod
    def get_template(db: Session, template_id: int) -> Optional[BlockTemplate]:
        return db.query(BlockTemplate).filter(BlockTemplate.id == template_id).first()
    
    @staticmethod
    def get_templates(db: Session, active_only: bool = True) -> List[BlockTemplate]:
        query = db.query(BlockTemplate)
        if active_only:
            query = query.filter(BlockTemplate.is_active == True)
        return query.all()
    
    @staticmethod
    def create_template(db: Session, **kwargs) -> BlockTemplate:
        db_template = BlockTemplate(**kwargs)
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    
    @staticmethod
    def update_template(db: Session, template_id: int, **kwargs) -> Optional[BlockTemplate]:
        db_template = BlockTemplateBusiness.get_template(db, template_id)
        if db_template:
            for key, value in kwargs.items():
                setattr(db_template, key, value)
            db.commit()
            db.refresh(db_template)
        return db_template
    
    @staticmethod
    def delete_template(db: Session, template_id: int) -> bool:
        db_template = BlockTemplateBusiness.get_template(db, template_id)
        if db_template:
            db.delete(db_template)
            db.commit()
            return True
        return False
