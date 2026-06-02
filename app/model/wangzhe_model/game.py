from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameModel:
    TABLE_NAME = 'tb_wangzhe_model_games'

    STATUS_WAITING = 'waiting'
    STATUS_PLAYING = 'playing'
    STATUS_FINISHED = 'finished'
    STATUS_CANCELLED = 'cancelled'

    MODE_5V5 = '5v5'
    MODE_3V3 = '3v3'
    MODE_1V1 = '1v1'

    RESULT_WIN = 'win'
    RESULT_LOSE = 'lose'
    RESULT_DRAW = 'draw'

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
                room_id TEXT NOT NULL UNIQUE,
                mode TEXT DEFAULT '5v5',
                status TEXT DEFAULT 'waiting',
                blue_team_score INTEGER DEFAULT 0,
                red_team_score INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                result TEXT DEFAULT NULL,
                mvp_user_id INTEGER DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                started_at TIMESTAMP DEFAULT NULL,
                ended_at TIMESTAMP DEFAULT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_mode ON {cls.TABLE_NAME}(mode)"
        db.execute(index_sql2)

    def create(self, room_id: str, mode: str = '5v5') -> int:
        now = datetime.now().isoformat()
        data = {
            'room_id': room_id,
            'mode': mode,
            'status': self.STATUS_WAITING,
            'blue_team_score': 0,
            'red_team_score': 0,
            'duration': 0,
            'result': None,
            'mvp_user_id': None,
            'created_at': now,
            'started_at': None,
            'ended_at': None,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_room_id(self, room_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'room_id': room_id})

    def start_game(self, game_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_PLAYING,
            'started_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def end_game(self, game_id: int, result: str, blue_score: int, red_score: int, 
                 duration: int, mvp_user_id: int = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_FINISHED,
            'result': result,
            'blue_team_score': blue_score,
            'red_team_score': red_score,
            'duration': duration,
            'mvp_user_id': mvp_user_id,
            'ended_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def cancel_game(self, game_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'ended_at': now,
            'updated_at': now
        }
        return self.exec.update_by_id(game_id, data)

    def get_user_games(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME} g
            INNER JOIN tb_wangzhe_model_game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = ? AND g.status = 'finished'
        """
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT g.*, gp.team, gp.hero_id, gp.kills, gp.deaths, gp.assists, gp.gold_earned 
            FROM {self.TABLE_NAME} g
            INNER JOIN tb_wangzhe_model_game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = ? AND g.status = 'finished'
            ORDER BY g.ended_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, (user_id,))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_all(self, page: int = 1, page_size: int = 20, status: str = None,
                mode: str = None) -> Dict[str, Any]:
        conditions = {}
        if status:
            conditions['status'] = status
        if mode:
            conditions['mode'] = mode
        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def get_game_statistics(self) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_games,
                SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished_games,
                AVG(CASE WHEN status = 'finished' THEN duration ELSE NULL END) as avg_duration,
                SUM(CASE WHEN mode = '5v5' AND status = 'finished' THEN 1 ELSE 0 END) as mode_5v5_count,
                SUM(CASE WHEN mode = '3v3' AND status = 'finished' THEN 1 ELSE 0 END) as mode_3v3_count,
                SUM(CASE WHEN mode = '1v1' AND status = 'finished' THEN 1 ELSE 0 END) as mode_1v1_count
            FROM {self.TABLE_NAME}
        """
        return self.db.fetch_one(sql) or {}

    def to_public_dict(self, game: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': game.get('id'),
            'room_id': game.get('room_id'),
            'mode': game.get('mode'),
            'status': game.get('status'),
            'blue_team_score': game.get('blue_team_score'),
            'red_team_score': game.get('red_team_score'),
            'duration': game.get('duration'),
            'result': game.get('result'),
            'mvp_user_id': game.get('mvp_user_id'),
            'created_at': game.get('created_at'),
            'started_at': game.get('started_at'),
            'ended_at': game.get('ended_at')
        }
