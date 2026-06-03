from typing import Optional
from sqlalchemy.orm import Session
from models import UserProgress
from schemas import UserProgressCreate, UserProgressUpdate
import json


class UserProgressService:
    @staticmethod
    def get_user_progress(db: Session, user_id: int) -> Optional[UserProgress]:
        return db.query(UserProgress).filter(UserProgress.user_id == user_id).first()

    @staticmethod
    def create_user_progress(db: Session, progress: UserProgressCreate) -> UserProgress:
        db_progress = UserProgress(**progress.dict())
        db.add(db_progress)
        db.commit()
        db.refresh(db_progress)
        return db_progress

    @staticmethod
    def update_user_progress(db: Session, user_id: int, progress: UserProgressUpdate) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            update_data = progress.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_progress, key, value)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def save_game_state(db: Session, user_id: int, game_state: dict) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db_progress.game_state = json.dumps(game_state, ensure_ascii=False)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def load_game_state(db: Session, user_id: int) -> dict:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress and db_progress.game_state:
            return json.loads(db_progress.game_state)
        return {}

    @staticmethod
    def update_depth(db: Session, user_id: int, depth: float) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db_progress.current_depth = depth
            if depth > db_progress.deepest_reached:
                db_progress.deepest_reached = depth
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def add_creature_caught(db: Session, user_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db_progress.total_creatures_caught += 1
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def add_treasure_found(db: Session, user_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db_progress.total_treasures_found += 1
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def add_ruin_explored(db: Session, user_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db_progress.total_ruins_explored += 1
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def unlock_submarine(db: Session, user_id: int, submarine_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            unlocked = set(db_progress.unlocked_submarines.split(',')) if db_progress.unlocked_submarines else set()
            unlocked.add(str(submarine_id))
            db_progress.unlocked_submarines = ','.join(unlocked)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def unlock_equipment(db: Session, user_id: int, equipment_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            unlocked = set(db_progress.unlocked_equipment.split(',')) if db_progress.unlocked_equipment else set()
            unlocked.add(str(equipment_id))
            db_progress.unlocked_equipment = ','.join(unlocked)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def unlock_music(db: Session, user_id: int, music_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            unlocked = set(db_progress.unlocked_music.split(',')) if db_progress.unlocked_music else set()
            unlocked.add(str(music_id))
            db_progress.unlocked_music = ','.join(unlocked)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def discover_ruin(db: Session, user_id: int, ruin_id: int) -> Optional[UserProgress]:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            discovered = set(db_progress.discovered_ruins.split(',')) if db_progress.discovered_ruins else set()
            discovered.add(str(ruin_id))
            db_progress.discovered_ruins = ','.join(discovered)
            db.commit()
            db.refresh(db_progress)
        return db_progress

    @staticmethod
    def delete_user_progress(db: Session, user_id: int) -> bool:
        db_progress = UserProgressService.get_user_progress(db, user_id)
        if db_progress:
            db.delete(db_progress)
            db.commit()
            return True
        return False
