from typing import Dict, Any, Optional, List
from app.model.exchange import ExItemModel, ExUserModel


class ExItemBusiness:
    def __init__(self):
        self.item_model = ExItemModel()
        self.user_model = ExUserModel()

    def publish(self, user_id: int, title: str, category: str, condition: int,
                description: str, images: List[str], expect_categories: List[str], city: str) -> Dict[str, Any]:
        if not title or len(title.strip()) == 0:
            return {
                'code': 1,
                'msg': '请输入物品标题',
                'data': None
            }
        
        if not category or category not in ExItemModel.CATEGORIES:
            return {
                'code': 1,
                'msg': '请选择正确的物品分类',
                'data': None
            }
        
        if condition not in [1, 2, 3, 4]:
            return {
                'code': 1,
                'msg': '新旧程度参数错误',
                'data': None
            }
        
        if not isinstance(images, list):
            images = []
        
        if not isinstance(expect_categories, list):
            expect_categories = []
        
        item_id = self.item_model.create(
            user_id=user_id,
            title=title,
            category=category,
            condition=condition,
            description=description,
            images=images,
            expect_categories=expect_categories,
            city=city
        )
        
        if item_id > 0:
            item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self.item_model.to_public_dict(item)
            }
        
        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def get_detail(self, item_id: int, viewer_id: int = None) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }
        
        if viewer_id is not None and item.get('user_id') != viewer_id:
            self.item_model.add_view_count(item_id)
        
        owner = self.user_model.get_by_id(item.get('user_id'))
        if owner:
            owner_public = self.user_model.to_public_dict(owner)
        else:
            owner_public = None
        
        result = self.item_model.to_public_dict(item)
        result['owner'] = owner_public
        
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def search(self, keyword: str = None, category: str = None, city: str = None,
               condition: int = None, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 20
        if page_size > 100:
            page_size = 100
        
        result = self.item_model.search(
            keyword=keyword,
            category=category,
            city=city,
            condition=condition,
            page=page,
            page_size=page_size
        )
        
        items = [self.item_model.to_public_dict(item) for item in result.get('items', [])]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_items(self, user_id: int, page: int = 1, page_size: int = 20, status: int = None) -> Dict[str, Any]:
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 20
        
        result = self.item_model.get_list_by_user(user_id, page, page_size, status)
        items = [self.item_model.to_public_dict(item) for item in result.get('items', [])]
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def update(self, user_id: int, item_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }
        
        if item.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权编辑此物品',
                'data': None
            }
        
        if item.get('status') == ExItemModel.STATUS_EXCHANGED:
            return {
                'code': 1,
                'msg': '已交换的物品无法编辑',
                'data': None
            }
        
        update_data = {}
        if 'title' in data:
            update_data['title'] = data['title']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'condition' in data:
            update_data['condition'] = data['condition']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'images' in data:
            update_data['images'] = data['images']
        if 'expect_categories' in data:
            update_data['expect_categories'] = data['expect_categories']
        if 'city' in data:
            update_data['city'] = data['city']
        
        if not update_data:
            return {
                'code': 1,
                'msg': '没有需要更新的内容',
                'data': None
            }
        
        affected = self.item_model.update(item_id, update_data)
        if affected >= 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.item_model.to_public_dict(updated_item)
            }
        
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_status(self, user_id: int, item_id: int, status: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }
        
        if item.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作此物品',
                'data': None
            }
        
        if status not in [ExItemModel.STATUS_ON_SHELF, ExItemModel.STATUS_OFF_SHELF]:
            return {
                'code': 1,
                'msg': '状态参数错误',
                'data': None
            }
        
        if item.get('status') == ExItemModel.STATUS_EXCHANGED:
            return {
                'code': 1,
                'msg': '已交换的物品无法更改状态',
                'data': None
            }
        
        affected = self.item_model.update_status(item_id, status)
        if affected > 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.item_model.to_public_dict(updated_item)
            }
        
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def get_categories(self) -> Dict[str, Any]:
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'categories': ExItemModel.CATEGORIES,
                'conditions': ExItemModel.CONDITIONS
            }
        }

    def get_all_items(self, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        conditions = {}
        if status is not None:
            conditions['status'] = status
        
        result = self.item_model.get_all(page, page_size, conditions)
        items = [self.item_model.to_public_dict(item) for item in result.get('items', [])]
        
        for item in items:
            owner = self.user_model.get_by_id(item.get('user_id'))
            if owner:
                item['owner_nickname'] = owner.get('nickname')
                item['owner_phone'] = owner.get('phone')
        
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def admin_update_status(self, item_id: int, status: int) -> Dict[str, Any]:
        item = self.item_model.get_by_id(item_id)
        if not item:
            return {
                'code': 1,
                'msg': '物品不存在',
                'data': None
            }
        
        affected = self.item_model.update_status(item_id, status)
        if affected > 0:
            updated_item = self.item_model.get_by_id(item_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.item_model.to_public_dict(updated_item)
            }
        
        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }
