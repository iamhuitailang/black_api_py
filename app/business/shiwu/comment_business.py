from typing import Dict, Any
from app.model.shiwu_model import CommentModel, PostModel, UserModel, NotificationModel


class CommentBusiness:
    def __init__(self):
        self.comment_model = CommentModel()
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.notification_model = NotificationModel()

    def create_comment(self, user_id: int, post_id: int, content: str,
                      parent_id: int = 0, reply_to_user_id: int = 0) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '信息不存在',
                'data': None
            }

        if not content or not content.strip():
            return {
                'code': 1,
                'msg': '评论内容不能为空',
                'data': None
            }

        if parent_id > 0:
            parent = self.comment_model.get_by_id(parent_id)
            if not parent:
                return {
                    'code': 1,
                    'msg': '回复的评论不存在',
                    'data': None
                }

        comment_id = self.comment_model.create(
            post_id=post_id,
            user_id=user_id,
            content=content.strip(),
            parent_id=parent_id,
            reply_to_user_id=reply_to_user_id
        )

        if comment_id > 0:
            self.post_model.increment_comment_count(post_id)
            
            if post.get('user_id') != user_id:
                self.notification_model.create(
                    user_id=post.get('user_id'),
                    notification_type='comment',
                    title='收到新的评论',
                    content=f'您发布的"{post.get("title")}"收到了新的评论',
                    related_id=comment_id,
                    related_type='comment'
                )

            comment = self.comment_model.get_by_id(comment_id)
            return {
                'code': 0,
                'msg': '评论成功',
                'data': self.comment_model.to_dict(comment)
            }

        return {
            'code': 1,
            'msg': '评论失败',
            'data': None
        }

    def get_comments_by_post(self, post_id: int, page: int = 1,
                            page_size: int = 10) -> Dict[str, Any]:
        result = self.comment_model.get_by_post(post_id, page, page_size)
        items = [self.comment_model.to_dict(item) for item in result.get('items', [])]

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

    def get_my_comments(self, user_id: int, page: int = 1,
                       page_size: int = 10) -> Dict[str, Any]:
        sql = f"""
            SELECT * FROM {self.comment_model.TABLE_NAME} 
            WHERE user_id = ? AND status = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        """
        offset = (page - 1) * page_size
        items = self.comment_model.db.fetch_all(sql, (user_id, CommentModel.STATUS_NORMAL, page_size, offset))
        
        count_sql = f"SELECT COUNT(*) as total FROM {self.comment_model.TABLE_NAME} WHERE user_id = ? AND status = ?"
        total_result = self.comment_model.db.fetch_one(count_sql, (user_id, CommentModel.STATUS_NORMAL))
        total = total_result.get('total', 0) if total_result else 0

        result_items = []
        for item in items:
            comment_dict = self.comment_model.to_dict(item)
            post = self.post_model.get_by_id(item.get('post_id', 0))
            if post:
                comment_dict['post'] = self.post_model.to_dict(post)
            result_items.append(comment_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': result_items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def like_comment(self, user_id: int, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {
                'code': 1,
                'msg': '评论不存在',
                'data': None
            }

        affected = self.comment_model.increment_like_count(comment_id, 1)
        if affected > 0:
            updated_comment = self.comment_model.get_by_id(comment_id)
            return {
                'code': 0,
                'msg': '操作成功',
                'data': self.comment_model.to_dict(updated_comment)
            }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def delete_comment(self, user_id: int, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {
                'code': 1,
                'msg': '评论不存在',
                'data': None
            }

        if comment.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.comment_model.delete(comment_id)
        if affected > 0:
            self.post_model.increment_comment_count(comment.get('post_id'), -1)
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

    def admin_delete_comment(self, admin_id: int, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {
                'code': 1,
                'msg': '评论不存在',
                'data': None
            }

        affected = self.comment_model.hard_delete(comment_id)
        if affected > 0:
            self.post_model.increment_comment_count(comment.get('post_id'), -1)
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
