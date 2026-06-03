from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScoreModel:
    TABLE_NAME = 'tb_yp_model_score'

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
                music_id INTEGER DEFAULT 0,
                score INTEGER NOT NULL,
                max_combo INTEGER DEFAULT 0,
                perfect_count INTEGER DEFAULT 0,
                good_count INTEGER DEFAULT 0,
                miss_count INTEGER DEFAULT 0,
                coins_earned INTEGER DEFAULT 0,
                distance REAL DEFAULT 0,
                play_time INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_music_id ON {cls.TABLE_NAME}(music_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at DESC)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(
            page, page_size,
            conditions={'user_id': user_id},
            order_by='score DESC, created_at DESC'
        )

    def get_leaderboard(self, music_id: int = 0, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        conditions = {}
        if music_id > 0:
            conditions['music_id'] = music_id

        sql = f"""
            SELECT s.*, u.nickname, u.avatar, u.level
            FROM {self.TABLE_NAME} s
            LEFT JOIN tb_yp_model_user u ON s.user_id = u.id
            WHERE {'music_id = ?' if music_id > 0 else '1=1'}
            ORDER BY s.score DESC
            LIMIT {page_size} OFFSET {(page - 1) * page_size}
        """
        params = (music_id,) if music_id > 0 else tuple()
        items = self.db.fetch_all(sql, params)

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE {'music_id = ?' if music_id > 0 else '1=1'}
        """
        count_result = self.db.fetch_one(count_sql, params)
        total = count_result.get('total', 0) if count_result else 0

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_user_rank(self, user_id: int, music_id: int = 0) -> int:
        sql = f"""
            SELECT COUNT(*) + 1 as rank
            FROM {self.TABLE_NAME} s1
            WHERE s1.score > (
                SELECT COALESCE(MAX(score), 0) 
                FROM {self.TABLE_NAME} s2 
                WHERE s2.user_id = ? {'AND s2.music_id = ?' if music_id > 0 else ''}
            )
            {'AND s1.music_id = ?' if music_id > 0 else ''}
        """
        params = [user_id]
        if music_id > 0:
            params.append(music_id)
            params.append(music_id)

        result = self.db.fetch_one(sql, tuple(params))
        return result.get('rank', 1) if result else 1

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_public_dict(self, score: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': score.get('id'),
            'user_id': score.get('user_id'),
            'music_id': score.get('music_id'),
            'score': score.get('score'),
            'max_combo': score.get('max_combo'),
            'perfect_count': score.get('perfect_count'),
            'good_count': score.get('good_count'),
            'miss_count': score.get('miss_count'),
            'coins_earned': score.get('coins_earned'),
            'distance': score.get('distance'),
            'play_time': score.get('play_time'),
            'nickname': score.get('nickname'),
            'avatar': score.get('avatar'),
            'level': score.get('level'),
            'created_at': score.get('created_at')
        }
