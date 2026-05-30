from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = "tb_zashua02_model_game_state"

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
                level INTEGER DEFAULT 1,
                score INTEGER DEFAULT 0,
                hp INTEGER DEFAULT 100,
                max_hp INTEGER DEFAULT 100,
                combo INTEGER DEFAULT 0,
                max_combo INTEGER DEFAULT 0,
                difficulty TEXT DEFAULT 'normal',
                theme TEXT DEFAULT 'circus',
                character_type TEXT DEFAULT 'clown',
                props_data TEXT DEFAULT '',
                teammates_data TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    def create(self, user_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        defaults = {
            "level": 1,
            "score": 0,
            "hp": 100,
            "max_hp": 100,
            "combo": 0,
            "max_combo": 0,
            "difficulty": "normal",
            "theme": "circus",
            "character_type": "clown",
            "props_data": "",
            "teammates_data": "",
            "created_at": now,
            "updated_at": now
        }
        data = {**defaults, **kwargs, "user_id": user_id}
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int) -> Optional[Dict[str, Any]]:
        results = self.query.find_all({"user_id": user_id}, limit=1, order_by="id DESC")
        return results[0] if results else None

    def update(self, state_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        kwargs["updated_at"] = now
        return self.exec.update_by_id(state_id, kwargs)

    def save_by_user(self, user_id: int, **kwargs) -> int:
        existing = self.get_by_user(user_id)
        if existing:
            return self.update(existing["id"], **kwargs)
        else:
            return self.create(user_id, **kwargs)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def list_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by="updated_at DESC")
