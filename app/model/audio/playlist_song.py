from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlaylistSongModel:
    TABLE_NAME = 'tb_audio_playlist_songs'

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
                playlist_id INTEGER NOT NULL,
                song_id INTEGER NOT NULL,
                sort_order INTEGER DEFAULT 0,
                added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_playlist ON {cls.TABLE_NAME}(playlist_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_song ON {cls.TABLE_NAME}(song_id)"
        db.execute(index_sql)

    def add_song(self, playlist_id: int, song_id: int) -> int:
        existing = self.query.find_one({'playlist_id': playlist_id, 'song_id': song_id})
        if existing:
            return existing['id']
        now = datetime.now().isoformat()
        max_order_sql = f"SELECT COALESCE(MAX(sort_order), -1) as max_order FROM {self.TABLE_NAME} WHERE playlist_id = ?"
        result = self.db.fetch_one(max_order_sql, (playlist_id,))
        sort_order = (result['max_order'] if result else -1) + 1
        data = {
            'playlist_id': playlist_id,
            'song_id': song_id,
            'sort_order': sort_order,
            'added_at': now
        }
        record_id = self.exec.insert(data)
        from app.model.audio.playlist import PlaylistModel
        pl_model = PlaylistModel()
        pl_model.update_song_count(playlist_id)
        return record_id

    def add_songs(self, playlist_id: int, song_ids: List[int]) -> int:
        now = datetime.now().isoformat()
        added = 0
        for song_id in song_ids:
            existing = self.query.find_one({'playlist_id': playlist_id, 'song_id': song_id})
            if not existing:
                max_order_sql = f"SELECT COALESCE(MAX(sort_order), -1) as max_order FROM {self.TABLE_NAME} WHERE playlist_id = ?"
                result = self.db.fetch_one(max_order_sql, (playlist_id,))
                sort_order = (result['max_order'] if result else -1) + 1
                data = {
                    'playlist_id': playlist_id,
                    'song_id': song_id,
                    'sort_order': sort_order,
                    'added_at': now
                }
                self.exec.insert(data)
                added += 1
        if added > 0:
            from app.model.audio.playlist import PlaylistModel
            pl_model = PlaylistModel()
            pl_model.update_song_count(playlist_id)
        return added

    def get_songs_by_playlist(self, playlist_id: int) -> List[Dict[str, Any]]:
        sql = f"""
            SELECT ps.*, s.title, s.artist, s.album, s.duration, s.genre, s.cover, s.popularity
            FROM {self.TABLE_NAME} ps
            JOIN tb_audio_songs s ON ps.song_id = s.id
            WHERE ps.playlist_id = ?
            ORDER BY ps.sort_order ASC, ps.added_at ASC
        """
        return self.db.fetch_all(sql, (playlist_id,))

    def get_song_ids_by_playlist(self, playlist_id: int) -> List[int]:
        songs = self.query.find_all({'playlist_id': playlist_id},
                                    order_by='sort_order ASC')
        return [s['song_id'] for s in songs]

    def remove_song(self, playlist_id: int, song_id: int) -> int:
        affected = self.exec.delete({'playlist_id': playlist_id, 'song_id': song_id})
        if affected > 0:
            from app.model.audio.playlist import PlaylistModel
            pl_model = PlaylistModel()
            pl_model.update_song_count(playlist_id)
        return affected

    def delete_by_playlist(self, playlist_id: int) -> int:
        return self.exec.delete({'playlist_id': playlist_id})

    def reorder(self, playlist_id: int, order_list: List[int]) -> int:
        if not order_list:
            return 0
        now = datetime.now().isoformat()
        for idx, song_id in enumerate(order_list):
            self.exec.update(
                {'sort_order': idx},
                {'playlist_id': playlist_id, 'song_id': song_id}
            )
        return len(order_list)