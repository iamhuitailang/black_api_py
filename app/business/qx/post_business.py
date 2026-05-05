from typing import Dict, Any, Optional, List
from app.model.qx import PostModel, UserModel


class QxPostBusiness:
    def __init__(self):
        self.post_model = PostModel()
        self.user_model = UserModel()

    def create_post(self, user_id: int, content: str = '',
                    images: List[str] = None, activity_id: int = 0) -> Dict[str, Any]:
        if not content and not images:
            return {
                'code': 1,
                'msg': '内容或图片不能为空',
                'data': None
            }

        post_id = self.post_model.create(
            user_id=user_id,
            content=content,
            images=images,
            activity_id=activity_id
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

    def get_post_by_id(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
                'data': None
            }

        result = self.post_model.to_dict(post)
        user = self.user_model.get_by_id(post.get('user_id', 0))
        if user:
            result['user'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'level': user.get('level'),
                'bike_type': user.get('bike_type')
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_feed(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.post_model.get_feed(page=page, page_size=page_size)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result.get('items', []),
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_my_posts(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.post_model.get_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

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

    def get_posts_by_user(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.post_model.get_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

        items = []
        user = self.user_model.get_by_id(user_id)
        user_info = {
            'id': user.get('id'),
            'nickname': user.get('nickname'),
            'avatar': user.get('avatar'),
            'level': user.get('level')
        } if user else None

        for item in result.get('items', []):
            post_dict = self.post_model.to_dict(item)
            if user_info:
                post_dict['user'] = user_info
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

    def get_posts_by_activity(self, activity_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            activity_id=activity_id
        )

        items = []
        for item in result.get('items', []):
            post_dict = self.post_model.to_dict(item)
            user = self.user_model.get_by_id(item.get('user_id', 0))
            if user:
                post_dict['user'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'level': user.get('level')
                }
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

    def update_post(self, post_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改此动态',
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

    def delete_post(self, post_id: int, user_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除此动态',
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

    def like_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
                'data': None
            }

        affected = self.post_model.increment_like(post_id)
        if affected > 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': {
                    'like_count': updated_post.get('like_count', 0)
                }
            }

        return {
            'code': 1,
            'msg': '点赞失败',
            'data': None
        }

    def admin_delete_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
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
