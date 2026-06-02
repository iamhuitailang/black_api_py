from typing import Dict, Any, Optional
from app.model.jinwutuan import SongModel


class JinwutuanSongBusiness:
    def __init__(self):
        self.song_model = SongModel()

    def create_song(self, data: Dict[str, Any]) -> Dict[str, Any]:
        title = data.get('title', '')
        if not title or len(title.strip()) < 1:
            return {
                'code': 1,
                'msg': '歌曲名称不能为空',
                'data': None
            }

        song_id = self.song_model.create(
            title=title.strip(),
            artist=data.get('artist', ''),
            cover=data.get('cover', ''),
            bpm=data.get('bpm', 120.0),
            duration=data.get('duration', 0),
            difficulty_easy=data.get('difficulty_easy', 1),
            difficulty_normal=data.get('difficulty_normal', 3),
            difficulty_hard=data.get('difficulty_hard', 5),
            genre=data.get('genre', ''),
            note_data=data.get('note_data', '')
        )

        if song_id > 0:
            song = self.song_model.get_by_id(song_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.song_model.to_dict(song)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_song(self, song_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        song = self.song_model.get_by_id(song_id)
        if not song:
            return {
                'code': 1,
                'msg': '歌曲不存在',
                'data': None
            }

        affected = self.song_model.update(song_id, data)
        if affected >= 0:
            updated_song = self.song_model.get_by_id(song_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.song_model.to_dict(updated_song)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_song(self, song_id: int) -> Dict[str, Any]:
        song = self.song_model.get_by_id(song_id)
        if not song:
            return {
                'code': 1,
                'msg': '歌曲不存在',
                'data': None
            }

        affected = self.song_model.delete(song_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def get_song(self, song_id: int) -> Dict[str, Any]:
        song = self.song_model.get_by_id(song_id)
        if not song:
            return {
                'code': 1,
                'msg': '歌曲不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.song_model.to_dict(song)
        }

    def get_song_list(self, page: int = 1, page_size: int = 10,
                      genre: str = None, difficulty: str = None,
                      status: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.song_model.get_all(page, page_size, genre, difficulty, status, keyword)
        items = [self.song_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_enabled_songs(self) -> Dict[str, Any]:
        songs = self.song_model.query.find_all(
            {'status': SongModel.STATUS_ENABLED},
            order_by='id ASC'
        )
        items = [self.song_model.to_dict(song) for song in songs]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
