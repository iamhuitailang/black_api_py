from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserSkillModel:
    TABLE_NAME = 'tb_ty_model_user_skills'

    STATUS_ACTIVE = 1
    STATUS_INACTIVE = 0

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
                level INTEGER DEFAULT 1,
                exp INTEGER DEFAULT 0,
                is_equipped INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_equipped ON {cls.TABLE_NAME}(user_id, is_equipped)"
        db.execute(index_sql)

    def unlock_skill(self, user_id: int, skill_id: int) -> int:
        existing = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id
        })

        if existing:
            return existing.get('id')

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'skill_id': skill_id,
            'level': 1,
            'exp': 0,
            'is_equipped': 0,
            'status': self.STATUS_ACTIVE,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def upgrade_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        from app.model.ty_model.skill import SkillModel
        skill_model = SkillModel()

        user_skill = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id,
            'status': self.STATUS_ACTIVE
        })

        if not user_skill:
            return {'success': False, 'msg': '技能未解锁'}

        skill = skill_model.get_by_id(skill_id)
        if not skill:
            return {'success': False, 'msg': '技能不存在'}

        current_level = user_skill.get('level', 1)
        max_level = skill.get('max_level', 10)

        if current_level >= max_level:
            return {'success': False, 'msg': '已达最高等级'}

        now = datetime.now().isoformat()
        new_level = current_level + 1
        affected = self.exec.update_by_id(user_skill.get('id'), {
            'level': new_level,
            'updated_at': now
        })

        return {
            'success': affected > 0,
            'new_level': new_level,
            'msg': '升级成功' if affected > 0 else '升级失败'
        }

    def add_exp(self, user_id: int, skill_id: int, exp: int) -> Dict[str, Any]:
        user_skill = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id,
            'status': self.STATUS_ACTIVE
        })

        if not user_skill:
            return {'success': False, 'level_up': False}

        current_exp = user_skill.get('exp', 0) + exp
        current_level = user_skill.get('level', 1)
        level_up = False
        new_level = current_level

        exp_needed = current_level * 100
        while current_exp >= exp_needed and current_level < 10:
            current_exp -= exp_needed
            new_level += 1
            level_up = True
            current_level = new_level
            exp_needed = new_level * 100

        now = datetime.now().isoformat()
        data = {
            'exp': current_exp,
            'level': new_level,
            'updated_at': now
        }
        affected = self.exec.update_by_id(user_skill.get('id'), data)

        return {
            'success': affected > 0,
            'level_up': level_up,
            'new_level': new_level,
            'remaining_exp': current_exp
        }

    def equip_skill(self, user_id: int, skill_id: int, equip: bool = True) -> int:
        user_skill = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id,
            'status': self.STATUS_ACTIVE
        })

        if not user_skill:
            return 0

        now = datetime.now().isoformat()
        return self.exec.update_by_id(user_skill.get('id'), {
            'is_equipped': 1 if equip else 0,
            'updated_at': now
        })

    def get_by_user_id(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        sql = f"""
            SELECT us.*, s.name, s.category, s.description, s.icon, s.max_level,
                   s.base_effect, s.effect_per_level, s.unlock_level, s.gold_cost, s.exp_cost
            FROM {self.TABLE_NAME} us
            LEFT JOIN tb_ty_model_skills s ON us.skill_id = s.id
            WHERE us.user_id = ? AND us.status = 1
            ORDER BY us.is_equipped DESC, us.level DESC, us.id DESC
            LIMIT ? OFFSET ?
        """
        offset = (page - 1) * page_size
        items = self.db.fetch_all(sql, (user_id, page_size, offset))

        count_sql = f"""
            SELECT COUNT(*) as total FROM {self.TABLE_NAME}
            WHERE user_id = ? AND status = 1
        """
        total_result = self.db.fetch_one(count_sql, (user_id,))
        total = total_result['total'] if total_result else 0

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_equipped_skills(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT us.*, s.name, s.category, s.description, s.icon, s.max_level,
                   s.base_effect, s.effect_per_level
            FROM {self.TABLE_NAME} us
            LEFT JOIN tb_ty_model_skills s ON us.skill_id = s.id
            WHERE us.user_id = ? AND us.status = 1 AND us.is_equipped = 1
            ORDER BY us.level DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def has_skill(self, user_id: int, skill_id: int) -> bool:
        result = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id,
            'status': self.STATUS_ACTIVE
        })
        return result is not None

    def get_skill_level(self, user_id: int, skill_id: int) -> int:
        result = self.query.find_one({
            'user_id': user_id,
            'skill_id': skill_id,
            'status': self.STATUS_ACTIVE
        })
        return result.get('level', 0) if result else 0

    def to_public_dict(self, item: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.ty_model.skill import SkillModel
        skill_model = SkillModel()

        return {
            'id': item.get('id'),
            'user_id': item.get('user_id'),
            'skill_id': item.get('skill_id'),
            'level': item.get('level'),
            'exp': item.get('exp'),
            'is_equipped': item.get('is_equipped'),
            'name': item.get('name'),
            'category': item.get('category'),
            'category_text': skill_model.get_category_text(item.get('category', '')),
            'description': item.get('description'),
            'icon': item.get('icon'),
            'max_level': item.get('max_level'),
            'unlock_level': item.get('unlock_level'),
            'current_effect': skill_model.calculate_effect(item, item.get('level', 1)),
            'created_at': item.get('created_at')
        }
