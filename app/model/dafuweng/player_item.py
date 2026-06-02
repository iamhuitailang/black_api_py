from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlayerItemModel:
    TABLE_NAME = 'tb_dafuweng_model_player_item'

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
                item_id INTEGER NOT NULL,
                count INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_id ON {cls.TABLE_NAME}(game_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_game_user ON {cls.TABLE_NAME}(game_id, user_id)"
        db.execute(index_sql)

    def create(self, game_id: int, user_id: int, item_id: int, count: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'game_id': game_id,
            'user_id': user_id,
            'item_id': item_id,
            'count': count,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_game_and_user(self, game_id: int, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'game_id': game_id, 'user_id': user_id}, order_by='id ASC')

    def add_item(self, game_id: int, user_id: int, item_id: int, count: int = 1) -> int:
        existing = self.query.find_one({
            'game_id': game_id,
            'user_id': user_id,
            'item_id': item_id
        })

        if existing:
            new_count = existing.get('count', 0) + count
            data = {'count': new_count}
            return self.exec.update_by_id(existing.get('id'), data)
        else:
            return self.create(game_id, user_id, item_id, count)

    def use_item(self, game_id: int, user_id: int, item_id: int, count: int = 1) -> int:
        existing = self.query.find_one({
            'game_id': game_id,
            'user_id': user_id,
            'item_id': item_id
        })

        if not existing:
            return 0

        current_count = existing.get('count', 0)
        if current_count < count:
            return 0

        new_count = current_count - count
        if new_count <= 0:
            return self.exec.delete_by_id(existing.get('id'))
        else:
            data = {'count': new_count}
            return self.exec.update_by_id(existing.get('id'), data)

    def delete_by_game(self, game_id: int) -> int:
        return self.exec.execute_raw(
            f"DELETE FROM {self.TABLE_NAME} WHERE game_id = ?",
            (game_id,)
        )
