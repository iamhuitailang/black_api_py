from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class LevelModel:
    TABLE_NAME = 'tb_danzhu_model_levels'

    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_DISABLED = 2

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_NORMAL = 'normal'
    DIFFICULTY_HARD = 'hard'

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
                difficulty TEXT DEFAULT 'normal',
                background TEXT DEFAULT '',
                layout_data TEXT DEFAULT '',
                item_positions TEXT DEFAULT '',
                ball_count INTEGER DEFAULT 3,
                gravity REAL DEFAULT 0.3,
                friction REAL DEFAULT 0.99,
                bumper_score INTEGER DEFAULT 100,
                target_score INTEGER DEFAULT 1000,
                play_count INTEGER DEFAULT 0,
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)

    @classmethod
    def init_default_levels(cls):
        model = cls()
        default_levels = [
            {
                'name': '经典弹珠台',
                'description': '经典模式，适合新手入门',
                'difficulty': 'easy',
                'ball_count': 5,
                'bumper_score': 100,
                'target_score': 5000,
                'status': 1
            },
            {
                'name': '挑战模式',
                'description': '更多机关，更高分数',
                'difficulty': 'normal',
                'ball_count': 3,
                'bumper_score': 200,
                'target_score': 10000,
                'status': 1
            },
            {
                'name': '地狱模式',
                'description': '极限挑战，只有3个球',
                'difficulty': 'hard',
                'ball_count': 3,
                'bumper_score': 500,
                'target_score': 20000,
                'status': 1
            }
        ]

        for level_data in default_levels:
            existing = model.query.find_one({'name': level_data['name']})
            if not existing:
                model.create(**level_data)

    def create(self, name: str, description: str = '', difficulty: str = 'normal',
                 background: str = '', layout_data: str = '', item_positions: str = '',
                 ball_count: int = 3, gravity: float = 0.3, friction: float = 0.99,
                 bumper_score: int = 100, target_score: int = 1000,
                 status: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'difficulty': difficulty,
            'background': background,
            'layout_data': layout_data,
            'item_positions': item_positions,
            'ball_count': ball_count,
            'gravity': gravity,
            'friction': friction,
            'bumper_score': bumper_score,
            'target_score': target_score,
            'play_count': 0,
            'status': status,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_published(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            {'status': self.STATUS_PUBLISHED
        }, order_by='id ASC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'difficulty', 'background',
            'layout_data', 'item_positions',
            'ball_count', 'gravity', 'friction',
            'bumper_score', 'target_score', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_status(self, record_id: int, status: int) -> int:
        return self.update(record_id, {'status': status})

    def increment_play_count(self, record_id: int) -> int:
        level = self.get_by_id(record_id)
        if level:
            return self.update(record_id, {'play_count': level.get('play_count', 0) + 1})
        return 0

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                 status: int = None, difficulty: str = None,
                 keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if difficulty:
            conditions['difficulty'] = difficulty

        if keyword:
            return self.search(keyword, page, page_size, status, difficulty)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               status: int = None, difficulty: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if difficulty:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

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

    def get_status_text(self, status: int) -> str:
        status_map = {
            self.STATUS_DRAFT: '草稿',
            self.STATUS_PUBLISHED: '已发布',
            self.STATUS_DISABLED: '已禁用'
        }
        return status_map.get(status, '未知')

    def get_difficulty_text(self, difficulty: str) -> str:
        diff_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_NORMAL: '普通',
            self.DIFFICULTY_HARD: '困难'
        }
        return diff_map.get(difficulty, '未知')

    def to_dict(self, level: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': level.get('id'),
            'name': level.get('name'),
            'description': level.get('description'),
            'difficulty': level.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(level.get('difficulty')),
            'background': level.get('background'),
            'layout_data': level.get('layout_data'),
            'item_positions': level.get('item_positions'),
            'ball_count': level.get('ball_count'),
            'gravity': level.get('gravity'),
            'friction': level.get('friction'),
            'bumper_score': level.get('bumper_score'),
            'target_score': level.get('target_score'),
            'play_count': level.get('play_count'),
            'status': level.get('status'),
            'status_text': self.get_status_text(level.get('status')),
            'created_at': level.get('created_at'),
            'updated_at': level.get('updated_at')
        }
