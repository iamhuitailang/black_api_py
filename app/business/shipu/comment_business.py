from typing import Dict, Any
from app.model.shipu_077_model import CommentModel, RecipeModel, UserModel


class ShipuCommentBusiness:
    def __init__(self):
        self.comment_model = CommentModel()
        self.recipe_model = RecipeModel()
        self.user_model = UserModel()

    def create(self, user_id: int, recipe_id: int, content: str, parent_id: int = 0) -> Dict[str, Any]:
        if not content:
            return {
                'code': 1,
                'msg': '评论内容不能为空',
                'data': None
            }

        recipe = self.recipe_model.get_by_id(recipe_id)
        if not recipe:
            return {
                'code': 1,
                'msg': '食谱不存在',
                'data': None
            }

        comment_id = self.comment_model.create(user_id, recipe_id, content, parent_id)
        if comment_id > 0:
            self.recipe_model.increment_comment_count(recipe_id, 1)
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

    def delete(self, comment_id: int, user_id: int) -> Dict[str, Any]:
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
            self.recipe_model.increment_comment_count(comment.get('recipe_id'), -1)
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

    def like(self, comment_id: int) -> Dict[str, Any]:
        comment = self.comment_model.get_by_id(comment_id)
        if not comment:
            return {
                'code': 1,
                'msg': '评论不存在',
                'data': None
            }

        affected = self.comment_model.increment_like_count(comment_id, 1)
        if affected > 0:
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '点赞失败',
            'data': None
        }

    def get_by_recipe(self, recipe_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.comment_model.get_by_recipe(recipe_id, page, page_size)
        items = []
        for comment in result.get('items', []):
            comment_dict = self.comment_model.to_dict(comment)
            comment_dict['replies'] = [
                self.comment_model.to_dict(reply)
                for reply in self.comment_model.get_replies(comment.get('id'))
            ]
            items.append(comment_dict)

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
