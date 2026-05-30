from typing import Dict, Any, Optional
from app.model.shiwu_model import PostModel, UserModel, NotificationModel


class PostBusiness:
    def __init__(self):
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()

    def create_post(self, user_id: int, post_type: str, category_code: str, title: str,
                   description: str, item_name: str = '', item_color: str = '',
                   item_brand: str = '', item_features: str = '', lost_time: str = None,
                   lost_location: str = '', lost_latitude: float = None, 
                   lost_longitude: float = None, contact: str = '', reward: str = '',
                   images: str = '', expire_days: int = 30) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if not post_type or not category_code or not title:
            return {
                'code': 1,
                'msg': '类型、分类、标题不能为空',
                'data': None
            }

        if post_type not in [PostModel.TYPE_LOST, PostModel.TYPE_FOUND]:
            return {
                'code': 1,
                'msg': '类型不正确',
                'data': None
            }

        post_id = self.post_model.create(
            user_id=user_id,
            post_type=post_type,
            category_code=category_code,
            title=title,
            description=description,
            item_name=item_name,
            item_color=item_color,
            item_brand=item_brand,
            item_features=item_features,
            lost_time=lost_time,
            lost_location=lost_location,
            lost_latitude=lost_latitude,
            lost_longitude=lost_longitude,
            contact=contact,
            reward=reward,
            images=images,
            expire_days=expire_days
        )

        if post_id > 0:
            post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self.post_model.to_dict(post)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def get_post_list(self, page: int = 1, page_size: int = 10,
                     post_type: str = None, category_code: str = None,
                     status: int = None, verify_status: int = None,
                     keyword: str = None, location: str = None) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            post_type=post_type,
            category_code=category_code,
            status=status,
            verify_status=verify_status,
            keyword=keyword,
            location=location
        )

        items = []
        for item in result.get('items', []):
            post_dict = self.post_model.to_dict(item)
            user = self.user_model.get_by_id(item.get('user_id', 0))
            if user:
                post_dict['user'] = self.user_model.to_simple_dict(user)
            items.append(post_dict)

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

    def get_my_posts(self, user_id: int, page: int = 1, page_size: int = 10,
                    post_type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.post_model.get_by_user(user_id, page, page_size, post_type, status)
        items = [self.post_model.to_dict(item) for item in result.get('items', [])]

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

    def get_post_detail(self, post_id: int, current_user_id: int = None) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        self.post_model.increment_view_count(post_id)

        post_dict = self.post_model.to_dict(post)
        user = self.user_model.get_by_id(post.get('user_id', 0))
        if user:
            post_dict['user'] = self.user_model.to_simple_dict(user)

        return {
            'code': 0,
            'msg': 'success',
            'data': post_dict
        }

    def update_post(self, user_id: int, post_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改',
                'data': None
            }

        if post.get('status') == PostModel.STATUS_CLAIMED:
            return {
                'code': 1,
                'msg': '已认领的信息不能修改',
                'data': None
            }

        affected = self.post_model.update(post_id, data)
        if affected >= 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.post_model.to_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_post_status(self, user_id: int, post_id: int, status: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        affected = self.post_model.update_status(post_id, status)
        if affected > 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': self.post_model.to_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def mark_as_found(self, user_id: int, post_id: int) -> Dict[str, Any]:
        return self.update_post_status(user_id, post_id, PostModel.STATUS_CLAIMED)

    def mark_as_closed(self, user_id: int, post_id: int) -> Dict[str, Any]:
        return self.update_post_status(user_id, post_id, PostModel.STATUS_CLOSED)

    def delete_post(self, user_id: int, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.post_model.delete(post_id)
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

    def verify_post(self, admin_id: int, post_id: int, verify_status: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.post_model.update_verify_status(post_id, verify_status)
        if affected > 0:
            updated_post = self.post_model.get_by_id(post_id)
            
            if verify_status == PostModel.VERIFY_PASS:
                self.notification_model.create(
                    user_id=post.get('user_id'),
                    notification_type='system',
                    title='信息审核通过',
                    content=f'您发布的"{post.get("title")}"已通过审核',
                    related_id=post_id,
                    related_type='post'
                )
            elif verify_status == PostModel.VERIFY_REJECT:
                self.notification_model.create(
                    user_id=post.get('user_id'),
                    notification_type='system',
                    title='信息审核未通过',
                    content=f'您发布的"{post.get("title")}"未通过审核，请修改后重新发布',
                    related_id=post_id,
                    related_type='post'
                )
            
            return {
                'code': 0,
                'msg': '审核成功',
                'data': self.post_model.to_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def set_top(self, admin_id: int, post_id: int, is_top: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.post_model.update_is_top(post_id, is_top)
        if affected > 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '设置成功',
                'data': self.post_model.to_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '设置失败',
            'data': None
        }

    def admin_delete_post(self, admin_id: int, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        affected = self.post_model.delete(post_id)
        if affected > 0:
            self.notification_model.create(
                user_id=post.get('user_id'),
                notification_type='system',
                title='信息已被删除',
                content=f'您发布的"{post.get("title")}"因违规已被管理员删除',
                related_id=post_id,
                related_type='post'
            )
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

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.post_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_map_posts(self, post_type: str = None, category_code: str = None) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=1,
            page_size=1000,
            post_type=post_type,
            category_code=category_code,
            status=PostModel.STATUS_ACTIVE,
            verify_status=PostModel.VERIFY_PASS
        )
        
        items = []
        for item in result.get('items', []):
            if item.get('lost_latitude') and item.get('lost_longitude'):
                post_dict = {
                    'id': item.get('id'),
                    'title': item.get('title'),
                    'post_type': item.get('post_type'),
                    'post_type_text': self.post_model.get_type_text(item.get('post_type')),
                    'post_type_color': self.post_model.get_type_color(item.get('post_type')),
                    'post_type_icon': self.post_model.get_type_icon(item.get('post_type')),
                    'lost_location': item.get('lost_location'),
                    'lost_latitude': item.get('lost_latitude'),
                    'lost_longitude': item.get('lost_longitude'),
                    'created_at': item.get('created_at')
                }
                items.append(post_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
