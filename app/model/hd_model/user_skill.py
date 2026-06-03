from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
from app.model.hd_model.skill import SkillModel


class UserSkillModel:
    TABLE_NAME = 'tb_hd_model_user_skill'

    MAX_LEVEL = 10
    EXP_PER_LEVEL = 100

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)
        self.skill_model = SkillModel()

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
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    def create(self, user_id: int, skill_id: int, level: int = 1,
                 exp: int = 0, is_active: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'skill_id': skill_id,
            'level': level,
            'exp': exp,
            'is_active': is_active,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'level', 'exp', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                user_id: int = None, skill_id: int = None,
                is_active: int = None, order_by: str = 'id DESC') -> Dict[str, Any]:
        conditions = {}
        if user_id:
            conditions['user_id'] = user_id
        if skill_id:
            conditions['skill_id'] = skill_id
        if is_active is not None:
            conditions['is_active'] = is_active
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_user_skills(self, user_id: int, is_active: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if is_active is not None:
            conditions['is_active'] = is_active

        sql = f"""
            SELECT us.*, s.name, s.description, s.type, s.damage, 
                   s.chakra_cost, s.cooldown, s.icon, s.level as base_level
            FROM {self.TABLE_NAME} us
            LEFT JOIN {SkillModel.TABLE_NAME} s ON us.skill_id = s.id
            WHERE us.user_id = ?
            { 'AND us.is_active = ?' if is_active is not None else '' }
            ORDER BY us.level DESC, us.exp DESC
        """
        params = [user_id]
        if is_active is not None:
            params.append(is_active)

        results = self.db.fetch_all(sql, tuple(params))
        skills = []
        for row in results:
            skill = dict(row)
            skill['type_text'] = self.skill_model.get_type_text(skill.get('type'))
            skill['actual_damage'] = int(skill.get('damage', 0) * (1 + 0.1 * (skill.get('level', 1) - 1)))
            skill['exp_needed'] = self._get_exp_needed(skill.get('level', 1))
            skills.append(skill)
        return skills

    def get_user_skill(self, user_id: int, skill_id: int) -> Optional[Dict[str, Any]]:
        sql = f"""
            SELECT us.*, s.name, s.description, s.type, s.damage, 
                   s.chakra_cost, s.cooldown, s.icon, s.level as base_level
            FROM {self.TABLE_NAME} us
            LEFT JOIN {SkillModel.TABLE_NAME} s ON us.skill_id = s.id
            WHERE us.user_id = ? AND us.skill_id = ?
        """
        result = self.db.fetch_one(sql, (user_id, skill_id))
        if result:
            skill = dict(result)
            skill['type_text'] = self.skill_model.get_type_text(skill.get('type'))
            skill['actual_damage'] = int(skill.get('damage', 0) * (1 + 0.1 * (skill.get('level', 1) - 1)))
            skill['exp_needed'] = self._get_exp_needed(skill.get('level', 1))
            return skill
        return None

    def has_skill(self, user_id: int, skill_id: int) -> bool:
        return self.query.exists({'user_id': user_id, 'skill_id': skill_id})

    def learn_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        skill = self.skill_model.get_by_id(skill_id)
        if not skill:
            return {'success': False, 'message': '技能不存在'}

        if self.has_skill(user_id, skill_id):
            return {'success': False, 'message': '已学习该技能'}

        record_id = self.create(user_id, skill_id)
        if record_id:
            return {'success': True, 'message': '学习成功', 'id': record_id}
        return {'success': False, 'message': '学习失败'}

    def upgrade_skill(self, user_id: int, skill_id: int, add_exp: int) -> Dict[str, Any]:
        user_skill = self.get_user_skill(user_id, skill_id)
        if not user_skill:
            return {'success': False, 'message': '未学习该技能'}

        if user_skill.get('is_active', 0) != 1:
            return {'success': False, 'message': '技能已被禁用'}

        current_level = user_skill.get('level', 1)
        current_exp = user_skill.get('exp', 0)
        total_exp = current_exp + add_exp

        new_level = current_level
        exp_needed = self._get_exp_needed(current_level)

        while total_exp >= exp_needed and new_level < self.MAX_LEVEL:
            total_exp -= exp_needed
            new_level += 1
            exp_needed = self._get_exp_needed(new_level)

        level_up = new_level > current_level

        now = datetime.now().isoformat()
        update_data = {
            'level': new_level,
            'exp': total_exp,
            'updated_at': now
        }

        rows = self.exec.update_by_id(user_skill['id'], update_data)
        if rows > 0:
            return {
                'success': True,
                'message': '升级成功' if level_up else '经验增加成功',
                'level_up': level_up,
                'new_level': new_level,
                'new_exp': total_exp,
                'exp_needed': self._get_exp_needed(new_level)
            }
        return {'success': False, 'message': '升级失败'}

    def toggle_active(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        user_skill = self.query.find_one({'user_id': user_id, 'skill_id': skill_id})
        if not user_skill:
            return {'success': False, 'message': '未学习该技能'}

        new_status = 0 if user_skill.get('is_active', 1) == 1 else 1
        now = datetime.now().isoformat()
        rows = self.exec.update_by_id(user_skill['id'], {
            'is_active': new_status,
            'updated_at': now
        })

        if rows > 0:
            return {
                'success': True,
                'message': '已启用' if new_status == 1 else '已禁用',
                'is_active': new_status
            }
        return {'success': False, 'message': '操作失败'}

    def delete_user_skill(self, user_id: int, skill_id: int) -> Dict[str, Any]:
        conditions = {'user_id': user_id, 'skill_id': skill_id}
        rows = self.exec.delete(conditions)
        if rows > 0:
            return {'success': True, 'message': '删除成功'}
        return {'success': False, 'message': '删除失败或技能不存在'}

    def get_active_skill_count(self, user_id: int) -> int:
        return self.query.count({'user_id': user_id, 'is_active': 1})

    def get_user_skill_stats(self, user_id: int) -> Dict[str, Any]:
        sql = f"""
            SELECT 
                COUNT(*) as total_skills,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_skills,
                AVG(level) as avg_level,
                SUM(exp) as total_exp
            FROM {self.TABLE_NAME}
            WHERE user_id = ?
        """
        result = self.db.fetch_one(sql, (user_id,))
        return result if result else {
            'total_skills': 0,
            'active_skills': 0,
            'avg_level': 0,
            'total_exp': 0
        }

    def _get_exp_needed(self, level: int) -> int:
        if level >= self.MAX_LEVEL:
            return 0
        return self.EXP_PER_LEVEL * level
