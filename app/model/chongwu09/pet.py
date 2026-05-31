from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PetModel:
    TABLE_NAME = 'tb_chongwu09_model_pet'

    TYPE_DOG = 'dog'
    TYPE_CAT = 'cat'
    TYPE_BIRD = 'bird'
    TYPE_FISH = 'fish'
    TYPE_OTHER = 'other'

    PET_TYPES = [
        {'code': TYPE_DOG, 'name': '犬类'},
        {'code': TYPE_CAT, 'name': '猫类'},
        {'code': TYPE_BIRD, 'name': '鸟类'},
        {'code': TYPE_FISH, 'name': '鱼类'},
        {'code': TYPE_OTHER, 'name': '其他'},
    ]

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
                pet_type TEXT NOT NULL,
                breed TEXT DEFAULT '',
                age TEXT DEFAULT '',
                weight TEXT DEFAULT '',
                gender TEXT DEFAULT '',
                photo TEXT DEFAULT '',
                health_info TEXT DEFAULT '',
                vaccine_status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_pet_type ON {cls.TABLE_NAME}(pet_type)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str, pet_type: str, breed: str = '',
               age: str = '', weight: str = '', gender: str = '', photo: str = '',
               health_info: str = '', vaccine_status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'pet_type': pet_type,
            'breed': breed,
            'age': age,
            'weight': weight,
            'gender': gender,
            'photo': photo,
            'health_info': health_info,
            'vaccine_status': vaccine_status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user(self, user_id: int) -> list:
        return self.query.find_all({'user_id': user_id}, order_by='id DESC')

    def update(self, pet_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'pet_type', 'breed', 'age', 'weight', 'gender',
            'photo', 'health_info', 'vaccine_status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(pet_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, pet_type: str = None,
                keyword: str = None, user_id: int = None) -> Dict[str, Any]:
        conditions = {}
        if pet_type:
            conditions['pet_type'] = pet_type
        if user_id:
            conditions['user_id'] = user_id
        if keyword:
            return self.search(keyword, page, page_size, pet_type, user_id)
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               pet_type: str = None, user_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        where_clauses = ["1=1"]
        params = []
        if pet_type:
            where_clauses.append("pet_type = ?")
            params.append(pet_type)
        if user_id:
            where_clauses.append("user_id = ?")
            params.append(user_id)
        where_clauses.append("(name LIKE ? OR breed LIKE ?)")
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

    def get_type_name(self, pet_type: str) -> str:
        for t in self.PET_TYPES:
            if t['code'] == pet_type:
                return t['name']
        return '其他'

    def to_dict(self, pet: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': pet.get('id'),
            'user_id': pet.get('user_id'),
            'name': pet.get('name'),
            'pet_type': pet.get('pet_type'),
            'pet_type_name': self.get_type_name(pet.get('pet_type')),
            'breed': pet.get('breed'),
            'age': pet.get('age'),
            'weight': pet.get('weight'),
            'gender': pet.get('gender'),
            'photo': pet.get('photo'),
            'health_info': pet.get('health_info'),
            'vaccine_status': pet.get('vaccine_status'),
            'created_at': pet.get('created_at'),
            'updated_at': pet.get('updated_at')
        }
