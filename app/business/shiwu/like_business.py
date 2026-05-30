from typing import Dict, Any
from app.model.shiwu_model import LikeModel, PostModel, CommentModel, UserModel, NotificationModel


class LikeBusiness:
    def __init__(self):
        self.like_model = LikeModel()
        self.post_model = PostModel()
        self.comment_model = CommentModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()

    def toggle_like(self, user_id: int, target_id: int, target_type: str) -> Dict[str, Any]:
        if target_type not in [LikeModel.TYPE_POST, LikeModel.TYPE_COMMENT]:
            return {
                'code': 1,
                'msg': '类型不正确',
                'data': None
            }

        if target_type == LikeModel.TYPE_POST:
            target = self.post_model.get_by_id(target_id)
            if not target:
                return {
                    'code': 1,
                    'msg': '信息不存在',
                    'data': None
                }
        else:
            target = self.comment_model.get_by_id(target_id)
            if not target:
                return {
                    'code': 1,
                    'msg': '评论不存在',
                    'data': None
                }

        has_liked = self.like_model.has_liked(user_id, target_id, target_type)
        
        if has_liked:
            affected = self.like_model.delete(user_id, target_id, target_type)
            if affected > 0:
                if target_type == LikeModel.TYPE_POST:
                    self.post_model.increment_like_count(target_id, -1)
                return {
                    'code': 0,
                    'msg': '已取消点赞',
                    'data': {'liked': False}
                }
        else:
            like_id = self.like_model.create(user_id, target_id, target_type)
            if like_id > 0:
                if target_type == LikeModel.TYPE_POST:
                    self.post_model.increment_like_count(target_id, 1)
                    
                    if target.get('user_id') != user_id:
                        self.notification_model.create(
                            user_id=target.get('user_id'),
                            notification_type='like',
                            title='收到新的点赞',
                            content=f'有人点赞了您发布的"{target.get("title")}"',
                            related_id=target_id,
                            related_type='post'
                        )
                
                return {
                    'code': 0,
                    'msg': '点赞成功',
                    'data': {'liked': True}
                }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def has_liked(self, user_id: int, target_id: int, target_type: str) -> Dict[str, Any]:
        liked = self.like_model.has_liked(user_id, target_id, target_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'liked': liked}
        }

    def get_like_count(self, target_id: int, target_type: str) -> Dict[str, Any]:
        count = self.like_model.get_count(target_id, target_type)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'count': count}
        }

    def get_my_likes(self, user_id: int, target_type: str = None,
                    page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.like_model.get_by_user(user_id, target_type, page, page_size)
        items = []
        for item in result.get('items', []):
            like_dict = {
                'id': item.get('id'),
                'target_id': item.get('target_id'),
                'target_type': item.get('target_type'),
                'created_at': item.get('created_at')
            }
            
            if item.get('target_type') == LikeModel.TYPE_POST:
                post = self.post_model.get_by_id(item.get('target_id', 0))
                if post:
                    like_dict['post'] = self.post_model.to_dict(post)
            else:
                comment = self.comment_model.get_by_id(item.get('target_id', 0))
                if comment:
                    like_dict['comment'] = self.comment_model.to_dict(comment)
                    post = self.post_model.get_by_id(comment.get('post_id', 0))
                    if post:
                        like_dict['post'] = self.post_model.to_dict(post)
            
            items.append(like_dict)

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
