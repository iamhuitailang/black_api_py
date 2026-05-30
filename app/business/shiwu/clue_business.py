from typing import Dict, Any
from app.model.shiwu_model import ClueModel, PostModel, UserModel, NotificationModel, ReviewModel


class ClueBusiness:
    def __init__(self):
        self.clue_model = ClueModel()
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()
        self.review_model = ReviewModel()

    def create_clue(self, provider_id: int, post_id: int, description: str = '',
                   location: str = '', location_latitude: float = None,
                   location_longitude: float = None, contact: str = '',
                   images: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if post.get('post_type') != PostModel.TYPE_LOST:
            return {
                'code': 1,
                'msg': '只能对寻物启事提供线索',
                'data': None
            }

        if post.get('status') != PostModel.STATUS_ACTIVE:
            return {
                'code': 1,
                'msg': '该信息已关闭或已找回',
                'data': None
            }

        if post.get('user_id') == provider_id:
            return {
                'code': 1,
                'msg': '不能给自己的信息提供线索',
                'data': None
            }

        clue_id = self.clue_model.create(
            post_id=post_id,
            provider_id=provider_id,
            post_owner_id=post.get('user_id'),
            description=description,
            location=location,
            location_latitude=location_latitude,
            location_longitude=location_longitude,
            contact=contact,
            images=images
        )

        if clue_id > 0:
            self.notification_model.create(
                user_id=post.get('user_id'),
                notification_type='clue',
                title='收到新的线索',
                content=f'您发布的"{post.get("title")}"收到了新的线索',
                related_id=clue_id,
                related_type='clue'
            )

            clue = self.clue_model.get_by_id(clue_id)
            return {
                'code': 0,
                'msg': '线索已提交',
                'data': self.clue_model.to_dict(clue, provider_id)
            }

        return {
            'code': 1,
            'msg': '线索提交失败',
            'data': None
        }

    def get_clue_by_id(self, clue_id: int, current_user_id: int = None) -> Dict[str, Any]:
        clue = self.clue_model.get_by_id(clue_id)
        if not clue:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        if current_user_id and current_user_id not in [clue.get('provider_id'), clue.get('post_owner_id')]:
            return {
                'code': 1,
                'msg': '无权限查看',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.clue_model.to_dict(clue, current_user_id)
        }

    def get_clues_by_post(self, post_id: int, user_id: int, page: int = 1,
                         page_size: int = 10, status: int = None) -> Dict[str, Any]:
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
                'msg': '无权限查看',
                'data': None
            }

        result = self.clue_model.get_by_post(post_id, page, page_size, status)
        items = [self.clue_model.to_dict(item, user_id) for item in result.get('items', [])]

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

    def get_my_clues(self, provider_id: int, page: int = 1, page_size: int = 10,
                    status: int = None) -> Dict[str, Any]:
        result = self.clue_model.get_by_provider(provider_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            clue_dict = self.clue_model.to_dict(item, provider_id)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                clue_dict['post'] = self.post_model.to_dict(post)
            items.append(clue_dict)

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

    def get_received_clues(self, owner_id: int, page: int = 1, page_size: int = 10,
                          status: int = None) -> Dict[str, Any]:
        result = self.clue_model.get_by_owner(owner_id, page, page_size, status)
        items = []
        for item in result.get('items', []):
            clue_dict = self.clue_model.to_dict(item, owner_id)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                clue_dict['post'] = self.post_model.to_dict(post)
            items.append(clue_dict)

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

    def mark_clue_read(self, owner_id: int, clue_id: int) -> Dict[str, Any]:
        clue = self.clue_model.get_by_id(clue_id)
        if not clue:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        if clue.get('post_owner_id') != owner_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        affected = self.clue_model.mark_as_read(clue_id)
        if affected > 0:
            updated_clue = self.clue_model.get_by_id(clue_id)
            return {
                'code': 0,
                'msg': '操作成功',
                'data': self.clue_model.to_dict(updated_clue, owner_id)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def mark_clue_contacted(self, owner_id: int, clue_id: int) -> Dict[str, Any]:
        clue = self.clue_model.get_by_id(clue_id)
        if not clue:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        if clue.get('post_owner_id') != owner_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        affected = self.clue_model.mark_as_contacted(clue_id)
        if affected > 0:
            self.notification_model.create(
                user_id=clue.get('provider_id'),
                notification_type='clue',
                title='线索已被查看',
                content=f'您提供的线索已被失主查看并联系',
                related_id=clue_id,
                related_type='clue'
            )

            updated_clue = self.clue_model.get_by_id(clue_id)
            return {
                'code': 0,
                'msg': '操作成功',
                'data': self.clue_model.to_dict(updated_clue, owner_id)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def delete_clue(self, provider_id: int, clue_id: int) -> Dict[str, Any]:
        clue = self.clue_model.get_by_id(clue_id)
        if not clue:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        if clue.get('provider_id') != provider_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.clue_model.delete(clue_id)
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

    def create_review(self, reviewer_id: int, clue_id: int, rating: int = 5,
                     content: str = '') -> Dict[str, Any]:
        clue = self.clue_model.get_by_id(clue_id)
        if not clue:
            return {
                'code': 1,
                'msg': '线索不存在',
                'data': None
            }

        if reviewer_id == clue.get('post_owner_id'):
            reviewed_id = clue.get('provider_id')
        elif reviewer_id == clue.get('provider_id'):
            reviewed_id = clue.get('post_owner_id')
        else:
            return {
                'code': 1,
                'msg': '无权限评价',
                'data': None
            }

        review_id = self.review_model.create(
            post_id=clue.get('post_id'),
            related_id=clue_id,
            related_type=ReviewModel.TYPE_CLUE,
            reviewer_id=reviewer_id,
            reviewed_id=reviewed_id,
            rating=rating,
            content=content
        )

        if review_id > 0:
            self.notification_model.create(
                user_id=reviewed_id,
                notification_type='review',
                title='收到新的评价',
                content=f'您收到了一条新的评价，评分：{rating}星',
                related_id=review_id,
                related_type='review'
            )

            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': self.review_model.to_dict(review)
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }
