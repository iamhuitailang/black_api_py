from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SkillModel:
    TABLE_NAME = 'tb_jn_skills'

    TYPE_OFFER = 'offer'
    TYPE_NEED = 'need'

    LEVEL_BEGINNER = '初级'
    LEVEL_INTERMEDIATE = '中级'
    LEVEL_ADVANCED = '高级'

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
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL DEFAULT 'offer',
                level TEXT DEFAULT '初级',
                description TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql3)
        index_sql4 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql4)

    def create(self, user_id: int, name: str, category: str, skill_type: str,
               level: str = LEVEL_BEGINNER, description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'category': category,
            'type': skill_type,
            'level': level,
            'description': description,
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int, skill_type: str = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id, 'is_active': 1}
        if skill_type:
            conditions['type'] = skill_type
        return self.query.find_all(conditions, order_by='id DESC')

    def get_by_type(self, skill_type: str, page: int = 1, page_size: int = 10,
                    category: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {'type': skill_type, 'is_active': 1}
        if category:
            conditions['category'] = category

        if keyword:
            return self.search(keyword, page, page_size, skill_type, category)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               skill_type: str = None, category: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["is_active = 1"]
        params = []

        if skill_type:
            where_clauses.append("type = ?")
            params.append(skill_type)

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def get_all(self, page: int = 1, page_size: int = 10,
                skill_type: str = None, category: str = None,
                user_id: int = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {'is_active': 1}
        if skill_type:
            conditions['type'] = skill_type
        if category:
            conditions['category'] = category
        if user_id:
            conditions['user_id'] = user_id

        if keyword:
            return self.search(keyword, page, page_size, skill_type, category)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, skill_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'category', 'level', 'description', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(skill_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def deactivate(self, skill_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_active': 0,
            'updated_at': now
        }
        return self.exec.update_by_id(skill_id, data)

    def get_offer_skills_by_category(self, category: str, exclude_user_id: int = None) -> List[Dict[str, Any]]:
        conditions = {'type': self.TYPE_OFFER, 'category': category, 'is_active': 1}
        skills = self.query.find_all(conditions, order_by='id DESC')

        if exclude_user_id:
            skills = [s for s in skills if s.get('user_id') != exclude_user_id]

        return skills

    def to_dict(self, skill: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': skill.get('id'),
            'user_id': skill.get('user_id'),
            'name': skill.get('name'),
            'category': skill.get('category'),
            'type': skill.get('type'),
            'type_text': '提供' if skill.get('type') == self.TYPE_OFFER else '需求',
            'level': skill.get('level'),
            'description': skill.get('description'),
            'is_active': skill.get('is_active'),
            'created_at': skill.get('created_at')
        }
