from typing import Dict, Any, List, Optional
from app.model.ims import VarietyModel, OperationLogModel


class VarietyBusiness:
    def __init__(self):
        self.model = VarietyModel()
        self.log_model = OperationLogModel()

    def get_variety_list(self, page: int = 1,
                         page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        try:
            result = self.model.paginate(
                page=page,
                page_size=page_size,
                keyword=keyword
            )

            items = []
            for item in result['items']:
                items.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'image_url': item.get('image_url'),
                    'description': item.get('description'),
                    'flowering_period': item.get('flowering_period'),
                    'care_instructions': item.get('care_instructions'),
                    'created_at': item.get('created_at'),
                    'updated_at': item.get('updated_at')
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

    def get_variety_by_id(self, record_id: int) -> Dict[str, Any]:
        try:
            variety = self.model.get_by_id(record_id)

            if variety:
                return {
                    'code': 0,
                    'message': 'success',
                    'data': {
                        'id': variety.get('id'),
                        'name': variety.get('name'),
                        'image_url': variety.get('image_url'),
                        'description': variety.get('description'),
                        'flowering_period': variety.get('flowering_period'),
                        'care_instructions': variety.get('care_instructions'),
                        'created_at': variety.get('created_at'),
                        'updated_at': variety.get('updated_at')
                    }
                }

            return {
                'code': 1,
                'message': 'Variety not found',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def add_variety(self, name: str, image_url: str = '', description: str = '',
                    flowering_period: str = '', care_instructions: str = '') -> Dict[str, Any]:
        try:
            if not name or not name.strip():
                return {
                    'code': 1,
                    'message': 'Name is required',
                    'data': None
                }

            existing = self.model.get_by_name(name.strip())
            if existing:
                return {
                    'code': 1,
                    'message': f'Variety "{name}" already exists',
                    'data': None
                }

            new_id = self.model.create(
                name=name.strip(),
                image_url=image_url,
                description=description,
                flowering_period=flowering_period,
                care_instructions=care_instructions
            )

            self.log_model.log_create(
                module='variety',
                title=f'新增品种: {name}',
                record_id=new_id
            )

            return self.get_variety_by_id(new_id)
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def update_variety(self, record_id: int, name: str = None, image_url: str = None,
                       description: str = None, flowering_period: str = None,
                       care_instructions: str = None) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Variety with id {record_id} not found',
                    'data': None
                }

            if name and name.strip() and name.strip() != existing.get('name'):
                existing_by_name = self.model.get_by_name(name.strip())
                if existing_by_name and existing_by_name.get('id') != record_id:
                    return {
                        'code': 1,
                        'message': f'Variety "{name}" already exists',
                        'data': None
                    }

            affected = self.model.update(
                record_id=record_id,
                name=name.strip() if name else None,
                image_url=image_url,
                description=description,
                flowering_period=flowering_period,
                care_instructions=care_instructions
            )

            if affected > 0:
                self.log_model.log_update(
                    module='variety',
                    title=f'更新品种: {name or existing.get("name")}',
                    record_id=record_id
                )
                return self.get_variety_by_id(record_id)

            return {
                'code': 1,
                'message': 'Update failed',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def delete_variety(self, record_id: int) -> Dict[str, Any]:
        try:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Variety with id {record_id} not found',
                    'data': None
                }

            affected = self.model.delete(record_id)
            if affected > 0:
                self.log_model.log_delete(
                    module='variety',
                    title=f'删除品种: {existing.get("name")}',
                    record_id=record_id
                )
                return {
                    'code': 0,
                    'message': 'Delete success',
                    'data': None
                }

            return {
                'code': 1,
                'message': 'Delete failed',
                'data': None
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }

    def get_all_varieties(self) -> Dict[str, Any]:
        try:
            items = self.model.get_all()
            result = []
            for item in items:
                result.append({
                    'id': item.get('id'),
                    'name': item.get('name'),
                    'image_url': item.get('image_url'),
                    'description': item.get('description')
                })

            return {
                'code': 0,
                'message': 'success',
                'data': result
            }
        except Exception as e:
            return {
                'code': 1,
                'message': str(e),
                'data': None
            }
