from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from ..models.game_record import GameRecord

class GameRecordBusiness:
    @staticmethod
    def get_record_by_id(db: Session, record_id: int) -> Optional[GameRecord]:
        return db.query(GameRecord).filter(GameRecord.id == record_id).first()

    @staticmethod
    def get_records_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[GameRecord]:
        return db.query(GameRecord).filter(GameRecord.user_id == user_id).order_by(GameRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_records(db: Session, skip: int = 0, limit: int = 100) -> List[GameRecord]:
        return db.query(GameRecord).order_by(GameRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def create_record(db: Session, user_id: int, map_id: int = None, kills: int = 0,
                      deaths: int = 0, assists: int = 0, damage_dealt: int = 0,
                      headshots: int = 0, is_win: int = 0, game_duration: int = 0) -> GameRecord:
        db_record = GameRecord(
            user_id=user_id,
            map_id=map_id,
            kills=kills,
            deaths=deaths,
            assists=assists,
            damage_dealt=damage_dealt,
            headshots=headshots,
            is_win=is_win,
            game_duration=game_duration
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        return db_record

    @staticmethod
    def update_record(db: Session, record_id: int, **kwargs) -> Optional[GameRecord]:
        record = db.query(GameRecord).filter(GameRecord.id == record_id).first()
        if record:
            for key, value in kwargs.items():
                setattr(record, key, value)
            db.commit()
            db.refresh(record)
        return record

    @staticmethod
    def delete_record(db: Session, record_id: int) -> bool:
        record = db.query(GameRecord).filter(GameRecord.id == record_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

    @staticmethod
    def get_user_stats(db: Session, user_id: int) -> dict:
        records = db.query(GameRecord).filter(GameRecord.user_id == user_id).all()
        total_kills = sum(r.kills for r in records)
        total_deaths = sum(r.deaths for r in records)
        total_games = len(records)
        total_wins = sum(r.is_win for r in records)
        total_headshots = sum(r.headshots for r in records)
        return {
            "total_kills": total_kills,
            "total_deaths": total_deaths,
            "total_games": total_games,
            "total_wins": total_wins,
            "total_headshots": total_headshots,
            "kd_ratio": total_kills / total_deaths if total_deaths > 0 else total_kills,
            "win_rate": (total_wins / total_games * 100) if total_games > 0 else 0
        }

    @staticmethod
    def get_user_records(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[GameRecord]:
        return GameRecordBusiness.get_records_by_user(db, user_id, skip, limit)

    @staticmethod
    def get_total_games(db: Session) -> int:
        return db.query(func.count(GameRecord.id)).scalar() or 0

    @staticmethod
    def get_total_kills(db: Session) -> int:
        return db.query(func.sum(GameRecord.kills)).scalar() or 0

    @staticmethod
    def get_avg_kills(db: Session) -> float:
        total_games = GameRecordBusiness.get_total_games(db)
        if total_games == 0:
            return 0
        return GameRecordBusiness.get_total_kills(db) / total_games
