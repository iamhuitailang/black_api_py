from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PetModel:
    TABLE_NAME = 'tb_chongwu_pet'

    SPECIES_DOG = 'dog'
    SPECIES_CAT = 'cat'
    SPECIES_HAMSTER = 'hamster'
    SPECIES_RABBIT = 'rabbit'
    SPECIES_BIRD = 'bird'
    SPECIES_FISH = 'fish'
    SPECIES_OTHER = 'other'

    SPECIES_MAP = {
        SPECIES_DOG: '狗',
        SPECIES_CAT: '猫',
        SPECIES_HAMSTER: '仓鼠',
        SPECIES_RABBIT: '兔子',
        SPECIES_BIRD: '鸟',
        SPECIES_FISH: '鱼',
        SPECIES_OTHER: '其他',
    }

    GENDER_MALE = 'male'
    GENDER_FEMALE = 'female'
    GENDER_UNKNOWN = 'unknown'

    GENDER_MAP = {
        GENDER_MALE: '男孩',
        GENDER_FEMALE: '女孩',
        GENDER_UNKNOWN: '未知',
    }

    PERSONALITY_TAGS = ['活泼', '高冷', '粘人', '胆小', '贪吃', '爱睡']

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
                nickname TEXT NOT NULL,
                species TEXT NOT NULL DEFAULT 'other',
                breed TEXT DEFAULT '',
                birthday TEXT DEFAULT '',
                estimated_age TEXT DEFAULT '',
                gender TEXT DEFAULT 'unknown',
                weight REAL DEFAULT 0,
                weight_unit TEXT DEFAULT 'kg',
                coat_color TEXT DEFAULT '',
                chip_number TEXT DEFAULT '',
                personality_tags TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_species ON {cls.TABLE_NAME}(species)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_nickname ON {cls.TABLE_NAME}(nickname)"
        db.execute(index_sql)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        insert_data = {
            'nickname': data.get('nickname', ''),
            'species': data.get('species', 'other'),
            'breed': data.get('breed', ''),
            'birthday': data.get('birthday', ''),
            'estimated_age': data.get('estimated_age', ''),
            'gender': data.get('gender', 'unknown'),
            'weight': data.get('weight', 0),
            'weight_unit': data.get('weight_unit', 'kg'),
            'coat_color': data.get('coat_color', ''),
            'chip_number': data.get('chip_number', ''),
            'personality_tags': data.get('personality_tags', ''),
            'avatar': data.get('avatar', ''),
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(insert_data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                species: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if species:
            conditions['species'] = species

        if keyword:
            return self.search(keyword, page, page_size, species)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               species: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if species:
            where_clauses.append("species = ?")
            params.append(species)

        where_clauses.append("(nickname LIKE ? OR breed LIKE ? OR coat_color LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern, like_pattern])

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

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'nickname', 'species', 'breed', 'birthday', 'estimated_age',
            'gender', 'weight', 'weight_unit', 'coat_color', 'chip_number',
            'personality_tags', 'avatar'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_species_text(self, species: str) -> str:
        return self.SPECIES_MAP.get(species, '未知')

    def get_gender_text(self, gender: str) -> str:
        return self.GENDER_MAP.get(gender, '未知')

    def to_dict(self, pet: Dict[str, Any]) -> Dict[str, Any]:
        tags_str = pet.get('personality_tags', '')
        tags = tags_str.split(',') if tags_str else []
        return {
            'id': pet.get('id'),
            'nickname': pet.get('nickname'),
            'species': pet.get('species'),
            'species_text': self.get_species_text(pet.get('species', '')),
            'breed': pet.get('breed'),
            'birthday': pet.get('birthday'),
            'estimated_age': pet.get('estimated_age'),
            'gender': pet.get('gender'),
            'gender_text': self.get_gender_text(pet.get('gender', '')),
            'weight': pet.get('weight'),
            'weight_unit': pet.get('weight_unit'),
            'coat_color': pet.get('coat_color'),
            'chip_number': pet.get('chip_number'),
            'personality_tags': tags,
            'avatar': pet.get('avatar'),
            'created_at': pet.get('created_at'),
            'updated_at': pet.get('updated_at'),
        }