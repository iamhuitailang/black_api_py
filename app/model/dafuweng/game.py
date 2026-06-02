from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameModel:
    TABLE_NAME = 'tb_dafuweng_model_game'

    STATUS_WAITING = 0
    STATUS_PLAYING = 1
    STATUS_FINISHED = 2

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
                name TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                current_turn INTEGER DEFAULT 0,
                max_rounds INTEGER DEFAULT 20,
                max_players INTEGER DEFAULT 4,
                current_round INTEGER DEFAULT 0,
                creator_id INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN name TEXT DEFAULT ''")
        except:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN max_players INTEGER DEFAULT 4")
        except:
            pass
        try:
            db.execute(f"ALTER TABLE {cls.TABLE_NAME} ADD COLUMN creator_id INTEGER DEFAULT 0")
        except:
            pass

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_created_at ON {cls.TABLE_NAME}(created_at)"
        db.execute(index_sql)

    def create(self, max_rounds: int = 20, name: str = '', max_players: int = 4, creator_id: int = 0) -> int:
        now_dt = datetime.now()
        now = now_dt.isoformat()
        data = {
            'name': name or f'房间{int(now_dt.timestamp())}',
            'status': self.STATUS_WAITING,
            'current_turn': 0,
            'max_rounds': max_rounds,
            'max_players': max_players,
            'current_round': 0,
            'creator_id': creator_id,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, game_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'status', 'current_turn', 'max_rounds', 'max_players', 'current_round', 'creator_id'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(game_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_WAITING: '等待中',
            self.STATUS_PLAYING: '进行中',
            self.STATUS_FINISHED: '已结束'
        }
        return status_map.get(status, '未知')
