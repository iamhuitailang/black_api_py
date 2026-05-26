from typing import Dict, Any
from app.model.audio import FavoriteModel, SongModel


class AudioFavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.song_model = SongModel()

    def get_list(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.favorite_model.get_all(page=page, page_size=page_size)
        items = []
        for item in result['items']:
            song_data = self.song_model.to_dict(item)
            song_data['favorited_at'] = item.get('favorited_at')
            items.append({'song': song_data, 'favorited_at': item.get('favorited_at')})
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

    def toggle(self, song_id: int) -> Dict[str, Any]:
        song = self.song_model.get_by_id(song_id)
        if not song:
            return {
                'code': 1,
                'msg': '歌曲不存在',
                'data': None
            }

        if self.favorite_model.is_favorited(song_id):
            self.favorite_model.remove(song_id)
            return {
                'code': 0,
                'msg': '已取消喜欢',
                'data': {'favorited': False}
            }
        else:
            self.favorite_model.add(song_id)
            return {
                'code': 0,
                'msg': '已添加到喜欢',
                'data': {'favorited': True}
            }

    def check(self, song_id: int) -> Dict[str, Any]:
        favorited = self.favorite_model.is_favorited(song_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'favorited': favorited}
        }

    def get_all_ids(self) -> Dict[str, Any]:
        ids = self.favorite_model.get_all_song_ids()
        return {
            'code': 0,
            'msg': 'success',
            'data': ids
        }

    def get_count(self) -> Dict[str, Any]:
        count = self.favorite_model.count()
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }