from typing import Dict, Any
from app.model.baoxiu import LogModel


class BaoxiuLogBusiness:
    def __init__(self):
        self.log_model = LogModel()

    def get_logs(self, page: int = 1, page_size: int = 10,
                 user_id: int = None, action: str = None,
                 target_type: str = None, start_date: str = None,
                 end_date: str = None, keyword: str = None) -> Dict[str, Any]:
        result = self.log_model.get_all(
            page=page, page_size=page_size,
            user_id=user_id, action=action,
            target_type=target_type, start_date=start_date,
            end_date=end_date, keyword=keyword
        )

        items = []
        for item in result.get('items', []):
            item_dict = dict(item)
            item_dict['action_text'] = self.log_model.get_action_text(item.get('action', ''))
            items.append(item_dict)

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

    def delete_log(self, log_id: int) -> Dict[str, Any]:
        self.log_model.delete(log_id)
        return {'code': 0, 'msg': '删除成功', 'data': None}

    def clean_old_logs(self, days: int = 90) -> Dict[str, Any]:
        count = self.log_model.clean_old_logs(days)
        return {'code': 0, 'msg': f'已清理{count}条日志', 'data': None}
