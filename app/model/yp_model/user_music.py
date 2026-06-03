from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserMusicModel:
    TABLE_NAME = 'tb_yp_model_user_music'

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
                music_id INTEGER NOT NULL,
                highest_score INTEGER DEFAULT 0,
                total_plays INTEGER DEFAULT 0,
                is_favorite INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_music_id ON {cls.TABLE_NAME}(music_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_music ON {cls.TABLE_NAME}(user_id, music_id)"
        db.execute(index_sql)

    def create(self, user_id: int, music_id: int) -> int:
        existing = self.query.find_one({'user_id': user_id, 'music_id': music_id})
        if existing:
            return existing.get('id', 0)

        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'music_id': music_id,
            'highest_score': 0,
            'total_plays': 0,
            'is_favorite': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT um.*, m.name, m.artist, m.cover, m.bpm, m.duration, m.difficulty, m.is_custom
            FROM {self.TABLE_NAME} um
            LEFT JOIN tb_yp_model_music m ON um.music_id = m.id
            WHERE um.user_id = ?
            ORDER BY um.is_favorite DESC, um.highest_score DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def get_favorites(self, user_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT um.*, m.name, m.artist, m.cover, m.bpm, m.duration, m.difficulty
            FROM {self.TABLE_NAME} um
            LEFT JOIN tb_yp_model_music m ON um.music_id = m.id
            WHERE um.user_id = ? AND um.is_favorite = 1
            ORDER BY um.highest_score DESC
        """
        return self.db.fetch_all(sql, (user_id,))

    def update_score(self, user_id: int, music_id: int, score: int) -> int:
        record = self.query.find_one({'user_id': user_id, 'music_id': music_id})
        if not record:
            self.create(user_id, music_id)
            record = self.query.find_one({'user_id': user_id, 'music_id': music_id})

        current_highest = record.get('highest_score', 0)
        current_plays = record.get('total_plays', 0)
        new_highest = max(current_highest, score)

        now = datetime.now().isoformat()
        data = {
            'highest_score': new_highest,
            'total_plays': current_plays + 1,
            'updated_at': now
        }
        return self.exec.update_by_id(record.get('id'), data)

    def toggle_favorite(self, user_id: int, music_id: int) -> int:
        record = self.query.find_one({'user_id': user_id, 'music_id': music_id})
        if not record:
            self.create(user_id, music_id)
            record = self.query.find_one({'user_id': user_id, 'music_id': music_id})

        is_favorite = 1 if record.get('is_favorite') == 0 else 0
        now = datetime.now().isoformat()
        return self.exec.update_by_id(record.get('id'), {'is_favorite': is_favorite, 'updated_at': now})

    def to_public_dict(self, user_music: Dict[str, Any]) -> Dict[str, Any]:
        from app.model.yp_model.music import MusicModel
        music_model = MusicModel()
        return {
            'id': user_music.get('id'),
            'user_id': user_music.get('user_id'),
            'music_id': user_music.get('music_id'),
            'highest_score': user_music.get('highest_score'),
            'total_plays': user_music.get('total_plays'),
            'is_favorite': user_music.get('is_favorite'),
            'name': user_music.get('name'),
            'artist': user_music.get('artist'),
            'cover': user_music.get('cover'),
            'bpm': user_music.get('bpm'),
            'duration': user_music.get('duration'),
            'difficulty': user_music.get('difficulty'),
            'difficulty_text': music_model.get_difficulty_text(user_music.get('difficulty')),
            'is_custom': user_music.get('is_custom'),
            'created_at': user_music.get('created_at')
        }
