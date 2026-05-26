from typing import Dict, Any
from app.model.audio import PlayHistoryModel, SongModel


class AudioPlayHistoryBusiness:
    def __init__(self):
        self.history_model = PlayHistoryModel()
        self.song_model = SongModel()

    def get_list(self, page: int = 1, page_size: int = 50) -> Dict[str, Any]:
        result = self.history_model.get_all(page=page, page_size=page_size)
        items = []
        for item in result['items']:
            song_data = self.song_model.to_dict(item)
            song_data['played_at'] = item.get('played_at')
            items.append({'song': song_data, 'played_at': item.get('played_at')})
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

    def add(self, song_id: int) -> Dict[str, Any]:
        song = self.song_model.get_by_id(song_id)
        if not song:
            return {
                'code': 1,
                'msg': '歌曲不存在',
                'data': None
            }

        self.history_model.add(song_id)
        return {
            'code': 0,
            'msg': '记录成功',
            'data': None
        }

    def clear(self) -> Dict[str, Any]:
        self.history_model.clear()
        return {
            'code': 0,
            'msg': '清空成功',
            'data': None
        }

    def get_count(self) -> Dict[str, Any]:
        count = self.history_model.count()
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }