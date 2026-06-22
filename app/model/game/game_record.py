from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameRecordModel:
    TABLE_NAME = 'game_record'

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
                score INTEGER NOT NULL DEFAULT 0,
                towers_destroyed INTEGER NOT NULL DEFAULT 0,
                stage1_destroyed INTEGER NOT NULL DEFAULT 0,
                stage2_destroyed INTEGER NOT NULL DEFAULT 0,
                stage3_destroyed INTEGER NOT NULL DEFAULT 0,
                remaining_hp INTEGER NOT NULL DEFAULT 0,
                stages_cleared INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_score ON {cls.TABLE_NAME}(score DESC)"
        db.execute(index_sql)

    def create(self, player_name: str, score: int, towers_destroyed: int,
               stage1_destroyed: int, stage2_destroyed: int, stage3_destroyed: int,
               remaining_hp: int, stages_cleared: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'player_name': player_name,
            'score': score,
            'towers_destroyed': towers_destroyed,
            'stage1_destroyed': stage1_destroyed,
            'stage2_destroyed': stage2_destroyed,
            'stage3_destroyed': stage3_destroyed,
            'remaining_hp': remaining_hp,
            'stages_cleared': stages_cleared,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_leaderboard(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC, towers_destroyed DESC, remaining_hp DESC', limit=limit)

    def get_top_scores(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='score DESC, towers_destroyed DESC, remaining_hp DESC', limit=limit)

    def count(self) -> int:
        return self.query.count()

    def paginate(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='score DESC, towers_destroyed DESC, remaining_hp DESC')
