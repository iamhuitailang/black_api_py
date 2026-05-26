from typing import Dict, Any, Optional
from app.model.manhua import FavoriteModel, ComicModel


class ManhuaFavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.comic_model = ComicModel()

    def add_favorite(self, user_id: int, comic_id: int) -> Dict[str, Any]:
        comic = self.comic_model.get_by_id(comic_id)
        if not comic:
            return {
                'code': 1,
                'msg': '漫画不存在',
                'data': None
            }

        if self.favorite_model.is_favorite(user_id, comic_id):
            return {
                'code': 1,
                'msg': '已收藏该漫画',
                'data': None
            }

        record_id = self.favorite_model.create(user_id, comic_id)
        if record_id > 0:
            self.comic_model.increment_favorites(comic_id, 1)
            return {
                'code': 0,
                'msg': '收藏成功',
                'data': {'id': record_id}
            }

        return {
            'code': 1,
            'msg': '收藏失败',
            'data': None
        }

    def remove_favorite(self, user_id: int, comic_id: int) -> Dict[str, Any]:
        if not self.favorite_model.is_favorite(user_id, comic_id):
            return {
                'code': 1,
                'msg': '未收藏该漫画',
                'data': None
            }

        affected = self.favorite_model.delete_by_user_and_comic(user_id, comic_id)
        if affected > 0:
            self.comic_model.increment_favorites(comic_id, -1)
            return {
                'code': 0,
                'msg': '取消收藏成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消收藏失败',
            'data': None
        }

    def is_favorite(self, user_id: int, comic_id: int) -> Dict[str, Any]:
        is_fav = self.favorite_model.is_favorite(user_id, comic_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'is_favorite': is_fav}
        }

    def get_favorite_list(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.favorite_model.get_by_user_id(user_id, page, page_size)
        items = []
        for fav in result.get('items', []):
            comic = self.comic_model.get_by_id(fav.get('comic_id'))
            if comic:
                comic_dict = self.comic_model.to_dict(comic)
                comic_dict['favorite_id'] = fav.get('id')
                comic_dict['favorite_time'] = fav.get('created_at')
                items.append(comic_dict)

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