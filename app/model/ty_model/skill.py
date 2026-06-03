from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_ty_model_skills'

    STATUS_ACTIVE = 1
    STATUS_INACTIVE = 0

    CATEGORY_ATTACK = 'attack'
    CATEGORY_DEFENSE = 'defense'
    CATEGORY_SUPPORT = 'support'
    CATEGORY_PASSIVE = 'passive'

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
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '',
                max_level INTEGER DEFAULT 10,
                base_effect TEXT,
                effect_per_level TEXT,
                unlock_level INTEGER DEFAULT 1,
                gold_cost INTEGER DEFAULT 100,
                exp_cost INTEGER DEFAULT 50,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlock_level ON {cls.TABLE_NAME}(unlock_level)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)

    def create(self, name: str, category: str, description: str = '',
               icon: str = '', max_level: int = 10,
               base_effect: str = '', effect_per_level: str = '',
               unlock_level: int = 1, gold_cost: int = 100,
               exp_cost: int = 50) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'category': category,
            'description': description,
            'icon': icon,
            'max_level': max_level,
            'base_effect': base_effect,
            'effect_per_level': effect_per_level,
            'unlock_level': unlock_level,
            'gold_cost': gold_cost,
            'exp_cost': exp_cost,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 20,
                category: str = None, unlock_level: int = None,
                status: int = 1) -> Dict[str, Any]:
        conditions = {'status': status}
        if category:
            conditions['category'] = category
        if unlock_level:
            conditions['unlock_level'] = unlock_level

        return self.query.paginate(page, page_size, conditions, order_by='unlock_level ASC, id ASC')

    def get_available_for_level(self, user_level: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["status = 1", "unlock_level <= ?"]
        params = [user_level]

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY unlock_level ASC, id ASC
            LIMIT ? OFFSET ?
        """
        params.extend([page_size, offset])
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_category_text(self, category: str) -> str:
        category_map = {
            self.CATEGORY_ATTACK: '攻击',
            self.CATEGORY_DEFENSE: '防御',
            self.CATEGORY_SUPPORT: '辅助',
            self.CATEGORY_PASSIVE: '被动'
        }
        return category_map.get(category, '其他')

    def calculate_effect(self, skill: Dict[str, Any], current_level: int) -> Dict[str, Any]:
        import json
        base_effect = {}
        effect_per_level = {}

        try:
            if skill.get('base_effect'):
                base_effect = json.loads(skill.get('base_effect'))
            if skill.get('effect_per_level'):
                effect_per_level = json.loads(skill.get('effect_per_level'))
        except:
            pass

        result = {}
        for key, base_value in base_effect.items():
            per_level = effect_per_level.get(key, 0)
            result[key] = base_value + per_level * max(0, current_level - 1)

        return result

    def to_public_dict(self, skill: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': skill.get('id'),
            'name': skill.get('name'),
            'category': skill.get('category'),
            'category_text': self.get_category_text(skill.get('category', '')),
            'description': skill.get('description'),
            'icon': skill.get('icon'),
            'max_level': skill.get('max_level'),
            'base_effect': skill.get('base_effect'),
            'effect_per_level': skill.get('effect_per_level'),
            'unlock_level': skill.get('unlock_level'),
            'gold_cost': skill.get('gold_cost'),
            'exp_cost': skill.get('exp_cost'),
            'status': skill.get('status'),
            'created_at': skill.get('created_at')
        }
