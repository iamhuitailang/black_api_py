from typing import Dict, Any, List, Optional
from app.model.ims import OperationLogModel


class OperationLogBusiness:
    def __init__(self):
        self.model = OperationLogModel()

    def get_log_list(self, page: int = 1, page_size: int = 10,
                     operation_type: str = None, module: str = None,
                     start_date: str = None, end_date: str = None,
                     keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                operation_type=operation_type,
                module=module,
                start_date=start_date,
                end_date=end_date,
                keyword=keyword
            )

            items = []
            for item in result['items']:
                items.append({
                    'id': item.get('id'),
                    'operation_type': item.get('operation_type'),
                    'module': item.get('module'),
                    'record_id': item.get('record_id'),
                    'title': item.get('title'),
                    'detail': item.get('detail'),
                    'created_at': item.get('created_at')
                })

            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'items': items,
                    'total': result['total'],
                    'page': result['page'],
                    'page_size': result['page_size'],
                    'total_pages': result['total_pages']
                }
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_log_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            log = self.model.get_by_id(record_id)

            if log:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': log.get('id'),
                        'operation_type': log.get('operation_type'),
                        'module': log.get('module'),
                        'record_id': log.get('record_id'),
                        'title': log.get('title'),
                        'detail': log.get('detail'),
                        'created_at': log.get('created_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Log not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_logs_by_type(self, operation_type: str, page: int = 1,
                         page_size: int = 10) -> Dict[str, Any]:
        return self.get_log_list(
            page=page,
            page_size=page_size,
            operation_type=operation_type
        )

    def get_logs_by_module(self, module: str, page: int = 1,
                           page_size: int = 10) -> Dict[str, Any]:
        return self.get_log_list(
            page=page,
            page_size=page_size,
            module=module
        )
