from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameRecordModel:
    TABLE_NAME = 'tb_majiang_model_game_record'

    STATUS_PLAYING = 0
    STATUS_FINISHED = 1
    STATUS_CANCELLED = 2

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
                user_id INTEGER NOT NULL,
                ai_ids TEXT NOT NULL,
                difficulty INTEGER NOT NULL,
                status INTEGER DEFAULT 0,
                winner TEXT DEFAULT '',
                winner_type TEXT DEFAULT '',
                fan INTEGER DEFAULT 0,
                fan_details TEXT DEFAULT '',
                scores TEXT DEFAULT '',
                coins_change INTEGER DEFAULT 0,
                start_time TIMESTAMP NOT NULL,
                end_time TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql3)

    def create(self, user_id: int, ai_ids: List[int], difficulty: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'ai_ids': json.dumps(ai_ids),
            'difficulty': difficulty,
            'status': self.STATUS_PLAYING,
            'winner': '',
            'winner_type': '',
            'fan': 0,
            'fan_details': '',
            'scores': '',
            'coins_change': 0,
            'start_time': now,
            'end_time': None,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record:
            return self._parse_record(record)
        return None

    def _parse_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        try:
            record['ai_ids'] = json.loads(record.get('ai_ids', '[]'))
        except (json.JSONDecodeError, TypeError):
            record['ai_ids'] = []

        try:
            record['scores'] = json.loads(record.get('scores', '{}'))
        except (json.JSONDecodeError, TypeError):
            record['scores'] = {}

        try:
            record['fan_details'] = json.loads(record.get('fan_details', '[]')) if record.get('fan_details') else []
        except (json.JSONDecodeError, TypeError):
            record['fan_details'] = []

        return record

    def update_game_result(self, record_id: int, winner: str, winner_type: str, fan: int,
                           fan_details: List[Dict[str, Any]], scores: Dict[str, Any],
                           coins_change: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_FINISHED,
            'winner': winner,
            'winner_type': winner_type,
            'fan': fan,
            'fan_details': json.dumps(fan_details),
            'scores': json.dumps(scores),
            'coins_change': coins_change,
            'end_time': now
        }
        return self.exec.update_by_id(record_id, data)

    def cancel_game(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': self.STATUS_CANCELLED,
            'end_time': now
        }
        return self.exec.update_by_id(record_id, data)

    def get_user_games(self, user_id: int, page: int = 1, page_size: int = 10,
                       status: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if status is not None:
            conditions['status'] = status

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def get_user_recent_games(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE user_id = ? AND status = 1
            ORDER BY id DESC 
            LIMIT {limit}
        """
        records = self.db.fetch_all(sql, (user_id,))
        return [self._parse_record(r) for r in records]

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None,
                difficulty: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if difficulty is not None:
            conditions['difficulty'] = difficulty

        result = self.query.paginate(page, page_size, conditions, order_by='id DESC')
        result['items'] = [self._parse_record(item) for item in result.get('items', [])]
        return result

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_PLAYING: '进行中',
            self.STATUS_FINISHED: '已完成',
            self.STATUS_CANCELLED: '已取消'
        }
        return status_map.get(status, '未知')

    def get_statistics(self, user_id: int = None) -> Dict[str, Any]:
        where_clause = "WHERE status = 1"
        params = []

        if user_id is not None:
            where_clause += " AND user_id = ?"
            params.append(user_id)

        total_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} {where_clause}"
        total = self.db.fetch_one(total_sql, tuple(params)) or {}

        win_sql = f"SELECT COUNT(*) as wins FROM {self.TABLE_NAME} {where_clause} AND winner_type = 'user'"
        wins = self.db.fetch_one(win_sql, tuple(params)) or {}

        fan_sql = f"SELECT MAX(fan) as max_fan, AVG(fan) as avg_fan FROM {self.TABLE_NAME} {where_clause}"
        fan_stats = self.db.fetch_one(fan_sql, tuple(params)) or {}

        total_games = total.get('total', 0)
        total_wins = wins.get('wins', 0)

        return {
            'total_games': total_games,
            'wins': total_wins,
            'losses': total_games - total_wins,
            'win_rate': round(total_wins / max(1, total_games) * 100, 2),
            'max_fan': fan_stats.get('max_fan', 0) or 0,
            'avg_fan': round(fan_stats.get('avg_fan', 0) or 0, 2)
        }
