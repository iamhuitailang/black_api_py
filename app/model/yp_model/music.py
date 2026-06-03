from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MusicModel:
    TABLE_NAME = 'tb_yp_model_music'

    DIFFICULTY_EASY = 1
    DIFFICULTY_NORMAL = 2
    DIFFICULTY_HARD = 3
    DIFFICULTY_EXPERT = 4

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
                artist TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                file_path TEXT NOT NULL,
                bpm INTEGER DEFAULT 120,
                duration INTEGER DEFAULT 0,
                difficulty INTEGER DEFAULT 2,
                beat_data TEXT DEFAULT '',
                is_custom INTEGER DEFAULT 0,
                user_id INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_bpm ON {cls.TABLE_NAME}(bpm)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)

    @classmethod
    def init_default_music(cls):
        model = cls()
        default_music = [
            {
                'name': '电子节拍',
                'artist': 'YP Studio',
                'cover': 'cover1',
                'file_path': '/static/yp_web/audio/music1.mp3',
                'bpm': 128,
                'duration': 180,
                'difficulty': cls.DIFFICULTY_EASY,
                'beat_data': '[]',
                'is_custom': 0,
                'user_id': 0
            },
            {
                'name': '霓虹之夜',
                'artist': 'YP Studio',
                'cover': 'cover2',
                'file_path': '/static/yp_web/audio/music2.mp3',
                'bpm': 140,
                'duration': 200,
                'difficulty': cls.DIFFICULTY_NORMAL,
                'beat_data': '[]',
                'is_custom': 0,
                'user_id': 0
            },
            {
                'name': '极速狂飙',
                'artist': 'YP Studio',
                'cover': 'cover3',
                'file_path': '/static/yp_web/audio/music3.mp3',
                'bpm': 160,
                'duration': 220,
                'difficulty': cls.DIFFICULTY_HARD,
                'beat_data': '[]',
                'is_custom': 0,
                'user_id': 0
            },
            {
                'name': '终极挑战',
                'artist': 'YP Studio',
                'cover': 'cover4',
                'file_path': '/static/yp_web/audio/music4.mp3',
                'bpm': 180,
                'duration': 240,
                'difficulty': cls.DIFFICULTY_EXPERT,
                'beat_data': '[]',
                'is_custom': 0,
                'user_id': 0
            }
        ]

        for music in default_music:
            existing = model.query.find_one({'name': music['name']})
            if not existing:
                now = datetime.now().isoformat()
                music['created_at'] = now
                music['updated_at'] = now
                music['is_active'] = 1
                model.exec.insert(music)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        data['is_active'] = 1
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_active(self, include_custom: bool = False, user_id: int = 0) -> List[Dict[str, Any]]:
        if include_custom and user_id > 0:
            sql = f"""
                SELECT * FROM {self.TABLE_NAME} 
                WHERE is_active = 1 AND (is_custom = 0 OR user_id = ?)
                ORDER BY difficulty ASC, bpm ASC
            """
            return self.db.fetch_all(sql, (user_id,))
        else:
            return self.query.find_all(
                {'is_active': 1, 'is_custom': 0},
                order_by='difficulty ASC, bpm ASC'
            )

    def get_all(self, page: int = 1, page_size: int = 10, difficulty: int = None,
                is_custom: int = None) -> Dict[str, Any]:
        conditions = {}
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        if is_custom is not None:
            conditions['is_custom'] = is_custom
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'artist', 'cover', 'file_path', 'bpm', 'duration',
            'difficulty', 'beat_data', 'is_active'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.update_by_id(record_id, {'is_active': 0, 'updated_at': datetime.now().isoformat()})

    def get_difficulty_text(self, difficulty: int) -> str:
        difficulty_map = {
            self.DIFFICULTY_EASY: '简单',
            self.DIFFICULTY_NORMAL: '普通',
            self.DIFFICULTY_HARD: '困难',
            self.DIFFICULTY_EXPERT: '专家'
        }
        return difficulty_map.get(difficulty, '未知')

    def to_public_dict(self, music: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': music.get('id'),
            'name': music.get('name'),
            'artist': music.get('artist'),
            'cover': music.get('cover'),
            'file_path': music.get('file_path'),
            'bpm': music.get('bpm'),
            'duration': music.get('duration'),
            'difficulty': music.get('difficulty'),
            'difficulty_text': self.get_difficulty_text(music.get('difficulty')),
            'beat_data': music.get('beat_data'),
            'is_custom': music.get('is_custom'),
            'user_id': music.get('user_id'),
            'is_active': music.get('is_active')
        }
