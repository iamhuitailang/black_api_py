from sqlalchemy.orm import Session
from models import GameRecord, User
from schemas import GameRecordCreate


class GameService:
    @staticmethod
    def create_record(db: Session, record_data: GameRecordCreate):
        new_record = GameRecord(**record_data.model_dump())
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        user = db.query(User).filter(User.id == record_data.player_id).first()
        if user:
            user.total_games += 1
            if record_data.result == "win":
                user.win_count += 1
            else:
                user.lose_count += 1
            db.commit()

        return new_record

    @staticmethod
    def get_records_by_player(db: Session, player_id: int, skip: int = 0, limit: int = 50):
        return db.query(GameRecord).filter(GameRecord.player_id == player_id).order_by(GameRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_record_by_id(db: Session, record_id: int):
        return db.query(GameRecord).filter(GameRecord.id == record_id).first()

    @staticmethod
    def list_all_records(db: Session, skip: int = 0, limit: int = 100):
        return db.query(GameRecord).order_by(GameRecord.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def delete_record(db: Session, record_id: int):
        record = db.query(GameRecord).filter(GameRecord.id == record_id).first()
        if record:
            db.delete(record)
            db.commit()
            return True
        return False
