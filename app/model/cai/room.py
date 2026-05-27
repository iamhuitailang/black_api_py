from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import uuid
import random


class RoomModel:
    TABLE_NAME = 'tb_cai_rooms'

    STATUS_WAITING = 0
    STATUS_PLAYING = 1
    STATUS_FINISHED = 2

    MODE_SINGLE = 1
    MODE_DOUBLE = 2

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_code TEXT NOT NULL UNIQUE,
                mode INTEGER DEFAULT 1,
                status INTEGER DEFAULT 0,
                player1_id INTEGER DEFAULT 0,
                player1_name TEXT DEFAULT '',
                player1_score INTEGER DEFAULT 0,
                player2_id INTEGER DEFAULT 0,
                player2_name TEXT DEFAULT '',
                player2_score INTEGER DEFAULT 0,
                current_drawer INTEGER DEFAULT 1,
                current_animal_id INTEGER DEFAULT 0,
                current_animal_name TEXT DEFAULT '',
                round INTEGER DEFAULT 1,
                max_rounds INTEGER DEFAULT 5,
                time_limit INTEGER DEFAULT 60,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_room_code ON {cls.TABLE_NAME}(room_code)"
        db.execute(index_sql)

    def _generate_room_code(self) -> str:
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    def create(self, mode: int, player_name: str, player_id: int = 0, max_rounds: int = 5, time_limit: int = 60) -> int:
        room_code = self._generate_room_code()
        while self.get_by_code(room_code):
            room_code = self._generate_room_code()

        now = datetime.now().isoformat()
        data = {
            'room_code': room_code,
            'mode': mode,
            'status': self.STATUS_WAITING,
            'player1_id': player_id,
            'player1_name': player_name,
            'player1_score': 0,
            'player2_id': 0,
            'player2_name': 'AI玩家' if mode == self.MODE_SINGLE else '',
            'player2_score': 0,
            'current_drawer': 1,
            'current_animal_id': 0,
            'current_animal_name': '',
            'round': 1,
            'max_rounds': max_rounds,
            'time_limit': time_limit,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_code(self, room_code: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'room_code': room_code})

    def join_room(self, room_id: int, player_name: str, player_id: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'player2_id': player_id,
            'player2_name': player_name,
            'status': self.STATUS_PLAYING,
            'updated_at': now
        }
        return self.exec.update_by_id(room_id, data)

    def update_status(self, room_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(room_id, data)

    def update_current_animal(self, room_id: int, animal_id: int, animal_name: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'current_animal_id': animal_id,
            'current_animal_name': animal_name,
            'updated_at': now
        }
        return self.exec.update_by_id(room_id, data)

    def update_score(self, room_id: int, player_num: int, score: int) -> int:
        now = datetime.now().isoformat()
        key = f'player{player_num}_score'
        data = {
            key: score,
            'updated_at': now
        }
        return self.exec.update_by_id(room_id, data)

    def add_score(self, room_id: int, player_num: int, add_score: int) -> int:
        room = self.get_by_id(room_id)
        if not room:
            return 0
        key = f'player{player_num}_score'
        current_score = room.get(key, 0)
        return self.update_score(room_id, player_num, current_score + add_score)

    def switch_drawer(self, room_id: int) -> int:
        room = self.get_by_id(room_id)
        if not room:
            return 0
        current = room.get('current_drawer', 1)
        next_drawer = 2 if current == 1 else 1
        now = datetime.now().isoformat()
        data = {
            'current_drawer': next_drawer,
            'updated_at': now
        }
        return self.exec.update_by_id(room_id, data)

    def next_round(self, room_id: int) -> int:
        room = self.get_by_id(room_id)
        if not room:
            return 0
        current_round = room.get('round', 1)
        max_rounds = room.get('max_rounds', 5)
        now = datetime.now().isoformat()

        if current_round >= max_rounds * 2:
            data = {
                'status': self.STATUS_FINISHED,
                'updated_at': now
            }
            return self.exec.update_by_id(room_id, data)
        else:
            current_drawer = room.get('current_drawer', 1)
            next_drawer = 2 if current_drawer == 1 else 1
            next_round = current_round + 1
            data = {
                'round': next_round,
                'current_drawer': next_drawer,
                'current_animal_id': 0,
                'current_animal_name': '',
                'updated_at': now
            }
            return self.exec.update_by_id(room_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_waiting_rooms(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'status': self.STATUS_WAITING, 'mode': self.MODE_DOUBLE}, order_by='created_at DESC')

    def get_list(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_WAITING: '等待中',
            self.STATUS_PLAYING: '游戏中',
            self.STATUS_FINISHED: '已结束'
        }
        return status_map.get(status, '未知')

    def get_mode_text(self, mode: int) -> str:
        mode_map = {
            self.MODE_SINGLE: '单人模式',
            self.MODE_DOUBLE: '双人模式'
        }
        return mode_map.get(mode, '未知')

    def to_dict(self, room: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': room.get('id'),
            'room_code': room.get('room_code'),
            'mode': room.get('mode'),
            'mode_text': self.get_mode_text(room.get('mode')),
            'status': room.get('status'),
            'status_text': self.get_status_text(room.get('status')),
            'player1_id': room.get('player1_id'),
            'player1_name': room.get('player1_name'),
            'player1_score': room.get('player1_score'),
            'player2_id': room.get('player2_id'),
            'player2_name': room.get('player2_name'),
            'player2_score': room.get('player2_score'),
            'current_drawer': room.get('current_drawer'),
            'current_animal_id': room.get('current_animal_id'),
            'current_animal_name': room.get('current_animal_name'),
            'round': room.get('round'),
            'max_rounds': room.get('max_rounds'),
            'time_limit': room.get('time_limit'),
            'created_at': room.get('created_at')
        }
