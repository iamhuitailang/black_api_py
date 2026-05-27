from sqlalchemy.orm import Session
from typing import List, Optional
from models.game_save import GameSave
import json


class GameSaveBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        player_id: int,
        game_mode: str = "single",
        scene: str = "space",
        player_health: float = 100.0,
        enemy_health: float = 100.0,
        player_x: float = 100.0,
        player_y: float = 300.0,
        enemy_x: float = 700.0,
        enemy_y: float = 300.0,
        score: int = 0,
        game_state: str = "playing",
        game_data: dict = None,
    ) -> GameSave:
        self.deactivate_all(player_id)
        
        save = GameSave(
            player_id=player_id,
            game_mode=game_mode,
            scene=scene,
            player_health=player_health,
            enemy_health=enemy_health,
            player_x=player_x,
            player_y=player_y,
            enemy_x=enemy_x,
            enemy_y=enemy_y,
            score=score,
            game_state=game_state,
            game_data=json.dumps(game_data) if game_data else None,
        )
        self.db.add(save)
        self.db.commit()
        self.db.refresh(save)
        return save

    def get_by_id(self, save_id: int) -> Optional[GameSave]:
        return self.db.query(GameSave).filter(GameSave.id == save_id).first()

    def get_active_by_player(self, player_id: int) -> Optional[GameSave]:
        return (
            self.db.query(GameSave)
            .filter(GameSave.player_id == player_id, GameSave.is_active == True)
            .order_by(GameSave.updated_at.desc())
            .first()
        )

    def get_by_player(self, player_id: int, skip: int = 0, limit: int = 100) -> List[GameSave]:
        return (
            self.db.query(GameSave)
            .filter(GameSave.player_id == player_id)
            .order_by(GameSave.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> List[GameSave]:
        return (
            self.db.query(GameSave)
            .order_by(GameSave.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, save_id: int, **kwargs) -> Optional[GameSave]:
        save = self.get_by_id(save_id)
        if save:
            for key, value in kwargs.items():
                if hasattr(save, key):
                    setattr(save, key, value)
            self.db.commit()
            self.db.refresh(save)
        return save

    def deactivate_all(self, player_id: int) -> None:
        saves = self.db.query(GameSave).filter(
            GameSave.player_id == player_id,
            GameSave.is_active == True
        ).all()
        for save in saves:
            save.is_active = False
        self.db.commit()

    def delete(self, save_id: int) -> bool:
        save = self.get_by_id(save_id)
        if save:
            self.db.delete(save)
            self.db.commit()
            return True
        return False
