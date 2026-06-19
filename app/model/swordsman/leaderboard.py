from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LeaderboardModel:
    TABLE_NAME = 'swordsman_leaderboard'

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
                player_name TEXT NOT NULL,
                score INTEGER NOT NULL,
                kills INTEGER DEFAULT 0,
                areas_cleared INTEGER DEFAULT 0,
                remaining_hp INTEGER DEFAULT 0,
                season TEXT DEFAULT '1',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_season ON {cls.TABLE_NAME}(season)"
        db.execute(index_sql2)

    def create(self, player_name: str, score: int, kills: int, areas_cleared: int, remaining_hp: int, season: str = '1') -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'score': score,
            'kills': kills,
            'areas_cleared': areas_cleared,
            'remaining_hp': remaining_hp,
            'season': season,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_top(self, limit: int = 10, season: str = '1') -> List[Dict[str, Any]]:
        return self.query.find_all({'season': season}, order_by='score DESC', limit=limit)

    def get_player_best(self, player_name: str, season: str = '1') -> Optional[Dict[str, Any]]:
        return self.query.find_one({'player_name': player_name, 'season': season}, order_by='score DESC')

    def get_rank(self, score: int, season: str = '1') -> int:
        sql = f"SELECT COUNT(*) as rank FROM {self.TABLE_NAME} WHERE season = ? AND score > ?"
        result = self.db.fetch_one(sql, (season, score))
        return (result['rank'] if result else 0) + 1

    def paginate(self, page: int = 1, page_size: int = 10, season: str = '1') -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'season': season}, order_by='score DESC')
