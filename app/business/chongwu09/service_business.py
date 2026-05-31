from typing import Dict, Any
from app.model.chongwu09 import ServiceModel


class ServiceBusiness:
    def __init__(self):
        self.service_model = ServiceModel()

    def create_service(self, title: str, service_type: str, description: str,
                       price: float, price_unit: str = '天', cover_image: str = '',
                       capacity: int = 10, address: str = '') -> Dict[str, Any]:
        if not title:
            return {'code': 1, 'msg': '服务名称不能为空', 'data': None}
        if not service_type:
            return {'code': 1, 'msg': '服务类型不能为空', 'data': None}
        if price < 0:
            return {'code': 1, 'msg': '价格不能为负数', 'data': None}
        service_id = self.service_model.create(
            title, service_type, description, price, price_unit,
            cover_image, capacity, address
        )
        if service_id > 0:
            service = self.service_model.get_by_id(service_id)
            return {'code': 0, 'msg': '创建成功', 'data': self.service_model.to_dict(service)}
        return {'code': 1, 'msg': '创建失败', 'data': None}

    def get_service(self, service_id: int) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {'code': 1, 'msg': '服务不存在', 'data': None}
        service_dict = self.service_model.to_dict(service)
        from app.model.chongwu09 import ReviewModel
        review_model = ReviewModel()
        service_dict['avg_rating'] = review_model.get_service_avg_rating(service_id)
        service_dict['rating_count'] = review_model.get_service_rating_count(service_id)
        return {'code': 0, 'msg': 'success', 'data': service_dict}

    def update_service(self, service_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {'code': 1, 'msg': '服务不存在', 'data': None}
        affected = self.service_model.update(service_id, data)
        if affected >= 0:
            updated_service = self.service_model.get_by_id(service_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.service_model.to_dict(updated_service)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_service(self, service_id: int) -> Dict[str, Any]:
        service = self.service_model.get_by_id(service_id)
        if not service:
            return {'code': 1, 'msg': '服务不存在', 'data': None}
        affected = self.service_model.delete(service_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_service_list(self, page: int = 1, page_size: int = 10,
                         service_type: str = None, status: int = None,
                         keyword: str = None) -> Dict[str, Any]:
        if status is None:
            status = ServiceModel.STATUS_ACTIVE
        result = self.service_model.get_list(page, page_size, service_type, status, keyword)
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

    def get_all_service_list(self, page: int = 1, page_size: int = 10,
                              service_type: str = None, status: int = None,
                              keyword: str = None) -> Dict[str, Any]:
        result = self.service_model.get_list(page, page_size, service_type, status, keyword)
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

    def get_service_types(self) -> Dict[str, Any]:
        return {'code': 0, 'msg': 'success', 'data': ServiceModel.SERVICE_TYPES}
