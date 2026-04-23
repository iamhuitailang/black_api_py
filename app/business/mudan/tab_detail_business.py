from typing import Dict, Any, List, Optional
from app.model.mudan import TabDetailModel


class TabDetailBusiness:
    def __init__(self):
        self.model = TabDetailModel()

    def get_tab_detail(self, tab_id: int) -> Dict[str, Any]:
        detail = self.model.get_by_tab_id(tab_id)
        
        if detail:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': detail.get('id'),
                    'tab_id': detail.get('tab_id'),
                    'title': detail.get('title'),
                    'content': detail.get('content'),
                    'created_at': detail.get('created_at'),
                    'updated_at': detail.get('updated_at')
                }
            }
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': None,
                'tab_id': tab_id,
                'title': '',
                'content': '',
                'created_at': None,
                'updated_at': None
            }
        }

    def set_tab_detail(self, tab_id: int, title: str = None, content: str = None) -> Dict[str, Any]:
        if tab_id is None:
            return {
                'code': 1,
                'message': 'tab_id is required',
                'data': None
            }
        
        existing = self.model.get_by_tab_id(tab_id)
        
        if existing:
            affected = self.model.update_by_tab_id(tab_id, title, content)
            if affected > 0:
                updated_detail = self.model.get_by_tab_id(tab_id)
                return {
                    'code': 0,
                    'message': 'update success',
                    'data': {
                        'id': updated_detail.get('id'),
                        'tab_id': updated_detail.get('tab_id'),
                        'title': updated_detail.get('title'),
                        'content': updated_detail.get('content'),
                        'created_at': updated_detail.get('created_at'),
                        'updated_at': updated_detail.get('updated_at')
                    }
                }
            return {
                'code': 1,
                'message': 'update failed',
                'data': None
            }
        else:
            try:
                new_id = self.model.create(
                    tab_id, 
                    title if title is not None else '', 
                    content if content is not None else ''
                )
                new_detail = self.model.get_by_id(new_id)
                return {
                    'code': 0,
                    'message': 'create success',
                    'data': {
                        'id': new_detail.get('id'),
                        'tab_id': new_detail.get('tab_id'),
                        'title': new_detail.get('title'),
                        'content': new_detail.get('content'),
                        'created_at': new_detail.get('created_at'),
                        'updated_at': new_detail.get('updated_at')
                    }
                }
            except Exception as e:
                return {
                    'code': 1,
                    'message': str(e),
                    'data': None
                }

    def get_all_tab_details(self) -> Dict[str, Any]:
        details = self.model.get_all()
        
        result = []
        for detail in details:
            result.append({
                'id': detail.get('id'),
                'tab_id': detail.get('tab_id'),
                'title': detail.get('title'),
                'content': detail.get('content'),
                'created_at': detail.get('created_at'),
                'updated_at': detail.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def delete_tab_detail(self, tab_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_tab_id(tab_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Tab detail with tab_id {tab_id} not found',
                'data': None
            }
        
        affected = self.model.delete_by_tab_id(tab_id)
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
