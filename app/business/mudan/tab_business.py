from typing import Dict, Any, List, Optional
from app.model.mudan import TabModel


class TabBusiness:
    def __init__(self):
        self.model = TabModel()

    def get_tabs(self) -> Dict[str, Any]:
        tabs = self.model.get_all()
        
        result = []
        for tab in tabs:
            result.append({
                'id': tab.get('id'),
                'tab_id': tab.get('tab_id'),
                'tab_name': tab.get('tab_name'),
                'sort_order': tab.get('sort_order'),
                'created_at': tab.get('created_at'),
                'updated_at': tab.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def set_tab(self, tab_id: int = None, tab_name: str = None, sort_order: int = None) -> Dict[str, Any]:
        if tab_name is None or not tab_name.strip():
            return {
                'code': 1,
                'message': 'tab_name is required',
                'data': None
            }
        
        tab_name = tab_name.strip()
        
        if tab_id is not None:
            existing = self.model.get_by_tab_id(tab_id)
            if existing:
                affected = self.model.update_by_tab_id(tab_id, tab_name, sort_order)
                if affected > 0:
                    updated_tab = self.model.get_by_tab_id(tab_id)
                    return {
                        'code': 0,
                        'message': 'update success',
                        'data': {
                            'id': updated_tab.get('id'),
                            'tab_id': updated_tab.get('tab_id'),
                            'tab_name': updated_tab.get('tab_name'),
                            'sort_order': updated_tab.get('sort_order'),
                            'created_at': updated_tab.get('created_at'),
                            'updated_at': updated_tab.get('updated_at')
                        }
                    }
                return {
                    'code': 1,
                    'message': 'update failed',
                    'data': None
                }
            else:
                try:
                    new_id = self.model.create(tab_id, tab_name, sort_order if sort_order is not None else 0)
                    new_tab = self.model.get_by_id(new_id)
                    return {
                        'code': 0,
                        'message': 'create success',
                        'data': {
                            'id': new_tab.get('id'),
                            'tab_id': new_tab.get('tab_id'),
                            'tab_name': new_tab.get('tab_name'),
                            'sort_order': new_tab.get('sort_order'),
                            'created_at': new_tab.get('created_at'),
                            'updated_at': new_tab.get('updated_at')
                        }
                    }
                except Exception as e:
                    return {
                        'code': 1,
                        'message': str(e),
                        'data': None
                    }
        else:
            max_tab = self.model.get_all()
            if max_tab:
                new_tab_id = max(max_tab, key=lambda x: x.get('tab_id', 0)).get('tab_id', 0) + 1
            else:
                new_tab_id = 1
            
            try:
                new_id = self.model.create(new_tab_id, tab_name, sort_order if sort_order is not None else 0)
                new_tab = self.model.get_by_id(new_id)
                return {
                    'code': 0,
                    'message': 'create success',
                    'data': {
                        'id': new_tab.get('id'),
                        'tab_id': new_tab.get('tab_id'),
                        'tab_name': new_tab.get('tab_name'),
                        'sort_order': new_tab.get('sort_order'),
                        'created_at': new_tab.get('created_at'),
                        'updated_at': new_tab.get('updated_at')
                    }
                }
            except Exception as e:
                return {
                    'code': 1,
                    'message': str(e),
                    'data': None
                }

    def get_tab_by_tab_id(self, tab_id: int) -> Dict[str, Any]:
        tab = self.model.get_by_tab_id(tab_id)
        
        if tab:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': tab.get('id'),
                    'tab_id': tab.get('tab_id'),
                    'tab_name': tab.get('tab_name'),
                    'sort_order': tab.get('sort_order'),
                    'created_at': tab.get('created_at'),
                    'updated_at': tab.get('updated_at')
                }
            }
        
        return {
            'code': 1,
            'message': 'Tab not found',
            'data': None
        }

    def delete_tab(self, tab_id: int) -> Dict[str, Any]:
        existing = self.model.get_by_tab_id(tab_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Tab with tab_id {tab_id} not found',
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
