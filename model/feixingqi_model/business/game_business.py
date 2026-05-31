from sqlalchemy.orm import Session
from model.feixingqi_model.models.game_state import GameState
from model.feixingqi_model.models.game_record import GameRecord
from model.feixingqi_model.models.room import Room
from model.feixingqi_model.business.user_business import UserBusiness
from model.feixingqi_model.utils import roll_dice
from typing import Optional, List, Tuple
import json
from datetime import datetime

class GameBusiness:
    @staticmethod
    def init_game(db: Session, room_id: int) -> Optional[GameState]:
        room = db.query(Room).filter(Room.id == room_id).first()
        if not room:
            return None
        
        player_ids = json.loads(room.player_ids)
        players_state = []
        colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"]
        
        for i, pid in enumerate(player_ids):
            user = UserBusiness.get_user_by_id(db, pid)
            players_state.append({
                "user_id": pid,
                "username": user.username if user else f"player_{i}",
                "nickname": user.nickname if user else f"玩家{i+1}",
                "avatar": user.avatar if user else None,
                "color": colors[i],
                "pieces": [
                    {"id": 0, "position": -1, "is_home": True, "is_finished": False},
                    {"id": 1, "position": -1, "is_home": True, "is_finished": False},
                    {"id": 2, "position": -1, "is_home": True, "is_finished": False},
                    {"id": 3, "position": -1, "is_home": True, "is_finished": False},
                ],
                "has_shield": False,
                "active_buffs": []
            })
        
        game_state = GameState(
            room_id=room_id,
            current_player_index=0,
            players_state=json.dumps(players_state),
            board_state=json.dumps([]),
            dice_value=0,
            game_phase="rolling",
            turn_count=0,
            is_game_over=0
        )
        db.add(game_state)
        db.commit()
        db.refresh(game_state)
        
        room.status = "playing"
        db.commit()
        
        return game_state

    @staticmethod
    def get_game_state(db: Session, room_id: int) -> Optional[GameState]:
        return db.query(GameState).filter(GameState.room_id == room_id).first()

    @staticmethod
    def roll_dice(db: Session, room_id: int, user_id: int) -> Tuple[Optional[GameState], int, str]:
        game_state = db.query(GameState).filter(GameState.room_id == room_id).first()
        if not game_state or game_state.is_game_over:
            return None, 0, "游戏已结束"
        
        players_state = json.loads(game_state.players_state)
        current_player = players_state[game_state.current_player_index]
        
        if current_player["user_id"] != user_id:
            return None, 0, "不是你的回合"
        
        if game_state.game_phase != "rolling":
            return None, 0, "当前阶段不能掷骰子"
        
        dice_value = roll_dice()
        
        if "lucky_six" in current_player["active_buffs"]:
            dice_value = 6
            current_player["active_buffs"].remove("lucky_six")
        
        if "double_dice" in current_player["active_buffs"]:
            dice_value *= 2
            current_player["active_buffs"].remove("double_dice")
        
        game_state.dice_value = dice_value
        game_state.game_phase = "moving"
        game_state.players_state = json.dumps(players_state)
        game_state.last_action = json.dumps({"type": "roll", "player": user_id, "value": dice_value})
        db.commit()
        db.refresh(game_state)
        
        return game_state, dice_value, ""

    @staticmethod
    def move_piece(db: Session, room_id: int, user_id: int, piece_id: int) -> Tuple[Optional[GameState], str]:
        game_state = db.query(GameState).filter(GameState.room_id == room_id).first()
        if not game_state or game_state.is_game_over:
            return None, "游戏已结束"
        
        players_state = json.loads(game_state.players_state)
        current_player = players_state[game_state.current_player_index]
        
        if current_player["user_id"] != user_id:
            return None, "不是你的回合"
        
        if game_state.game_phase != "moving":
            return None, "当前阶段不能移动棋子"
        
        dice_value = game_state.dice_value
        piece = current_player["pieces"][piece_id]
        
        if piece["is_home"]:
            if dice_value == 6:
                piece["position"] = 0
                piece["is_home"] = False
                message = f"{current_player['nickname']} 起飞了一颗棋子！"
            else:
                return None, "只有掷出6点才能让棋子起飞"
        elif not piece["is_finished"]:
            new_position = piece["position"] + dice_value
            if new_position >= 56:
                piece["position"] = 56
                piece["is_finished"] = True
                message = f"{current_player['nickname']} 有一颗棋子到达终点！"
            else:
                piece["position"] = new_position
                message = f"{current_player['nickname']} 移动了 {dice_value} 步"
            
            collision_msg = GameBusiness._check_collision(db, players_state, game_state.current_player_index, piece["position"])
            if collision_msg:
                message += "，" + collision_msg
        else:
            return None, "该棋子已完成比赛"
        
        all_finished = all(p["is_finished"] for p in current_player["pieces"])
        if all_finished:
            game_state.is_game_over = 1
            game_state.winner_id = user_id
            game_state.game_phase = "finished"
            message = f"🎉 {current_player['nickname']} 获得了胜利！"
            GameBusiness._save_game_record(db, room_id, user_id, players_state)
            UserBusiness.update_score(db, user_id, 50, True)
            for i, p in enumerate(players_state):
                if p["user_id"] != user_id:
                    UserBusiness.update_score(db, p["user_id"], -20, False)
        else:
            if dice_value != 6:
                game_state.current_player_index = (game_state.current_player_index + 1) % len(players_state)
            else:
                message += "，再掷一次！"
            game_state.game_phase = "rolling"
            game_state.turn_count += 1
        
        game_state.players_state = json.dumps(players_state)
        game_state.last_action = json.dumps({"type": "move", "player": user_id, "piece_id": piece_id, "dice": dice_value})
        db.commit()
        db.refresh(game_state)
        
        return game_state, message

    @staticmethod
    def _check_collision(db: Session, players_state: List[dict], current_index: int, new_position: int) -> str:
        messages = []
        current_color_index = current_index
        track_position = new_position % 52
        
        for i, player in enumerate(players_state):
            if i == current_index:
                continue
            for piece in player["pieces"]:
                if not piece["is_home"] and not piece["is_finished"]:
                    if piece["position"] % 52 == track_position:
                        if player.get("has_shield"):
                            player["has_shield"] = False
                            messages.append(f"{player['nickname']} 的护盾抵消了攻击")
                        else:
                            piece["position"] = -1
                            piece["is_home"] = True
                            messages.append(f"{player['nickname']} 的棋子被送回了起点")
        return "，".join(messages)

    @staticmethod
    def _save_game_record(db: Session, room_id: int, winner_id: int, players_state: List[dict]):
        room = db.query(Room).filter(Room.id == room_id).first()
        record = GameRecord(
            room_id=room_id,
            room_code=room.room_code if room else "",
            player_ids=json.dumps([p["user_id"] for p in players_state]),
            winner_id=winner_id,
            game_data=json.dumps(players_state),
            start_time=datetime.now(),
            end_time=datetime.now()
        )
        db.add(record)
        db.commit()

    @staticmethod
    def get_game_records(db: Session, page: int = 1, page_size: int = 10, user_id: int = None) -> Tuple[List[GameRecord], int]:
        query = db.query(GameRecord)
        if user_id:
            query = query.filter(GameRecord.player_ids.contains(str(user_id)))
        total = query.count()
        records = query.order_by(GameRecord.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return records, total
