from sqlalchemy.orm import Session
from model.feixingqi_model.models.spectator import Spectator
from model.feixingqi_model.models.room import Room
from typing import List, Optional

class SpectatorBusiness:
    @staticmethod
    def join_spectator(db: Session, room_id: int, user_id: int) -> Optional[Spectator]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room or room.status == "waiting":
            return None
        
        existing = db.query(Spectator).filter(Spectator.room_id == room_id, Spectator.user_id == user_id).first()
        if existing:
            return existing
        
        spectator = Spectator(room_id=room_id, user_id=user_id)
        db.add(spectator)
        db.commit()
        db.refresh(spectator)
        return spectator

    @staticmethod
    def leave_spectator(db: Session, room_id: int, user_id: int) -> bool:
        spectator = db.query(Spectator).filter(Spectator.room_id == room_id, Spectator.user_id == user_id).first()
        if spectator:
            db.delete(spectator)
            db.commit()
            return True
        return False

    @staticmethod
    def get_room_spectators(db: Session, room_id: int) -> List[dict]:
        from model.feixingqi_model.business.user_business import UserBusiness
        spectators = db.query(Spectator).filter(Spectator.room_id == room_id).all()
        result = []
        for s in spectators:
            user = UserBusiness.get_user_by_id(db, s.user_id)
            if user:
                result.append({
                    "id": s.id,
                    "user_id": user.id,
                    "username": user.username,
                    "nickname": user.nickname,
                    "avatar": user.avatar,
                    "joined_at": s.joined_at.isoformat() if s.joined_at else None
                })
        return result

    @staticmethod
    def get_user_spectating_rooms(db: Session, user_id: int) -> List[dict]:
        spectators = db.query(Spectator).filter(Spectator.user_id == user_id).all()
        result = []
        for s in spectators:
            room = db.query(Room).filter(Room.id == s.room_id).first()
            if room:
                result.append({
                    "room_id": room.id,
                    "room_name": room.room_name,
                    "room_code": room.room_code,
                    "status": room.status,
                    "current_players": room.current_players,
                    "max_players": room.max_players,
                    "joined_at": s.joined_at.isoformat() if s.joined_at else None
                })
        return result
