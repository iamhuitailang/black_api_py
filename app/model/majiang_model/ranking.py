from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class RankingModel:
    TABLE_NAME = 'tb_majiang_model_ranking'

    TYPE_DAILY = 1
    TYPE_WEEKLY = 2
    TYPE_MONTHLY = 3
    TYPE_ALL_TIME = 4

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
                ranking_type INTEGER NOT NULL,
                rank INTEGER NOT NULL,
                score INTEGER NOT NULL,
                period TEXT NOT NULL,
                wins INTEGER DEFAULT 0,
                losses INTEGER DEFAULT 0,
                max_fan INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_period ON {cls.TABLE_NAME}(user_id, ranking_type, period)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type_period ON {cls.TABLE_NAME}(ranking_type, period)"
        db.execute(index_sql2)

    def create(self, user_id: int, ranking_type: int, rank: int, score: int,
               period: str, wins: int = 0, losses: int = 0, max_fan: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'ranking_type': ranking_type,
            'rank': rank,
            'score': score,
            'period': period,
            'wins': wins,
            'losses': losses,
            'max_fan': max_fan,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_ranking(self, ranking_type: int, period: str, limit: int = 100) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.nickname, u.avatar, u.level 
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_majiang_model_user u ON r.user_id = u.id
            WHERE r.ranking_type = ? AND r.period = ?
            ORDER BY r.rank ASC
            LIMIT {limit}
        """
        return self.db.fetch_all(sql, (ranking_type, period))

    def get_user_ranking(self, user_id: int, ranking_type: int, period: str) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT r.*, u.nickname, u.avatar, u.level 
            FROM {self.TABLE_NAME} r
            LEFT JOIN tb_majiang_model_user u ON r.user_id = u.id
            WHERE r.user_id = ? AND r.ranking_type = ? AND r.period = ?
        """
        return self.db.fetch_one(sql, (user_id, ranking_type, period))

    def update_ranking_batch(self, ranking_type: int, period: str, rankings: List[Dict[str, Any]]) -> bool:
        try:
            self.exec.execute_raw(
                f"DELETE FROM {self.TABLE_NAME} WHERE ranking_type = ? AND period = ?",
                (ranking_type, period)
            )

            for rank, item in enumerate(rankings, 1):
                self.create(
                    user_id=item.get('user_id'),
                    ranking_type=ranking_type,
                    rank=rank,
                    score=item.get('score', 0),
                    period=period,
                    wins=item.get('wins', 0),
                    losses=item.get('losses', 0),
                    max_fan=item.get('max_fan', 0)
                )
            return True
        except Exception:
            return False

    def delete_old_rankings(self, days: int = 30) -> int:
        sql = f"DELETE FROM {self.TABLE_NAME} WHERE created_at < datetime('now', '-{days} days')"
        return self.exec.execute_raw(sql)

    def get_all(self, page: int = 1, page_size: int = 10, ranking_type: int = None,
                period: str = None) -> Dict[str, Any]:
        conditions = {}
        if ranking_type is not None:
            conditions['ranking_type'] = ranking_type
        if period:
            conditions['period'] = period
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_type_text(self, ranking_type: int) -> str:
        type_map = {
            self.TYPE_DAILY: '日榜',
            self.TYPE_WEEKLY: '周榜',
            self.TYPE_MONTHLY: '月榜',
            self.TYPE_ALL_TIME: '总榜'
        }
        return type_map.get(ranking_type, '未知')
