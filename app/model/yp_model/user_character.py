from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserCharacterModel:
    TABLE_NAME = 'tb_yp_model_user_character'

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
                character_id INTEGER NOT NULL,
                is_using INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_character_id ON {cls.TABLE_NAME}(character_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_char ON {cls.TABLE_NAME}(user_id, character_id)"
        db.execute(index_sql)

    def create(self, user_id: int, character_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'character_id': character_id})
        if existing:
            return 0

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'character_id': character_id,
            'is_using': 0,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT uc.*, c.name, c.description, c.avatar, c.rarity, 
                   c.speed_bonus, c.jump_bonus, c.score_bonus, c.price
            FROM {self.TABLE_NAME} uc
            LEFT JOIN tb_yp_model_character c ON uc.character_id = c.id
            WHERE uc.user_id = ?
            ORDER BY uc.is_using DESC, c.rarity DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_using_character(self, user_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT uc.*, c.name, c.description, c.avatar, c.rarity, 
                   c.speed_bonus, c.jump_bonus, c.score_bonus, c.price
            FROM {self.TABLE_NAME} uc
            LEFT JOIN tb_yp_model_character c ON uc.character_id = c.id
            WHERE uc.user_id = ? AND uc.is_using = 1
            LIMIT 1
        """
        return self.db.fetch_one(sql, (user_id,))

    def set_using_character(self, user_id: int, character_id: int) -> int:
        self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET is_using = 0 WHERE user_id = ?",
            (user_id,)
        )
        return self.exec.execute_raw(
            f"UPDATE {self.TABLE_NAME} SET is_using = 1 WHERE user_id = ? AND character_id = ?",
            (user_id, character_id)
        )

    def owns_character(self, user_id: int, character_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'character_id': character_id})

    def to_public_dict(self, user_char: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.yp_model.character import CharacterModel
        char_model = CharacterModel()
        return {
            'id': user_char.get('id'),
            'user_id': user_char.get('user_id'),
            'character_id': user_char.get('character_id'),
            'is_using': user_char.get('is_using'),
            'name': user_char.get('name'),
            'description': user_char.get('description'),
            'avatar': user_char.get('avatar'),
            'rarity': user_char.get('rarity'),
            'rarity_text': char_model.get_rarity_text(user_char.get('rarity')),
            'price': user_char.get('price'),
            'speed_bonus': user_char.get('speed_bonus'),
            'jump_bonus': user_char.get('jump_bonus'),
            'score_bonus': user_char.get('score_bonus'),
            'created_at': user_char.get('created_at')
        }
