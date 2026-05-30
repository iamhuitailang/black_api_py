from typing import Dict, Any
from app.model.shiwu_model import OfficeModel


class OfficeBusiness:
    def __init__(self):
        self.office_model = OfficeModel()

    def get_office_list(self) -> Dict[str, Any]:
        result = self.office_model.get_all_published()
        items = [self.office_model.to_dict(item) for item in result.get('items', [])]

        grouped = {
            'official': [],
            'announcement': [],
            'summary': []
        }
        for item in items:
            item_type = item.get('type')
            if item_type in grouped:
                grouped[item_type].append(item)

        return {
            'code': 0,
            'msg': 'success',
            'data': grouped
        }

    def get_all_offices(self, page: int = 1, page_size: int = 10,
                       status: int = None, office_type: str = None) -> Dict[str, Any]:
        result = self.office_model.get_all(page, page_size, status, office_type)
        items = [self.office_model.to_dict(item) for item in result.get('items', [])]

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

    def get_office_by_id(self, office_id: int) -> Dict[str, Any]:
        office = self.office_model.get_by_id(office_id)
        if not office:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        self.office_model.increment_view_count(office_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': self.office_model.to_dict(office)
        }

    def create_office(self, admin_id: int, office_type: str, title: str, content: str = '',
                     location: str = '', location_latitude: float = None,
                     location_longitude: float = None, open_hours: str = '',
                     contact: str = '', images: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not office_type or not title:
            return {
                'code': 1,
                'msg': '类型和标题不能为空',
                'data': None
            }

        office_id = self.office_model.create(
            admin_id=admin_id,
            office_type=office_type,
            title=title,
            content=content,
            location=location,
            location_latitude=location_latitude,
            location_longitude=location_longitude,
            open_hours=open_hours,
            contact=contact,
            images=images,
            sort_order=sort_order
        )

        if office_id > 0:
            office = self.office_model.get_by_id(office_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.office_model.to_dict(office)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_office(self, admin_id: int, office_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        office = self.office_model.get_by_id(office_id)
        if not office:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.office_model.update(office_id, data)
        if affected >= 0:
            updated_office = self.office_model.get_by_id(office_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.office_model.to_dict(updated_office)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def publish_office(self, admin_id: int, office_id: int) -> Dict[str, Any]:
        office = self.office_model.get_by_id(office_id)
        if not office:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.office_model.publish(office_id)
        if affected > 0:
            updated_office = self.office_model.get_by_id(office_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self.office_model.to_dict(updated_office)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def close_office(self, admin_id: int, office_id: int) -> Dict[str, Any]:
        office = self.office_model.get_by_id(office_id)
        if not office:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.office_model.close(office_id)
        if affected > 0:
            updated_office = self.office_model.get_by_id(office_id)
            return {
                'code': 0,
                'msg': '已关闭',
                'data': self.office_model.to_dict(updated_office)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def delete_office(self, admin_id: int, office_id: int) -> Dict[str, Any]:
        office = self.office_model.get_by_id(office_id)
        if not office:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.office_model.delete(office_id)
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
