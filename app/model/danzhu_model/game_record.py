from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class GameRecordModel:
    TABLE_NAME = 'tb_danzhu_model_game_records'

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
                level_id INTEGER DEFAULT 0,
                score_id INTEGER DEFAULT 0,
                score INTEGER DEFAULT 0,
                combo_max INTEGER DEFAULT 0,
                combo_count INTEGER DEFAULT 0,
                balls_used INTEGER DEFAULT 0,
                play_duration INTEGER DEFAULT 0,
                hit_count INTEGER DEFAULT 0,
                hit_details TEXT DEFAULT '',
                item_hits TEXT DEFAULT '',
                new_achievements TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_id ON {cls.TABLE_NAME}(level_id)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at DESC)"
        db.execute(index_sql3)

    def create(self, user_id: int, level_id: int = 0, score_id: int = 0,
                 score: int = 0, combo_max: int = 0, combo_count: int = 0,
                 balls_used: int = 0, play_duration: int = 0, hit_count: int = 0,
                 hit_details: str = '', item_hits: str = '',
                 new_achievements: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'level_id': level_id,
            'score_id': score_id,
            'score': score,
            'combo_max': combo_max,
            'combo_count': combo_count,
            'balls_used': balls_used,
            'play_duration': play_duration,
            'hit_count': hit_count,
            'hit_details': hit_details,
            'item_hits': item_hits,
            'new_achievements': new_achievements,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_recent(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'user_id': user_id}, order_by='created_at DESC', limit=limit)

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size, {'user_id': user_id}, order_by='created_at DESC')

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, level_id: int = None,
                 start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if level_id:
            conditions['level_id'] = level_id

        if start_date or end_date:
            return self.search_with_date(page, page_size, user_id, level_id, start_date, end_date)

        return self.query.paginate(page, page_size, conditions, order_by='created_at DESC')

    def search_with_date(self, page: int = 1, page_size: int = 10,
                         user_id: int = None, level_id: int = None,
                         start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        if level_id:
            where_clauses.append("level_id = ?")
            params.append(level_id)

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT gr.*, u.nickname, u.avatar
            FROM {self.TABLE_NAME} gr
            LEFT JOIN tb_danzhu_model_users u ON gr.user_id = u.id
            WHERE {' AND '.join(where_clauses)}
            ORDER BY gr.created_at DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_item_hit_statistics(self, level_id: int = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        where_clauses = ["1=1"]
        params = []

        if level_id and level_id > 0:
            where_clauses.append("level_id = ?")
            params.append(level_id)

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)

        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        sql = f"""
            SELECT 
                SUM(score) as total_score,
                SUM(hit_count) as total_hits,
                SUM(combo_count) as total_combos,
                AVG(combo_max) as avg_combo_max,
                AVG(play_duration) as avg_duration,
                COUNT(*) as total_games,
                COUNT(DISTINCT user_id) as total_players
            FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
        """
        result = self.db.fetch_one(sql, tuple(params) if params else None)

        return result or {
            'total_score': 0,
            'total_hits': 0,
            'total_combos': 0,
            'avg_combo_max': 0,
            'avg_duration': 0,
            'total_games': 0,
            'total_players': 0
        }

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        hit_details = record.get('hit_details', '')
        item_hits = record.get('item_hits', '')
        new_achievements = record.get('new_achievements', '')

        try:
            if hit_details:
                hit_details = json.loads(hit_details)
        except (json.JSONDecodeError, TypeError):
            pass

        try:
            if item_hits:
                item_hits = json.loads(item_hits)
        except (json.JSONDecodeError, TypeError):
            pass

        try:
            if new_achievements:
                new_achievements = json.loads(new_achievements)
        except (json.JSONDecodeError, TypeError):
            pass

        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'level_id': record.get('level_id'),
            'score_id': record.get('score_id'),
            'score': record.get('score'),
            'combo_max': record.get('combo_max'),
            'combo_count': record.get('combo_count'),
            'balls_used': record.get('balls_used'),
            'play_duration': record.get('play_duration'),
            'hit_count': record.get('hit_count'),
            'hit_details': hit_details,
            'item_hits': item_hits,
            'new_achievements': new_achievements,
            'nickname': record.get('nickname'),
            'avatar': record.get('avatar'),
            'created_at': record.get('created_at')
        }
