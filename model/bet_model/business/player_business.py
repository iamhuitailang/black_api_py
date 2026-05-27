from sqlalchemy.orm import Session
from typing import List, Optional
from models.player import Player


class PlayerBusiness:
    def __init__(self, db: Session):
        self.db = db

    def create(self, name: str) -> Player:
        player = Player(name=name)
        self.db.add(player)
        self.db.commit()
        self.db.refresh(player)
        return player

    def get_by_id(self, player_id: int) -> Optional[Player]:
        return self.db.query(Player).filter(Player.id == player_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Player]:
        return self.db.query(Player).offset(skip).limit(limit).all()

    def update(self, player_id: int, **kwargs) -> Optional[Player]:
        player = self.get_by_id(player_id)
        if player:
            for key, value in kwargs.items():
                if hasattr(player, key):
                    setattr(player, key, value)
            self.db.commit()
            self.db.refresh(player)
        return player

    def delete(self, player_id: int) -> bool:
        player = self.get_by_id(player_id)
        if player:
            self.db.delete(player)
            self.db.commit()
            return True
        return False

    def update_health(self, player_id: int, health: float) -> Optional[Player]:
        return self.update(player_id, health=health)

    def update_position(self, player_id: int, x: float, y: float) -> Optional[Player]:
        return self.update(player_id, x=x, y=y)

    def add_win(self, player_id: int) -> Optional[Player]:
        player = self.get_by_id(player_id)
        if player:
            player.wins += 1
            self.db.commit()
            self.db.refresh(player)
        return player

    def add_loss(self, player_id: int) -> Optional[Player]:
        player = self.get_by_id(player_id)
        if player:
            player.losses += 1
            self.db.commit()
            self.db.refresh(player)
        return player
