from typing import Dict, Any
from app.model.huodong import CommentModel, ActivityModel, HuodongUserModel


class CommentBusiness:
    def __init__(self):
        self.comment_model = CommentModel()
        self.activity_model = ActivityModel()
        self.user_model = HuodongUserModel()

    def create_comment(self, user_id: int, activity_id: int, content: str,
                        parent_id: int = 0) -> Dict[str, Any]:
        activity = self.activity_model.get_by_id(activity_id)
        if not activity:
            return {'code': 1, 'msg': '活动不存在', 'data': None}
        if not content or len(content.strip()) < 1:
            return {'code': 1, 'msg': '评论内容不能为空', 'data': None}
        if parent_id > 0:
            parent = self.comment_model.get_by_id(parent_id)
            if not parent:
                return {'code': 1, 'msg': '回复的评论不存在', 'data': None}
        comment_id = self.comment_model.create(activity_id, user_id, content.strip(), parent_id)
        if comment_id > 0:
            comment = self.comment_model.get_by_id(comment_id)
            return {'code': 0, 'msg': '评论成功', 'data': self.comment_model.to_dict(comment)}
        return {'code': 1, 'msg': '评论失败', 'data': None}

    def get_comments_by_activity(self, activity_id: int, page: int = 1,
                                  page_size: int = 20) -> Dict[str, Any]:
        result = self.comment_model.get_by_activity(activity_id, page, page_size)
        items = []
        for comment in result.get('items', []):
            comment_data = self.comment_model.to_dict(comment)
            user = self.user_model.get_by_id(comment.get('user_id'))
            if user:
                comment_data['user'] = self.user_model.to_public_dict(user)
            if comment.get('parent_id', 0) > 0:
                replies = self.comment_model.get_replies(comment.get('id'))
                comment_data['replies'] = []
                for reply in replies:
                    reply_data = self.comment_model.to_dict(reply)
                    reply_user = self.user_model.get_by_id(reply.get('user_id'))
                    if reply_user:
                        reply_data['user'] = self.user_model.to_public_dict(reply_user)
                    comment_data['replies'].append(reply_data)
            items.append(comment_data)
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

    def delete_comment(self, user_id: int, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {'code': 1, 'msg': '评论不存在', 'data': None}
        if comment.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能删除自己的评论', 'data': None}
        affected = self.comment_model.delete(comment_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
