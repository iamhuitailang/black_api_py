from typing import Dict, Any, List, Optional
from app.model.fuwu_077_model import ServiceModel


class ServiceBusiness:
    def __init__(self):
        self.service_model = ServiceModel()

    def get_service_list(self, page: int = 1, page_size: int = 10, 
                         category: str = None, status: int = None,
                         keyword: str = None) -> Dict[str, Any]:
        result = self.service_model.get_all(page, page_size, category, status, keyword)
        items = [self.service_model.to_dict(item) for item in result.get('items', [])]

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

    def get_service_detail(self, service_id: int) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {
                'code': 1,
                'msg': '服务不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.service_model.to_dict(service)
        }

    def get_categories(self) -> Dict[str, Any]:
        categories = self.service_model.get_categories()
        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }

    def create_service(self, name: str, category: str = '', description: str = '',
                       price: float = 0, unit: str = '次', duration: int = 60,
                       image: str = '', status: int = 1, sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '服务名称不能为空',
                'data': None
            }

        if price < 0:
            return {
                'code': 1,
                'msg': '价格不能为负数',
                'data': None
            }

        service_id = self.service_model.create(
            name=name,
            category=category,
            description=description,
            price=price,
            unit=unit,
            duration=duration,
            image=image,
            status=status,
            sort_order=sort_order
        )

        if service_id > 0:
            service = self.service_model.get_by_id(service_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.service_model.to_dict(service)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_service(self, service_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {
                'code': 1,
                'msg': '服务不存在',
                'data': None
            }

        if 'price' in data and data['price'] < 0:
            return {
                'code': 1,
                'msg': '价格不能为负数',
                'data': None
            }

        affected = self.service_model.update(service_id, data)
        if affected >= 0:
            updated_service = self.service_model.get_by_id(service_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.service_model.to_dict(updated_service)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_service(self, service_id: int) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {
                'code': 1,
                'msg': '服务不存在',
                'data': None
            }

        affected = self.service_model.delete(service_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }

    def toggle_status(self, service_id: int) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {
                'code': 1,
                'msg': '服务不存在',
                'data': None
            }

        new_status = 0 if service.get('status') == 1 else 1
        affected = self.service_model.update(service_id, {'status': new_status})
        if affected > 0:
            updated_service = self.service_model.get_by_id(service_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.service_model.to_dict(updated_service)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }
