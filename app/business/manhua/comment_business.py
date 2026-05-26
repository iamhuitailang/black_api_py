from typing import Dict, Any, Optional
from app.model.manhua import CommentModel, ComicModel, UserModel


class ManhuaCommentBusiness:
    def __init__(self):
        self.comment_model = CommentModel()
        self.comic_model = ComicModel()
        self.user_model = UserModel()

    def create_comment(self, user_id: int, comic_id: int, content: str,
                       chapter_id: int = None, parent_id: int = 0) -> Dict[str, Any]:
        if not content or not content.strip():
            return {
                'code': 1,
                'msg': '评论内容不能为空',
                'data': None
            }

        if len(content) > 500:
            return {
                'code': 1,
                'msg': '评论内容不能超过500字',
                'data': None
            }

        comic = self.comic_model.get_by_id(comic_id)
        if not comic:
            return {
                'code': 1,
                'msg': '漫画不存在',
                'data': None
            }

        if parent_id and parent_id > 0:
            parent = self.comment_model.get_by_id(parent_id)
            if not parent or parent.get('status') == CommentModel.STATUS_DELETED:
                return {
                    'code': 1,
                    'msg': '父评论不存在或已删除',
                    'data': None
                }

        comment_id = self.comment_model.create(user_id, comic_id, content.strip(), chapter_id, parent_id)
        if comment_id > 0:
            comment = self.comment_model.get_by_id(comment_id)
            return {
                'code': 0,
                'msg': '评论成功',
                'data': self._format_comment(comment)
            }

        return {
            'code': 1,
            'msg': '评论失败',
            'data': None
        }

    def get_comic_comments(self, comic_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.comment_model.get_by_comic_id(comic_id, page, page_size)
        items = [self._format_comment(item) for item in result.get('items', [])]

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

    def get_comment_replies(self, parent_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.comment_model.get_by_parent_id(parent_id, page, page_size)
        items = [self._format_comment(item) for item in result.get('items', [])]

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

    def like_comment(self, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {
                'code': 1,
                'msg': '评论不存在',
                'data': None
            }

        self.comment_model.increment_like(comment_id, 1)
        comment = self.comment_model.get_by_id(comment_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'like_count': comment.get('like_count', 0)}
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
                'msg': '无权删除此评论',
                'data': None
            }

        self.comment_model.delete(comment_id)
        return {
            'code': 0,
            'msg': '删除成功',
            'data': None
        }

    def get_user_comments(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.comment_model.get_by_user_id(user_id, page, page_size)
        items = [self._format_comment(item) for item in result.get('items', [])]

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

    def _format_comment(self, comment: Dict[str, Any]) -> Dict[str, Any]:
        user = self.user_model.get_by_id(comment.get('user_id'))
        user_info = None
        if user:
            user_info = self.user_model.to_public_dict(user)

        return {
            'id': comment.get('id'),
            'user_id': comment.get('user_id'),
            'comic_id': comment.get('comic_id'),
            'chapter_id': comment.get('chapter_id'),
            'content': comment.get('content'),
            'parent_id': comment.get('parent_id'),
            'like_count': comment.get('like_count'),
            'status': comment.get('status'),
            'user': user_info,
            'created_at': comment.get('created_at')
        }