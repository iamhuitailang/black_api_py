from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_wangzhe_model_skills'

    TYPE_ACTIVE = 'active'
    TYPE_PASSIVE = 'passive'

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
                hero_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT DEFAULT '',
                type TEXT DEFAULT 'active',
                skill_index INTEGER DEFAULT 1,
                cooldown REAL DEFAULT 5.0,
                mana_cost INTEGER DEFAULT 50,
                damage INTEGER DEFAULT 100,
                range INTEGER DEFAULT 5,
                effects TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_hero_id ON {cls.TABLE_NAME}(hero_id)"
        db.execute(index_sql)

    def create(self, hero_id: int, name: str, description: str = '', type: str = 'active',
               skill_index: int = 1, cooldown: float = 5.0, mana_cost: int = 50,
               damage: int = 100, range: int = 5, effects: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'hero_id': hero_id,
            'name': name,
            'description': description,
            'type': type,
            'skill_index': skill_index,
            'cooldown': cooldown,
            'mana_cost': mana_cost,
            'damage': damage,
            'range': range,
            'effects': effects,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_hero_id(self, hero_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'hero_id': hero_id}, order_by='skill_index ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = data.copy()
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, hero_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if hero_id:
            conditions['hero_id'] = hero_id
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')
