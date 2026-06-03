from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserSkillModel:
    TABLE_NAME = 'tb_yp_model_user_skill'

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
                skill_id INTEGER NOT NULL,
                current_level INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_skill_id ON {cls.TABLE_NAME}(skill_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_skill ON {cls.TABLE_NAME}(user_id, skill_id)"
        db.execute(index_sql)

    def create(self, user_id: int, skill_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'skill_id': skill_id})
        if existing:
            return existing.get('id', 0)

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'skill_id': skill_id,
            'current_level': 1,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT us.*, s.name, s.description, s.icon, s.skill_type, 
                   s.tree_position, s.max_level, s.base_price, 
                   s.effect_type, s.effect_value
            FROM {self.TABLE_NAME} us
            LEFT JOIN tb_yp_model_skill s ON us.skill_id = s.id
            WHERE us.user_id = ?
            ORDER BY s.skill_type ASC, s.tree_position ASC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_user_skill(self, user_id: int, skill_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT us.*, s.name, s.description, s.icon, s.skill_type, 
                   s.tree_position, s.max_level, s.base_price, 
                   s.effect_type, s.effect_value
            FROM {self.TABLE_NAME} us
            LEFT JOIN tb_yp_model_skill s ON us.skill_id = s.id
            WHERE us.user_id = ? AND us.skill_id = ?
        """
        return self.db.fetch_one(sql, (user_id, skill_id))

    def upgrade_skill(self, user_id: int, skill_id: int) -> int:
        from app.model.yp_model.skill import SkillModel
        skill_model = SkillModel()

        user_skill = self.query.find_one({'user_id': user_id, 'skill_id': skill_id})
        skill = skill_model.get_by_id(skill_id)

        if not skill:
            return 0

        max_level = skill.get('max_level', 5)

        if not user_skill:
            return self.create(user_id, skill_id)

        current_level = user_skill.get('current_level', 0)
        if current_level >= max_level:
            return user_skill.get('id', 0)

        now = datetime.now().isoformat()
        data = {
            'current_level': current_level + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(user_skill.get('id'), data)

    def get_skill_effects(self, user_id: int) -> Dict[str, float]:
        user_skills = self.get_by_user_id(user_id)
        effects = {}

        for us in user_skills:
            effect_type = us.get('effect_type', '')
            effect_value = us.get('effect_value', 0)
            current_level = us.get('current_level', 0)

            if effect_type and current_level > 0:
                total_effect = effect_value * current_level
                effects[effect_type] = effects.get(effect_type, 0) + total_effect

        return effects

    def to_public_dict(self, user_skill: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.yp_model.skill import SkillModel
        skill_model = SkillModel()
        base_price = user_skill.get('base_price', 100)
        current_level = user_skill.get('current_level', 0)

        return {
            'id': user_skill.get('id'),
            'user_id': user_skill.get('user_id'),
            'skill_id': user_skill.get('skill_id'),
            'current_level': current_level,
            'name': user_skill.get('name'),
            'description': user_skill.get('description'),
            'icon': user_skill.get('icon'),
            'skill_type': user_skill.get('skill_type'),
            'skill_type_text': skill_model.get_skill_type_text(user_skill.get('skill_type')),
            'tree_position': user_skill.get('tree_position'),
            'max_level': user_skill.get('max_level'),
            'upgrade_price': skill_model.calculate_upgrade_price(base_price, current_level),
            'effect_type': user_skill.get('effect_type'),
            'effect_value': user_skill.get('effect_value'),
            'total_effect': user_skill.get('effect_value', 0) * current_level,
            'created_at': user_skill.get('created_at')
        }
