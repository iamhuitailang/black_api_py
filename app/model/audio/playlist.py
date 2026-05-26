from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class PlaylistModel:
    TABLE_NAME = 'tb_audio_playlists'

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
                cover TEXT DEFAULT '',
                description TEXT DEFAULT '',
                song_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

    def create(self, name: str, cover: str = '', description: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'cover': cover,
            'description': description,
            'song_count': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_all(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        return self.query.paginate(page=page, page_size=page_size,
                                   order_by='created_at DESC')

    def count(self) -> int:
        return self.query.count()

    def update(self, playlist_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'cover', 'description', 'song_count'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(playlist_id, update_data)

    def update_song_count(self, playlist_id: int) -> int:
        from app.model.audio.playlist_song import PlaylistSongModel
        ps_model = PlaylistSongModel()
        count = ps_model.query.count({'playlist_id': playlist_id})
        return self.update(playlist_id, {'song_count': count})

    def delete(self, record_id: int) -> int:
        from app.model.audio.playlist_song import PlaylistSongModel
        ps_model = PlaylistSongModel()
        ps_model.delete_by_playlist(record_id)
        return self.exec.delete_by_id(record_id)

    def to_dict(self, playlist: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': playlist.get('id'),
            'name': playlist.get('name'),
            'cover': playlist.get('cover'),
            'description': playlist.get('description'),
            'song_count': playlist.get('song_count', 0),
            'created_at': playlist.get('created_at'),
            'updated_at': playlist.get('updated_at')
        }