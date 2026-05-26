from typing import Dict, Any, List
from app.model.audio import SearchHistoryModel


class AudioSearchHistoryBusiness:
    def __init__(self):
        self.history_model = SearchHistoryModel()

    def get_list(self) -> Dict[str, Any]:
        items = self.history_model.get_all()
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def add(self, keyword: str, search_type: str = 'song') -> Dict[str, Any]:
        if not keyword or not keyword.strip():
            return {
                'code': 1,
                'msg': '搜索关键词不能为空',
                'data': None
            }

        self.history_model.add(keyword.strip(), search_type)
        return {
            'code': 0,
            'msg': '记录成功',
            'data': None
        }

    def delete(self, keyword: str, search_type: str = 'song') -> Dict[str, Any]:
        self.history_model.delete(keyword, search_type)
        return {
            'code': 0,
            'msg': '删除成功',
            'data': None
        }

    def clear(self) -> Dict[str, Any]:
        self.history_model.clear()
        return {
            'code': 0,
            'msg': '清空成功',
            'data': None
        }