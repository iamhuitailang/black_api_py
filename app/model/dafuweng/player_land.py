from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerLandModel:
    TABLE_NAME = 'tb_dafuweng_model_player_land'

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
                game_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                cell_id INTEGER NOT NULL,
                level INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_cell ON {cls.TABLE_NAME}(game_id, cell_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_user ON {cls.TABLE_NAME}(game_id, user_id)"
        db.execute(index_sql)

    def create(self, game_id: int, user_id: int, cell_id: int, level: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'cell_id': cell_id,
            'level': level,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id, 'user_id': user_id}, order_by='id ASC')

    def get_by_game_and_cell(self, game_id: int, cell_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'game_id': game_id, 'cell_id': cell_id})

    def update_level(self, land_id: int, level: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'level': level,
            'updated_at': now
        }
        return self.exec.update_by_id(land_id, data)

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )

    def count_by_game_and_user(self, game_id: int, user_id: int) -> int:
        return self.query.count({'game_id': game_id, 'user_id': user_id})

    def get_by_game_id(self, game_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id}, order_by='id ASC')
