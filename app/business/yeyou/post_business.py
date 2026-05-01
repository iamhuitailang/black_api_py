from typing import Dict, Any, List, Optional
from app.model.yeyou import PostModel, UserModel, ActivityModel
import json


class PostBusiness:
    def __init__(self):
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.activity_model = ActivityModel()

    def create_post(self, user_id: int, content: str = '', images: List[str] = None,
                    activity_id: int = None) -> Dict[str, Any]:
        if not content and not images:
            return {
                'code': 1,
                'msg': '内容或图片不能为空',
                'data': None
            }

        if activity_id:
            activity = self.activity_model.get_by_id(activity_id)
            if not activity:
                return {
                    'code': 1,
                    'msg': '关联的活动不存在',
                    'data': None
                }

        post_id = self.post_model.create(user_id, content, images, activity_id)
        if post_id > 0:
            post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self._format_post(post)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def _format_post(self, post: Dict[str, Any]) -> Dict[str, Any]:
        if not post:
            return None

        post_dict = self.post_model.to_public_dict(post)

        user = self.user_model.get_by_id(post.get('user_id'))
        if user:
            post_dict['user'] = self.user_model.to_public_dict(user)

        activity_id = post.get('activity_id')
        if activity_id:
            activity = self.activity_model.get_by_id(activity_id)
            if activity:
                post_dict['activity'] = self.activity_model.to_public_dict(activity)

        return post_dict

    def get_post_list(self, page: int = 1, page_size: int = 10,
                      user_id: int = None, activity_id: int = None,
                      keyword: str = None) -> Dict[str, Any]:
        if keyword:
            result = self.post_model.search(keyword, page, page_size)
        else:
            result = self.post_model.get_list(page, page_size, user_id, activity_id)

        items = []
        for post in result.get('items', []):
            formatted = self._format_post(post)
            if formatted:
                items.append(formatted)

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

    def get_post_detail(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post or post.get('status') != PostModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '动态不存在或已删除',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self._format_post(post)
        }

    def update_post(self, post_id: int, user_id: int, content: str = None,
                    images: List[str] = None) -> Dict[str, Any]:
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
                'msg': '只能编辑自己发布的动态',
                'data': None
            }

        affected = self.post_model.update(post_id, content, images)
        if affected >= 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self._format_post(updated_post)
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
                'msg': '只能删除自己发布的动态',
                'data': None
            }

        affected = self.post_model.update_status(post_id, PostModel.STATUS_HIDDEN)
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
        if not post or post.get('status') != PostModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '动态不存在或已删除',
                'data': None
            }

        affected = self.post_model.update_like_count(post_id, 1)
        if affected >= 0:
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

    def unlike_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '动态不存在',
                'data': None
            }

        affected = self.post_model.update_like_count(post_id, -1)
        if affected >= 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '取消点赞成功',
                'data': {
                    'like_count': updated_post.get('like_count', 0)
                }
            }

        return {
            'code': 1,
            'msg': '取消点赞失败',
            'data': None
        }
