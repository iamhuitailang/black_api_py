from typing import Dict, Any, List, Optional
from app.model.helloworld import HelloWorldModel


class HelloWorldBusiness:
    def __init__(self):
        self.model = HelloWorldModel()

    def get_hello_message(self, record_id: int = None) -> Dict[str, Any]:
        if record_id:
            record = self.model.get_by_id(record_id)
        else:
            record = self.model.get_latest()
        
        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': record.get('id'),
                    'message': record.get('message'),
                    'created_at': record.get('created_at'),
                    'updated_at': record.get('updated_at')
                }
            }
        
        default_message = "Hello, World!"
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': None,
                'message': default_message,
                'created_at': None,
                'updated_at': None
            }
        }

    def get_all_messages(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result['items'],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def set_hello_message(self, message: str, record_id: int = None) -> Dict[str, Any]:
        if not message or not message.strip():
            return {
                'code': 1,
                'message': 'Message cannot be empty',
                'data': None
            }
        
        message = message.strip()
        
        if record_id:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Record with id {record_id} not found',
                    'data': None
                }
            affected = self.model.update(record_id, message)
            if affected > 0:
                record = self.model.get_by_id(record_id)
                return {
                    'code': 0,
                    'message': 'update success',
                    'data': {
                        'id': record.get('id'),
                        'message': record.get('message'),
                        'created_at': record.get('created_at'),
                        'updated_at': record.get('updated_at')
                    }
                }
            return {
                'code': 1,
                'message': 'update failed',
                'data': None
            }
        else:
            new_id = self.model.create(message)
            record = self.model.get_by_id(new_id)
            return {
                'code': 0,
                'message': 'create success',
                'data': {
                    'id': record.get('id'),
                    'message': record.get('message'),
                    'created_at': record.get('created_at'),
                    'updated_at': record.get('updated_at')
                }
            }

    def delete_message(self, record_id: int) -> Dict[str, Any]:
        if not record_id:
            return {
                'code': 1,
                'message': 'Record id is required',
                'data': None
            }
        
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }
        
        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }
