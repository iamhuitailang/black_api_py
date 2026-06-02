from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class SongModel:
    TABLE_NAME = 'tb_jinwutuan_model_song'

    STATUS_ENABLED = 0
    STATUS_DISABLED = 1

    DIFFICULTY_EASY = 'easy'
    DIFFICULTY_NORMAL = 'normal'
    DIFFICULTY_HARD = 'hard'

    GENRE_POP = 'pop'
    GENRE_ROCK = 'rock'
    GENRE_ELECTRONIC = 'electronic'
    GENRE_CLASSICAL = 'classical'
    GENRE_ANIME = 'anime'
    GENRE_ORIGINAL = 'original'

    GENRES = [
        {'code': GENRE_POP, 'name': '流行'},
        {'code': GENRE_ROCK, 'name': '摇滚'},
        {'code': GENRE_ELECTRONIC, 'name': '电子'},
        {'code': GENRE_CLASSICAL, 'name': '古典'},
        {'code': GENRE_ANIME, 'name': '动漫'},
        {'code': GENRE_ORIGINAL, 'name': '原创'}
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
                title TEXT NOT NULL,
                artist TEXT DEFAULT '',
                cover TEXT DEFAULT '',
                bpm REAL DEFAULT 120.0,
                duration REAL DEFAULT 0,
                difficulty_easy INTEGER DEFAULT 1,
                difficulty_normal INTEGER DEFAULT 3,
                difficulty_hard INTEGER DEFAULT 5,
                genre TEXT DEFAULT '',
                note_data TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_genre ON {cls.TABLE_NAME}(genre)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty_easy ON {cls.TABLE_NAME}(difficulty_easy)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_title ON {cls.TABLE_NAME}(title)"
        db.execute(index_sql)

    def create(self, title: str, artist: str = '', cover: str = '',
               bpm: float = 120.0, duration: float = 0,
               difficulty_easy: int = 1, difficulty_normal: int = 3,
               difficulty_hard: int = 5, genre: str = '',
               note_data: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'title': title,
            'artist': artist,
            'cover': cover,
            'bpm': bpm,
            'duration': duration,
            'difficulty_easy': difficulty_easy,
            'difficulty_normal': difficulty_normal,
            'difficulty_hard': difficulty_hard,
            'genre': genre,
            'note_data': note_data,
            'status': self.STATUS_ENABLED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, song_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'title', 'artist', 'cover', 'bpm', 'duration',
            'difficulty_easy', 'difficulty_normal', 'difficulty_hard',
            'genre', 'note_data', 'status'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(song_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10, genre: str = None,
                difficulty: str = None, status: int = None,
                keyword: str = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        if genre:
            conditions['genre'] = genre

        if keyword:
            return self.search(keyword, page, page_size, genre, difficulty, status)

        if difficulty:
            return self._filter_by_difficulty(difficulty, page, page_size, conditions)

        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def _filter_by_difficulty(self, difficulty: str, page: int = 1,
                               page_size: int = 10,
                               base_conditions: Dict[str, Any] = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if base_conditions:
            for key, value in base_conditions.items():
                where_clauses.append(f"{key} = ?")
                params.append(value)

        diff_column = f"difficulty_{difficulty}"
        where_clauses.append(f"{diff_column} IS NOT NULL")

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            ORDER BY {diff_column} ASC
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

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               genre: str = None, difficulty: str = None,
               status: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["1=1"]
        params = []

        if status is not None:
            where_clauses.append("status = ?")
            params.append(status)

        if genre:
            where_clauses.append("genre = ?")
            params.append(genre)

        if difficulty:
            where_clauses.append(f"difficulty_{difficulty} IS NOT NULL")

        where_clauses.append("(title LIKE ? OR artist LIKE ?)")
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

    def get_genre_name(self, genre: str) -> str:
        for g in self.GENRES:
            if g['code'] == genre:
                return g['name']
        return '其他'

    def to_dict(self, song: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': song.get('id'),
            'title': song.get('title'),
            'artist': song.get('artist'),
            'cover': song.get('cover'),
            'bpm': song.get('bpm'),
            'duration': song.get('duration'),
            'difficulty_easy': song.get('difficulty_easy'),
            'difficulty_normal': song.get('difficulty_normal'),
            'difficulty_hard': song.get('difficulty_hard'),
            'genre': song.get('genre'),
            'genre_name': self.get_genre_name(song.get('genre')),
            'status': song.get('status'),
            'created_at': song.get('created_at'),
            'updated_at': song.get('updated_at')
        }
