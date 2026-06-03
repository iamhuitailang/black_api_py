from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class CharacterModel:
    TABLE_NAME = 'tb_yp_model_character'

    RARITY_COMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

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
                description TEXT DEFAULT '',
                avatar TEXT DEFAULT '',
                rarity INTEGER DEFAULT 1,
                price INTEGER DEFAULT 0,
                speed_bonus REAL DEFAULT 0,
                jump_bonus REAL DEFAULT 0,
                score_bonus REAL DEFAULT 0,
                is_default INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)

    @classmethod
    def init_default_characters(cls):
        model = cls()
        default_characters = [
            {
                'name': '都市跑者',
                'description': '初始角色，平衡型选手',
                'avatar': 'runner1',
                'rarity': cls.RARITY_COMMON,
                'price': 0,
                'speed_bonus': 1.0,
                'jump_bonus': 1.0,
                'score_bonus': 1.0,
                'is_default': 1
            },
            {
                'name': '街舞达人',
                'description': '跳跃力强，适合高难度关卡',
                'avatar': 'dancer',
                'rarity': cls.RARITY_RARE,
                'price': 500,
                'speed_bonus': 1.0,
                'jump_bonus': 1.2,
                'score_bonus': 1.0,
                'is_default': 0
            },
            {
                'name': '音乐精灵',
                'description': '节拍得分加成更高',
                'avatar': 'elf',
                'rarity': cls.RARITY_EPIC,
                'price': 1500,
                'speed_bonus': 1.0,
                'jump_bonus': 1.0,
                'score_bonus': 1.3,
                'is_default': 0
            },
            {
                'name': '霓虹骑士',
                'description': '全能型传奇角色',
                'avatar': 'knight',
                'rarity': cls.RARITY_LEGENDARY,
                'price': 5000,
                'speed_bonus': 1.1,
                'jump_bonus': 1.15,
                'score_bonus': 1.2,
                'is_default': 0
            }
        ]

        for char in default_characters:
            existing = model.query.find_one({'name': char['name']})
            if not existing:
                now = datetime.now().isoformat()
                char['created_at'] = now
                char['updated_at'] = now
                char['is_active'] = 1
                model.exec.insert(char)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        data['is_active'] = 1
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='rarity DESC, id ASC')

    def get_all(self, page: int = 1, page_size: int = 10, rarity: int = None) -> Dict[str, Any]:
        conditions = {}
        if rarity is not None:
            conditions['rarity'] = rarity
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'avatar', 'rarity', 'price',
            'speed_bonus', 'jump_bonus', 'score_bonus', 'is_default', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'is_active': 0, 'updated_at': datetime.now().isoformat()})

    def get_rarity_text(self, rarity: int) -> str:
        rarity_map = {
            self.RARITY_COMMON: '普通',
            self.RARITY_RARE: '稀有',
            self.RARITY_EPIC: '史诗',
            self.RARITY_LEGENDARY: '传奇'
        }
        return rarity_map.get(rarity, '未知')

    def to_public_dict(self, character: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': character.get('id'),
            'name': character.get('name'),
            'description': character.get('description'),
            'avatar': character.get('avatar'),
            'rarity': character.get('rarity'),
            'rarity_text': self.get_rarity_text(character.get('rarity')),
            'price': character.get('price'),
            'speed_bonus': character.get('speed_bonus'),
            'jump_bonus': character.get('jump_bonus'),
            'score_bonus': character.get('score_bonus'),
            'is_default': character.get('is_default'),
            'is_active': character.get('is_active')
        }
