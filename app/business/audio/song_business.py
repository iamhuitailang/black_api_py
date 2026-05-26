from typing import Dict, Any, Optional, List
from app.model.audio import SongModel


class AudioSongBusiness:
    def __init__(self):
        self.song_model = SongModel()

    def get_list(self, keyword: str = '', genre: str = '',
                 page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.song_model.get_all(keyword=keyword, genre=genre,
                                        page=page, page_size=page_size)
        items = [self.song_model.to_dict(s) for s in result['items']]
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def search(self, keyword: str, search_type: str = 'song',
               page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        if not keyword or not keyword.strip():
            return {
                'code': 1,
                'msg': '搜索关键词不能为空',
                'data': None
            }

        result = self.song_model.search(keyword=keyword.strip(),
                                        search_type=search_type,
                                        page=page, page_size=page_size)
        items = [self.song_model.to_dict(s) for s in result['items']]
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def get_genres(self) -> Dict[str, Any]:
        genres = self.song_model.get_genres()
        return {
            'code': 0,
            'msg': 'success',
            'data': genres
        }

    def get_hot_searches(self) -> Dict[str, Any]:
        hot = self.song_model.get_hot_searches()
        return {
            'code': 0,
            'msg': 'success',
            'data': hot
        }

    def create(self, title: str, artist: str, album: str = '',
               duration: str = '0:00', genre: str = '',
               cover: str = '', popularity: int = 3,
               source_url: str = '') -> Dict[str, Any]:
        if not title or not title.strip():
            return {
                'code': 1,
                'msg': '歌曲名称不能为空',
                'data': None
            }
        if not artist or not artist.strip():
            return {
                'code': 1,
                'msg': '歌手不能为空',
                'data': None
            }

        song_id = self.song_model.create(
            title=title.strip(),
            artist=artist.strip(),
            album=album or '',
            duration=duration or '0:00',
            genre=genre or '',
            cover=cover or '',
            popularity=popularity or 3,
            source_url=source_url or ''
        )

        if song_id > 0:
            song = self.song_model.get_by_id(song_id)
            return {
                'code': 0,
                'msg': '添加成功',
                'data': self.song_model.to_dict(song)
            }

        return {
            'code': 1,
            'msg': '添加失败',
            'data': None
        }

    def update(self, song_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
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

    def delete(self, song_id: int) -> Dict[str, Any]:
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

    def get_by_id(self, song_id: int) -> Dict[str, Any]:
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

    def get_by_ids(self, ids: List[int]) -> Dict[str, Any]:
        if not ids:
            return {
                'code': 0,
                'msg': 'success',
                'data': []
            }

        songs = self.song_model.get_by_ids(ids)
        items = [self.song_model.to_dict(s) for s in songs]
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }