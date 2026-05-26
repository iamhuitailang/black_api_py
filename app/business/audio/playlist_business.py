from typing import Dict, Any, List, Optional
from app.model.audio import PlaylistModel, PlaylistSongModel, SongModel


class AudioPlaylistBusiness:
    MAX_PLAYLISTS = 50

    def __init__(self):
        self.playlist_model = PlaylistModel()
        self.playlist_song_model = PlaylistSongModel()
        self.song_model = SongModel()

    def get_list(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.playlist_model.get_all(page=page, page_size=page_size)
        items = [self.playlist_model.to_dict(p) for p in result['items']]
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

    def get_detail(self, playlist_id: int) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        songs = self.playlist_song_model.get_songs_by_playlist(playlist_id)
        result = self.playlist_model.to_dict(playlist)
        result['songs'] = [self.song_model.to_dict(s) for s in songs]
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def create(self, name: str, cover: str = '', description: str = '') -> Dict[str, Any]:
        if not name or not name.strip():
            return {
                'code': 1,
                'msg': '歌单名称不能为空',
                'data': None
            }

        count = self.playlist_model.count()
        if count >= self.MAX_PLAYLISTS:
            return {
                'code': 1,
                'msg': f'最多创建 {self.MAX_PLAYLISTS} 个歌单',
                'data': None
            }

        existing = self.playlist_model.get_by_name(name.strip())
        if existing:
            return {
                'code': 1,
                'msg': '歌单名称已存在',
                'data': None
            }

        playlist_id = self.playlist_model.create(
            name=name.strip(),
            cover=cover or '',
            description=description or ''
        )

        if playlist_id > 0:
            playlist = self.playlist_model.get_by_id(playlist_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.playlist_model.to_dict(playlist)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, playlist_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        if 'name' in data and data['name']:
            existing = self.playlist_model.get_by_name(data['name'].strip())
            if existing and existing.get('id') != playlist_id:
                return {
                    'code': 1,
                    'msg': '歌单名称已存在',
                    'data': None
                }
            data['name'] = data['name'].strip()

        affected = self.playlist_model.update(playlist_id, data)
        if affected >= 0:
            updated = self.playlist_model.get_by_id(playlist_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.playlist_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, playlist_id: int) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        affected = self.playlist_model.delete(playlist_id)
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

    def add_songs(self, playlist_id: int, song_ids: List[int]) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        if not song_ids:
            return {
                'code': 1,
                'msg': '请选择歌曲',
                'data': None
            }

        added = self.playlist_song_model.add_songs(playlist_id, song_ids)
        return {
            'code': 0,
            'msg': f'成功添加 {added} 首歌曲',
            'data': {'added': added}
        }

    def remove_song(self, playlist_id: int, song_id: int) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        affected = self.playlist_song_model.remove_song(playlist_id, song_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '移除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '移除失败',
            'data': None
        }

    def reorder_songs(self, playlist_id: int, order_list: List[int]) -> Dict[str, Any]:
        playlist = self.playlist_model.get_by_id(playlist_id)
        if not playlist:
            return {
                'code': 1,
                'msg': '歌单不存在',
                'data': None
            }

        if not order_list:
            return {
                'code': 1,
                'msg': '排序数据不能为空',
                'data': None
            }

        affected = self.playlist_song_model.reorder(playlist_id, order_list)
        return {
            'code': 0,
            'msg': '排序成功',
            'data': {'reordered': affected}
        }

    def get_stats(self) -> Dict[str, Any]:
        count = self.playlist_model.count()
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total': count,
                'max': self.MAX_PLAYLISTS
            }
        }