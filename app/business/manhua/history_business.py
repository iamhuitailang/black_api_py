from typing import Dict, Any, Optional
from app.model.manhua import HistoryModel, ComicModel


class ManhuaHistoryBusiness:
    def __init__(self):
        self.history_model = HistoryModel()
        self.comic_model = ComicModel()

    def record_progress(self, user_id: int, comic_id: int, chapter_id: int = None,
                        chapter_no: int = 0, page_no: int = 0) -> Dict[str, Any]:
        comic = self.comic_model.get_by_id(comic_id)
        if not comic:
            return {
                'code': 1,
                'msg': '漫画不存在',
                'data': None
            }

        record_id = self.history_model.upsert(user_id, comic_id, chapter_id, chapter_no, page_no)
        if record_id > 0:
            return {
                'code': 0,
                'msg': '记录成功',
                'data': {'id': record_id}
            }

        return {
            'code': 1,
            'msg': '记录失败',
            'data': None
        }

    def get_history_list(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.history_model.get_by_user_id(user_id, page, page_size)
        items = []
        for hist in result.get('items', []):
            comic = self.comic_model.get_by_id(hist.get('comic_id'))
            if comic:
                comic_dict = self.comic_model.to_dict(comic)
                comic_dict['history_id'] = hist.get('id')
                comic_dict['last_chapter_id'] = hist.get('chapter_id')
                comic_dict['last_chapter_no'] = hist.get('chapter_no')
                comic_dict['last_page_no'] = hist.get('page_no')
                comic_dict['last_read_at'] = hist.get('last_read_at')
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

    def get_progress(self, user_id: int, comic_id: int) -> Dict[str, Any]:
        record = self.history_model.get_by_user_and_comic(user_id, comic_id)
        if record:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'comic_id': comic_id,
                    'chapter_id': record.get('chapter_id'),
                    'chapter_no': record.get('chapter_no'),
                    'page_no': record.get('page_no'),
                    'last_read_at': record.get('last_read_at')
                }
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'comic_id': comic_id,
                'chapter_id': None,
                'chapter_no': 0,
                'page_no': 0,
                'last_read_at': None
            }
        }

    def delete_history(self, user_id: int, comic_id: int = None) -> Dict[str, Any]:
        if comic_id:
            affected = self.history_model.delete_by_user_and_comic(user_id, comic_id)
        else:
            affected = self.history_model.delete_by_user_id(user_id)

        return {
            'code': 0,
            'msg': '删除成功',
            'data': {'deleted': affected}
        }