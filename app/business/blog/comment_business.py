from typing import Dict, Any
from app.model.blog import BlogCommentModel, BlogPostModel, BlogUserModel


class BlogCommentBusiness:
    def __init__(self):
        self.comment_model = BlogCommentModel()
        self.post_model = BlogPostModel()
        self.user_model = BlogUserModel()

    def create_comment(self, post_id: int, content: str, user_id: int = None,
                       parent_id: int = None, nickname: str = None, email: str = None) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}
        if post.get('status') != BlogPostModel.STATUS_PUBLISHED:
            return {'code': 1, 'message': '文章未发布，无法评论', 'data': None}
        if not content or len(content.strip()) < 1:
            return {'code': 1, 'message': '评论内容不能为空', 'data': None}

        if parent_id:
            parent = self.comment_model.get_by_id(parent_id)
            if not parent:
                return {'code': 1, 'message': '回复的评论不存在', 'data': None}

        comment_id = self.comment_model.create(
            post_id=post_id,
            content=content,
            user_id=user_id,
            parent_id=parent_id,
            nickname=nickname,
            email=email
        )

        if comment_id > 0:
            comment = self.comment_model.get_by_id(comment_id)
            return {
                'code': 0,
                'message': '评论成功',
                'data': self.comment_model.to_dict(comment, with_user=True)
            }
        return {'code': 1, 'message': '评论失败', 'data': None}

    def get_comment_list(self, post_id: int = None, page: int = 1, page_size: int = 100, status: int = 1) -> Dict[str, Any]:
        if not post_id:
            return {'code': 1, 'message': '缺少文章ID', 'data': None}

        result = self.comment_model.get_by_post(post_id, page, page_size, status)
        items = []
        for comment in result.get('items', []):
            if not comment.get('parent_id'):
                items.append(self.comment_model.to_dict(comment, with_user=True, with_replies=True))

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': result.get('total', 0),
                'page': result.get('page', page),
                'page_size': result.get('page_size', page_size),
                'total_pages': result.get('total_pages', 0)
            }
        }

    def delete_comment(self, comment_id: int, user_id: int = None) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {'code': 1, 'message': '评论不存在', 'data': None}
        if user_id and comment.get('user_id') and comment.get('user_id') != user_id:
            return {'code': 1, 'message': '只能删除自己的评论', 'data': None}

        affected = self.comment_model.delete(comment_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def like_comment(self, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {'code': 1, 'message': '评论不存在', 'data': None}

        self.comment_model.increment_like_count(comment_id, 1)
        return {'code': 0, 'message': '已点赞', 'data': None}
