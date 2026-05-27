from sqlalchemy.orm import Session
from typing import List, Optional
from models.game_record import GameRecord
import json


class GameRecordBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        player1_id: int,
        player2_id: int,
        winner_id: int = None,
        player1_health: float = 0,
        player2_health: float = 0,
        player1_score: int = 0,
        player2_score: int = 0,
        scene: str = "space",
        game_mode: str = "single",
        duration: float = 0,
        detail: dict = None,
    ) -> GameRecord:
        record = GameRecord(
            player1_id=player1_id,
            player2_id=player2_id,
            winner_id=winner_id,
            player1_health=player1_health,
            player2_health=player2_health,
            player1_score=player1_score,
            player2_score=player2_score,
            scene=scene,
            game_mode=game_mode,
            duration=duration,
            detail=json.dumps(detail) if detail else None,
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_by_id(self, record_id: int) -> Optional[GameRecord]:
        return self.db.query(GameRecord).filter(GameRecord.id == record_id).first()

    def get_by_player(self, player_id: int, skip: int = 0, limit: int = 100) -> List[GameRecord]:
        return (
            self.db.query(GameRecord)
            .filter((GameRecord.player1_id == player_id) | (GameRecord.player2_id == player_id))
            .order_by(GameRecord.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> List[GameRecord]:
        return (
            self.db.query(GameRecord)
            .order_by(GameRecord.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, record_id: int, **kwargs) -> Optional[GameRecord]:
        record = self.get_by_id(record_id)
        if record:
            for key, value in kwargs.items():
                if hasattr(record, key):
                    setattr(record, key, value)
            self.db.commit()
            self.db.refresh(record)
        return record

    def delete(self, record_id: int) -> bool:
        record = self.get_by_id(record_id)
        if record:
            self.db.delete(record)
            self.db.commit()
            return True
        return False
