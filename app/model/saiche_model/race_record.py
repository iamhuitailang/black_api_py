from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class RaceRecordModel:
    TABLE_NAME = 'tb_saiche_model_race_records'

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
                track_id INTEGER NOT NULL,
                car_id INTEGER NOT NULL,
                finish_time REAL DEFAULT 0,
                best_lap REAL DEFAULT 0,
                rank INTEGER DEFAULT 0,
                is_winner INTEGER DEFAULT 0,
                reward_coins INTEGER DEFAULT 0,
                reward_exp INTEGER DEFAULT 0,
                used_items TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_track_id ON {cls.TABLE_NAME}(track_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_track ON {cls.TABLE_NAME}(user_id, track_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_finish_time ON {cls.TABLE_NAME}(track_id, finish_time)"
        db.execute(index_sql)

    def create(self, user_id: int, track_id: int, car_id: int,
               finish_time: float, best_lap: float, rank: int,
               is_winner: int, reward_coins: int, reward_exp: int,
               used_items: List[Dict[str, Any]] = None) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'track_id': track_id,
            'car_id': car_id,
            'finish_time': finish_time,
            'best_lap': best_lap,
            'rank': rank,
            'is_winner': is_winner,
            'reward_coins': reward_coins,
            'reward_exp': reward_exp,
            'used_items': json.dumps(used_items) if used_items else '',
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        record = self.query.find_by_id(record_id)
        if record and record.get('used_items'):
            try:
                record['used_items'] = json.loads(record['used_items'])
            except:
                pass
        return record

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10,
                         track_id: int = None) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if track_id:
            conditions['track_id'] = track_id

        result = self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

        for item in result.get('items', []):
            if item.get('used_items'):
                try:
                    item['used_items'] = json.loads(item['used_items'])
                except:
                    pass

        return result

    def get_best_record(self, user_id: int, track_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE user_id = ? AND track_id = ?
            ORDER BY finish_time ASC
            LIMIT 1
        """
        result = self.db.fetch_one(sql, (user_id, track_id))
        if result and result.get('used_items'):
            try:
                result['used_items'] = json.loads(result['used_items'])
            except:
                pass
        return result

    def get_track_best_records(self, track_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_saiche_model_users u ON r.user_id = u.id
            WHERE r.track_id = ? AND u.status = 0
            ORDER BY r.finish_time ASC
            LIMIT {limit}
        """
        items = self.db.fetch_all(sql, (track_id,))
        for item in items:
            if item.get('used_items'):
                try:
                    item['used_items'] = json.loads(item['used_items'])
                except:
                    pass
        return items

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_races,
                SUM(is_winner) as win_count,
                AVG(finish_time) as avg_time,
                MIN(finish_time) as best_time,
                SUM(reward_coins) as total_coins,
                SUM(reward_exp) as total_exp,
                COUNT(DISTINCT track_id) as track_count
            FROM {self.TABLE_NAME}
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        return result or {
            'total_races': 0,
            'win_count': 0,
            'avg_time': 0,
            'best_time': 0,
            'total_coins': 0,
            'total_exp': 0,
            'track_count': 0
        }

    def get_consecutive_wins(self, user_id: int) -> int:
        sql = f"""
            SELECT is_winner, created_at
            FROM {self.TABLE_NAME}
            WHERE user_id = ?
            ORDER BY created_at DESC
        """
        records = self.db.fetch_all(sql, (user_id,))

        consecutive = 0
        for record in records:
            if record.get('is_winner') == 1:
                consecutive += 1
            else:
                break

        return consecutive

    def get_total_coins_earned(self, user_id: int) -> int:
        sql = f"SELECT COALESCE(SUM(reward_coins), 0) as total FROM {self.TABLE_NAME} WHERE user_id = ?"
        result = self.db.fetch_one(sql, (user_id,))
        return result.get('total', 0) if result else 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        used_items = record.get('used_items')
        if isinstance(used_items, str):
            try:
                used_items = json.loads(used_items)
            except:
                used_items = []

        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'track_id': record.get('track_id'),
            'car_id': record.get('car_id'),
            'finish_time': round(record.get('finish_time', 0), 2),
            'best_lap': round(record.get('best_lap', 0), 2),
            'rank': record.get('rank'),
            'is_winner': record.get('is_winner'),
            'reward_coins': record.get('reward_coins'),
            'reward_exp': record.get('reward_exp'),
            'used_items': used_items,
            'nickname': record.get('nickname'),
            'avatar': record.get('avatar'),
            'created_at': record.get('created_at')
        }
