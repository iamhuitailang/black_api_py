from typing import Dict, Any, List, Optional
from app.model.biaoqing_model import AdModel


class BqAdBusiness:
    def __init__(self):
        self.ad_model = AdModel()

    def create(self, title: str = '', description: str = '', image_url: str = '',
                 link_url: str = '', position: int = 1, sort_order: int = 0,
                 start_time: str = '', end_time: str = '') -> Dict[str, Any]:
        if not image_url:
            return {
                'code': 1,
                'msg': '广告图片不能为空',
                'data': None
            }

        ad_id = self.ad_model.create(
            title=title, description=description,
            image_url=image_url, link_url=link_url,
            position=position, sort_order=sort_order,
            start_time=start_time, end_time=end_time
        )

        if ad_id > 0:
            ad = self.ad_model.get_by_id(ad_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': self.ad_model.to_dict(ad)
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update(self, ad_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        ad = self.ad_model.get_by_id(ad_id)
        if not ad:
            return {
                'code': 1,
                'msg': '广告不存在',
                'data': None
            }

        affected = self.ad_model.update(ad_id, data)
        if affected >= 0:
            updated = self.ad_model.get_by_id(ad_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.ad_model.to_dict(updated)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete(self, ad_id: int) -> Dict[str, Any]:
        ad = self.ad_model.get_by_id(ad_id)
        if not ad:
            return {
                'code': 1,
                'msg': '广告不存在',
                'data': None
            }

        affected = self.ad_model.delete(ad_id)
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

    def get_by_id(self, ad_id: int, increment_view: bool = True) -> Dict[str, Any]:
        ad = self.ad_model.get_by_id(ad_id)
        if not ad:
            return {
                'code': 1,
                'msg': '广告不存在',
                'data': None
            }

        if increment_view:
            self.ad_model.increment_view(ad_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': self.ad_model.to_dict(ad)
        }

    def get_list(self, page: int = 1, page_size: int = 20,
                  status: int = None, position: int = None) -> Dict[str, Any]:
        result = self.ad_model.get_all(page, page_size, status, position)
        items = [self.ad_model.to_dict(item) for item in result.get('items', [])]

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

    def get_by_position(self, position: int, limit: int = 10) -> Dict[str, Any]:
        ads = self.ad_model.get_active_by_position(position, limit)

        for ad in ads:
            self.ad_model.increment_view(ad.get('id'))

        items = [self.ad_model.to_dict(ad) for ad in ads]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def record_click(self, ad_id: int) -> Dict[str, Any]:
        ad = self.ad_model.get_by_id(ad_id)
        if not ad:
            return {
                'code': 1,
                'msg': '广告不存在',
                'data': None
            }

        self.ad_model.increment_click(ad_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': None
        }
