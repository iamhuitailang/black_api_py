from typing import Dict, Any, List, Optional
from app.model.mxt import WelfareModel


class WelfareBusiness:
    def __init__(self):
        self.model = WelfareModel()

    def get_welfares(self) -> Dict[str, Any]:
        welfares = self.model.get_all()
        
        result = []
        for welfare in welfares:
            result.append({
                'id': welfare.get('id'),
                'icon': welfare.get('icon'),
                'title': welfare.get('title'),
                'description': welfare.get('description'),
                'sort_order': welfare.get('sort_order'),
                'created_at': welfare.get('created_at'),
                'updated_at': welfare.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_welfare_by_id(self, record_id: int) -> Dict[str, Any]:
        welfare = self.model.get_by_id(record_id)
        
        if welfare:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': welfare.get('id'),
                    'icon': welfare.get('icon'),
                    'title': welfare.get('title'),
                    'description': welfare.get('description'),
                    'sort_order': welfare.get('sort_order'),
                    'created_at': welfare.get('created_at'),
                    'updated_at': welfare.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': '福利不存在',
            'data': None
        }

    def add_welfare(self, icon: str, title: str, description: str = '',
                    sort_order: int = 0) -> Dict[str, Any]:
        if not icon or not title:
            return {
                'code': 1,
                'message': '图标和标题不能为空',
                'data': None
            }
        
        try:
            new_id = self.model.create(
                icon=icon,
                title=title,
                description=description,
                sort_order=sort_order
            )
            return self.get_welfare_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_welfare(self, record_id: int, icon: str = None, title: str = None,
                       description: str = None, sort_order: int = None) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'福利ID {record_id} 不存在',
                'data': None
            }
        
        try:
            affected = self.model.update(
                record_id=record_id,
                icon=icon,
                title=title,
                description=description,
                sort_order=sort_order
            )
            
            if affected > 0:
                return self.get_welfare_by_id(record_id)
            
            return {
                'code': 1,
                'message': '更新失败',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_welfare(self, record_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'福利ID {record_id} 不存在',
                'data': None
            }
        
        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': '删除成功',
                'data': None
            }
        
        return {
            'code': 1,
            'message': '删除失败',
            'data': None
        }
