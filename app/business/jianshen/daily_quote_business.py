from typing import Dict, Any
from app.model.jianshen import JianshenDailyQuoteModel


class JianshenDailyQuoteBusiness:
    def __init__(self):
        self.quote_model = JianshenDailyQuoteModel()

    def get_today(self) -> Dict[str, Any]:
        quote = self.quote_model.ensure_today()
        if not quote:
            return {'code': 1, 'msg': '获取失败', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.quote_model.to_dict(quote)}

    def get_list(self, page: int = 1, page_size: int = 30) -> Dict[str, Any]:
        result = self.quote_model.get_all(page, page_size)
        items = [self.quote_model.to_dict(item) for item in result.get('items', [])]
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def create(self, quote_date: str, content: str, author: str = '') -> Dict[str, Any]:
        if not quote_date or not content:
            return {'code': 1, 'msg': '日期和内容不能为空', 'data': None}
        existing = self.quote_model.get_by_date(quote_date)
        if existing:
            return {'code': 1, 'msg': '该日期已有记录', 'data': self.quote_model.to_dict(existing)}
        quote_id = self.quote_model.create(quote_date, content, author)
        if quote_id > 0:
            quote = self.quote_model.get_by_id(quote_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.quote_model.to_dict(quote)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def delete(self, quote_id: int) -> Dict[str, Any]:
        if self.quote_model.delete(quote_id) > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
