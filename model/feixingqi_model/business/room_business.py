from sqlalchemy.orm import Session
from model.feixingqi_model.models.room import Room
from model.feixingqi_model.utils import generate_room_code
from typing import List, Optional
import json

class RoomBusiness:
    @staticmethod
    def create_room(db: Session, creator_id: int, room_name: str, max_players: int = 4, password: str = None, game_mode: str = "classic") -> Room:
        room_code = generate_room_code()
        while db.query(Room).filter(Room.room_code == room_code).first():
            room_code = generate_room_code()
        
        room = Room(
            room_name=room_name,
            room_code=room_code,
            creator_id=creator_id,
            max_players=max_players,
            current_players=1,
            player_ids=json.dumps([creator_id]),
            password=password,
            game_mode=game_mode,
            status="waiting"
        )
        db.add(room)
        db.commit()
        db.refresh(room)
        return room

    @staticmethod
    def get_room_by_id(db: Session, room_id: int) -> Optional[Room]:
        return db.query(Room).filter(Room.id == room_id).first()

    @staticmethod
    def get_room_by_code(db: Session, room_code: str) -> Optional[Room]:
        return db.query(Room).filter(Room.room_code == room_code).first()

    @staticmethod
    def get_room_list(db: Session, page: int = 1, page_size: int = 10, status: str = None, keyword: str = None) -> tuple:
        query = db.query(Room)
        if status:
            query = query.filter(Room.status == status)
        if keyword:
            query = query.filter((Room.room_name.contains(keyword)) | (Room.room_code.contains(keyword)))
        total = query.count()
        rooms = query.order_by(Room.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return rooms, total

    @staticmethod
    def join_room(db: Session, room_id: int, user_id: int, password: str = None) -> Optional[Room]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return None
        if room.password and room.password != password:
            return None
        if room.current_players >= room.max_players:
            return None
        if room.status != "waiting":
            return None
        
        player_ids = json.loads(room.player_ids)
        if user_id not in player_ids:
            player_ids.append(user_id)
            room.player_ids = json.dumps(player_ids)
            room.current_players = len(player_ids)
            db.commit()
            db.refresh(room)
        return room

    @staticmethod
    def leave_room(db: Session, room_id: int, user_id: int) -> Optional[Room]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return None
        
        player_ids = json.loads(room.player_ids)
        if user_id in player_ids:
            player_ids.remove(user_id)
            room.player_ids = json.dumps(player_ids)
            room.current_players = len(player_ids)
            
            if len(player_ids) == 0:
                db.delete(room)
                db.commit()
                return None
            elif room.creator_id == user_id:
                room.creator_id = player_ids[0]
            
            db.commit()
            db.refresh(room)
        return room

    @staticmethod
    def update_room_status(db: Session, room_id: int, status: str) -> Optional[Room]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            room.status = status
            db.commit()
            db.refresh(room)
        return room

    @staticmethod
    def delete_room(db: Session, room_id: int) -> bool:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            db.delete(room)
            db.commit()
            return True
        return False

    @staticmethod
    def quick_match(db: Session, user_id: int, game_mode: str = None) -> Optional[Room]:
        player_ids_str = str(user_id)
        query = db.query(Room).filter(
            Room.status == "waiting",
            Room.password.is_(None),
            Room.current_players < Room.max_players,
            ~Room.player_ids.contains(player_ids_str)
        )
        if game_mode:
            query = query.filter(Room.game_mode == game_mode)
        room = query.order_by(Room.created_at.asc()).first()
        if not room:
            return None
        player_ids = json.loads(room.player_ids)
        if user_id not in player_ids:
            player_ids.append(user_id)
            room.player_ids = json.dumps(player_ids)
            room.current_players = len(player_ids)
            db.commit()
            db.refresh(room)
        return room
