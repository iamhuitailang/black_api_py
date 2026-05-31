from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AiConfigModel:
    TABLE_NAME = 'tb_doudizhu_model_ai_configs'

    DIFFICULTY_EASY = 0
    DIFFICULTY_MEDIUM = 1
    DIFFICULTY_HARD = 2

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
                difficulty INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                think_time INTEGER DEFAULT 1000,
                bomb_probability REAL DEFAULT 0.3,
                single_probability REAL DEFAULT 0.5,
                is_default INTEGER DEFAULT 0,
                status INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)

    @classmethod
    def init_default_configs(cls):
        model = cls()
        configs = [
            {'name': '简单AI', 'difficulty': cls.DIFFICULTY_EASY, 'description': '适合新手玩家', 'think_time': 500, 'bomb_probability': 0.1, 'single_probability': 0.7, 'is_default': 1},
            {'name': '普通AI', 'difficulty': cls.DIFFICULTY_MEDIUM, 'description': '适合有一定经验的玩家', 'think_time': 1000, 'bomb_probability': 0.3, 'single_probability': 0.5, 'is_default': 1},
            {'name': '困难AI', 'difficulty': cls.DIFFICULTY_HARD, 'description': '适合高手玩家', 'think_time': 1500, 'bomb_probability': 0.5, 'single_probability': 0.3, 'is_default': 1},
        ]
        for config in configs:
            existing = model.query.find_one({'name': config['name']})
            if not existing:
                model.create(**config)

    def create(self, name: str, difficulty: int, description: str = '', think_time: int = 1000,
               bomb_probability: float = 0.3, single_probability: float = 0.5, is_default: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'difficulty': difficulty,
            'description': description,
            'think_time': think_time,
            'bomb_probability': bomb_probability,
            'single_probability': single_probability,
            'is_default': is_default,
            'status': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_difficulty(self, difficulty: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'difficulty': difficulty, 'is_default': 1})

    def get_all(self, page: int = 1, page_size: int = 10, difficulty: int = None) -> Dict[str, Any]:
        conditions = {}
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        return self.query.paginate(page, page_size, conditions, order_by='difficulty ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'difficulty', 'description', 'think_time', 'bomb_probability', 'single_probability', 'is_default', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'status': status,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_difficulty_text(self, difficulty: int) -> str:
        difficulty_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_MEDIUM: '普通',
            self.DIFFICULTY_HARD: '困难'
        }
        return difficulty_map.get(difficulty, '未知')

    def to_dict(self, config: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': config.get('id'),
            'name': config.get('name'),
            'difficulty': config.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(config.get('difficulty')),
            'description': config.get('description'),
            'think_time': config.get('think_time'),
            'bomb_probability': config.get('bomb_probability'),
            'single_probability': config.get('single_probability'),
            'is_default': config.get('is_default'),
            'status': config.get('status'),
            'created_at': config.get('created_at')
        }
