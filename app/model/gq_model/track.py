import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqTrackModel:
    TABLE_NAME = 'tb_gq_model_track'

    DIFFICULTY_EASY = 1
    DIFFICULTY_NORMAL = 2
    DIFFICULTY_HARD = 3
    DIFFICULTY_EXPERT = 4
    DIFFICULTY_MASTER = 5

    CATEGORY_CLASSIC = 'classic'
    CATEGORY_POP = 'pop'
    CATEGORY_ROCK = 'rock'
    CATEGORY_JAZZ = 'jazz'
    CATEGORY_ELECTRONIC = 'electronic'
    CATEGORY_ORIGINAL = 'original'

    CATEGORIES = [CATEGORY_CLASSIC, CATEGORY_POP, CATEGORY_ROCK, CATEGORY_JAZZ, CATEGORY_ELECTRONIC, CATEGORY_ORIGINAL]

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
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                difficulty INTEGER DEFAULT 1,
                notes TEXT DEFAULT '[]',
                bpm INTEGER DEFAULT 120,
                duration INTEGER DEFAULT 0,
                unlock_level INTEGER DEFAULT 1,
                unlock_coins INTEGER DEFAULT 0,
                cover TEXT DEFAULT '',
                category TEXT DEFAULT 'classic',
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_category ON {cls.TABLE_NAME}(category)"
        db.execute(index_sql2)
        index_sql3 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlock_level ON {cls.TABLE_NAME}(unlock_level)"
        db.execute(index_sql3)

    def create(self, title: str, description: str = '', difficulty: int = 1, notes: str = '[]',
               bpm: int = 120, duration: int = 0, unlock_level: int = 1, unlock_coins: int = 0,
               cover: str = '', category: str = 'classic', is_default: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'description': description,
            'difficulty': difficulty,
            'notes': notes,
            'bpm': bpm,
            'duration': duration,
            'unlock_level': unlock_level,
            'unlock_coins': unlock_coins,
            'cover': cover,
            'category': category,
            'is_default': is_default,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, track_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'description', 'difficulty', 'notes', 'bpm', 'duration',
            'unlock_level', 'unlock_coins', 'cover', 'category', 'is_default'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(track_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, difficulty: int = None,
                category: str = None, keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if difficulty is not None:
            conditions['difficulty'] = difficulty
        if category:
            conditions['category'] = category

        if keyword:
            return self._search(keyword, page, page_size, difficulty, category)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def _search(self, keyword: str, page: int = 1, page_size: int = 10,
                difficulty: int = None, category: str = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if difficulty is not None:
            where_clauses.append("difficulty = ?")
            params.append(difficulty)

        if category:
            where_clauses.append("category = ?")
            params.append(category)

        where_clauses.append("(title LIKE ? OR description LIKE ?)")
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

    def get_default_tracks(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_default': 1}, order_by='difficulty ASC')

    @classmethod
    def init_default_tracks(cls) -> None:
        instance = cls()
        existing = instance.get_default_tracks()
        if existing:
            return

        default_tracks = [
            {
                'title': '月光小夜曲',
                'description': '轻柔的月光下，琴声悠扬',
                'difficulty': cls.DIFFICULTY_EASY,
                'notes': json.dumps([
                    {'key': 'C4', 'time': 0, 'duration': 0.5},
                    {'key': 'E4', 'time': 0.5, 'duration': 0.5},
                    {'key': 'G4', 'time': 1.0, 'duration': 0.5},
                    {'key': 'A4', 'time': 1.5, 'duration': 1.0},
                    {'key': 'G4', 'time': 2.5, 'duration': 0.5},
                    {'key': 'E4', 'time': 3.0, 'duration': 0.5},
                    {'key': 'C4', 'time': 3.5, 'duration': 1.0}
                ]),
                'bpm': 80,
                'duration': 30,
                'unlock_level': 1,
                'unlock_coins': 0,
                'category': cls.CATEGORY_CLASSIC,
                'is_default': 1
            },
            {
                'title': '星之幻想',
                'description': '璀璨星空下的梦幻旋律',
                'difficulty': cls.DIFFICULTY_NORMAL,
                'notes': json.dumps([
                    {'key': 'D4', 'time': 0, 'duration': 0.25},
                    {'key': 'F#4', 'time': 0.25, 'duration': 0.25},
                    {'key': 'A4', 'time': 0.5, 'duration': 0.5},
                    {'key': 'D5', 'time': 1.0, 'duration': 0.5},
                    {'key': 'C#5', 'time': 1.5, 'duration': 0.25},
                    {'key': 'A4', 'time': 1.75, 'duration': 0.25},
                    {'key': 'F#4', 'time': 2.0, 'duration': 0.5},
                    {'key': 'D4', 'time': 2.5, 'duration': 1.0},
                    {'key': 'E4', 'time': 3.5, 'duration': 0.5},
                    {'key': 'F#4', 'time': 4.0, 'duration': 0.5}
                ]),
                'bpm': 110,
                'duration': 45,
                'unlock_level': 3,
                'unlock_coins': 100,
                'category': cls.CATEGORY_POP,
                'is_default': 1
            },
            {
                'title': '雷鸣进行曲',
                'description': '如同雷霆般激昂的战斗之歌',
                'difficulty': cls.DIFFICULTY_HARD,
                'notes': json.dumps([
                    {'key': 'C4', 'time': 0, 'duration': 0.125},
                    {'key': 'E4', 'time': 0.125, 'duration': 0.125},
                    {'key': 'G4', 'time': 0.25, 'duration': 0.125},
                    {'key': 'C5', 'time': 0.375, 'duration': 0.25},
                    {'key': 'B4', 'time': 0.625, 'duration': 0.125},
                    {'key': 'A4', 'time': 0.75, 'duration': 0.125},
                    {'key': 'G4', 'time': 0.875, 'duration': 0.25},
                    {'key': 'F4', 'time': 1.125, 'duration': 0.125},
                    {'key': 'E4', 'time': 1.25, 'duration': 0.125},
                    {'key': 'D4', 'time': 1.375, 'duration': 0.125},
                    {'key': 'C4', 'time': 1.5, 'duration': 0.5}
                ]),
                'bpm': 140,
                'duration': 60,
                'unlock_level': 5,
                'unlock_coins': 300,
                'category': cls.CATEGORY_ROCK,
                'is_default': 1
            },
            {
                'title': '爵士黄昏',
                'description': '黄昏时分的慵懒爵士风情',
                'difficulty': cls.DIFFICULTY_EXPERT,
                'notes': json.dumps([
                    {'key': 'Bb3', 'time': 0, 'duration': 0.125},
                    {'key': 'D4', 'time': 0.125, 'duration': 0.125},
                    {'key': 'F4', 'time': 0.25, 'duration': 0.25},
                    {'key': 'Ab4', 'time': 0.5, 'duration': 0.125},
                    {'key': 'Bb4', 'time': 0.625, 'duration': 0.25},
                    {'key': 'A4', 'time': 0.875, 'duration': 0.125},
                    {'key': 'G4', 'time': 1.0, 'duration': 0.25},
                    {'key': 'F4', 'time': 1.25, 'duration': 0.125},
                    {'key': 'Eb4', 'time': 1.375, 'duration': 0.125},
                    {'key': 'D4', 'time': 1.5, 'duration': 0.25},
                    {'key': 'Bb3', 'time': 1.75, 'duration': 0.5},
                    {'key': 'C4', 'time': 2.25, 'duration': 0.125},
                    {'key': 'Eb4', 'time': 2.375, 'duration': 0.25}
                ]),
                'bpm': 100,
                'duration': 75,
                'unlock_level': 8,
                'unlock_coins': 500,
                'category': cls.CATEGORY_JAZZ,
                'is_default': 1
            },
            {
                'title': '电子脉冲',
                'description': '感受电流般律动的电子节拍',
                'difficulty': cls.DIFFICULTY_MASTER,
                'notes': json.dumps([
                    {'key': 'C4', 'time': 0, 'duration': 0.0625},
                    {'key': 'E4', 'time': 0.0625, 'duration': 0.0625},
                    {'key': 'G4', 'time': 0.125, 'duration': 0.0625},
                    {'key': 'C5', 'time': 0.1875, 'duration': 0.125},
                    {'key': 'B4', 'time': 0.3125, 'duration': 0.0625},
                    {'key': 'G#4', 'time': 0.375, 'duration': 0.0625},
                    {'key': 'E4', 'time': 0.4375, 'duration': 0.0625},
                    {'key': 'C4', 'time': 0.5, 'duration': 0.125},
                    {'key': 'D4', 'time': 0.625, 'duration': 0.0625},
                    {'key': 'F#4', 'time': 0.6875, 'duration': 0.0625},
                    {'key': 'A4', 'time': 0.75, 'duration': 0.0625},
                    {'key': 'D5', 'time': 0.8125, 'duration': 0.125},
                    {'key': 'C5', 'time': 0.9375, 'duration': 0.0625},
                    {'key': 'A4', 'time': 1.0, 'duration': 0.0625},
                    {'key': 'F#4', 'time': 1.0625, 'duration': 0.0625},
                    {'key': 'D4', 'time': 1.125, 'duration': 0.25}
                ]),
                'bpm': 160,
                'duration': 90,
                'unlock_level': 10,
                'unlock_coins': 1000,
                'category': cls.CATEGORY_ELECTRONIC,
                'is_default': 1
            }
        ]

        for track in default_tracks:
            instance.create(**track)
