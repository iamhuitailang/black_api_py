from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class XiangqiLeaderboardModel:
    TABLE_NAME = 'tb_xiangqi077_model_leaderboard'

    PERIOD_DAILY = 0
    PERIOD_WEEKLY = 1
    PERIOD_MONTHLY = 2
    PERIOD_ALL = 3

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
                nickname TEXT DEFAULT '',
                score INTEGER DEFAULT 0,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                draws INTEGER DEFAULT 0,
                period INTEGER DEFAULT 3,
                period_key TEXT DEFAULT '',
                rank INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_period ON {cls.TABLE_NAME}(period)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_period_key ON {cls.TABLE_NAME}(period_key)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score)"
        db.execute(index_sql)

    def upsert_user_score(self, user_id: int, nickname: str, score_delta: int,
                          win_delta: int = 0, loss_delta: int = 0, draw_delta: int = 0,
                          period: int = 3, period_key: str = '') -> int:
        existing = self.query.find_one({
            'user_id': user_id,
            'period': period,
            'period_key': period_key
        })
        now = datetime.now().isoformat()
        if existing:
            new_score = existing.get('score', 0) + score_delta
            new_wins = existing.get('wins', 0) + win_delta
            new_losses = existing.get('losses', 0) + loss_delta
            new_draws = existing.get('draws', 0) + draw_delta
            data = {
                'nickname': nickname,
                'score': new_score,
                'wins': new_wins,
                'losses': new_losses,
                'draws': new_draws,
                'updated_at': now
            }
            self.exec.update_by_id(existing.get('id'), data)
            return existing.get('id')
        else:
            data = {
                'user_id': user_id,
                'nickname': nickname,
                'score': 1000 + score_delta,
                'wins': win_delta,
                'losses': loss_delta,
                'draws': draw_delta,
                'period': period,
                'period_key': period_key,
                'rank': 0,
                'created_at': now,
                'updated_at': now
            }
            return self.exec.insert(data)

    def get_leaderboard(self, period: int = 3, period_key: str = '', limit: int = 50) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE period = ? AND period_key = ?
            ORDER BY score DESC
            LIMIT {limit}
        """
        items = self.db.fetch_all(sql, (period, period_key))
        for i, item in enumerate(items):
            item['rank'] = i + 1
        return items

    def get_user_rank(self, user_id: int, period: int = 3, period_key: str = '') -> Optional[Dict[str, Any]]:
        record = self.query.find_one({
            'user_id': user_id,
            'period': period,
            'period_key': period_key
        })
        if record:
            rank_sql = f"""
                SELECT COUNT(*) + 1 as rank FROM {self.TABLE_NAME}
                WHERE period = ? AND period_key = ? AND score > ?
            """
            rank_result = self.db.fetch_one(rank_sql, (period, period_key, record.get('score', 0)))
            record['rank'] = rank_result['rank'] if rank_result else 0
        return record

    def get_all(self, page: int = 1, page_size: int = 10, period: int = None) -> Dict[str, Any]:
        conditions = {}
        if period is not None:
            conditions['period'] = period
        return self.query.paginate(page, page_size, conditions, order_by='score DESC')

    def to_dict(self, record: Dict[str, Any]) -> Dict[str, Any]:
        period_map = {self.PERIOD_DAILY: '日榜', self.PERIOD_WEEKLY: '周榜',
                      self.PERIOD_MONTHLY: '月榜', self.PERIOD_ALL: '总榜'}
        return {
            'id': record.get('id'),
            'user_id': record.get('user_id'),
            'nickname': record.get('nickname'),
            'score': record.get('score'),
            'wins': record.get('wins'),
            'losses': record.get('losses'),
            'draws': record.get('draws'),
            'period': record.get('period'),
            'period_text': period_map.get(record.get('period'), '未知'),
            'period_key': record.get('period_key'),
            'rank': record.get('rank', 0),
            'created_at': record.get('created_at')
        }
