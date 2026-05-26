from typing import Dict, Any, Optional, List
from app.model.blog import BlogPostModel, BlogUserModel, BlogCategoryModel, BlogTagModel, BlogPostTagModel


class BlogPostBusiness:
    def __init__(self):
        self.post_model = BlogPostModel()
        self.user_model = BlogUserModel()
        self.category_model = BlogCategoryModel()
        self.tag_model = BlogTagModel()
        self.post_tag_model = BlogPostTagModel()

    def create_post(self, user_id: int, title: str, content: str = '', summary: str = '',
                    category_id: int = None, cover: str = None, slug: str = None,
                    status: int = 0, tag_ids: List[int] = None, is_top: int = 0) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        if not title or len(title.strip()) < 2:
            return {'code': 1, 'message': '标题至少 2 个字符', 'data': None}

        if category_id:
            cat = self.category_model.get_by_id(category_id)
            if not cat:
                return {'code': 1, 'message': '分类不存在', 'data': None}

        post_id = self.post_model.create(
            user_id=user_id,
            title=title,
            content=content,
            summary=summary,
            category_id=category_id,
            cover=cover,
            slug=slug,
            status=status,
            tag_ids=tag_ids,
            is_top=is_top
        )

        if post_id > 0:
            post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'message': '创建成功',
                'data': self.post_model.to_dict(post)
            }

        return {'code': 1, 'message': '创建失败', 'data': None}

    def update_post(self, user_id: int, post_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}

        if post.get('user_id') != user_id:
            return {'code': 1, 'message': '只能修改自己的文章', 'data': None}

        if 'category_id' in data and data.get('category_id'):
            cat = self.category_model.get_by_id(data['category_id'])
            if not cat:
                return {'code': 1, 'message': '分类不存在', 'data': None}

        affected = self.post_model.update(post_id, data)
        if affected >= 0:
            updated = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.post_model.to_dict(updated)
            }

        return {'code': 1, 'message': '更新失败', 'data': None}

    def get_post_detail(self, post_id: int, increment_view: bool = True) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}

        if post.get('status') == BlogPostModel.STATUS_DELETED:
            return {'code': 1, 'message': '文章不存在', 'data': None}

        if increment_view:
            self.post_model.increment_view_count(post_id)
            post = self.post_model.get_by_id(post_id)

        return {
            'code': 0,
            'message': 'success',
            'data': self.post_model.to_dict(post, with_tags=True, with_author=True, with_category=True)
        }

    def get_post_list(self, page: int = 1, page_size: int = 10,
                      category_id: int = None, tag_id: int = None, status: int = 1,
                      user_id: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            tag_id=tag_id,
            status=status,
            user_id=user_id,
            keyword=keyword
        )

        items = []
        for post in result.get('items', []):
            items.append(self.post_model.to_dict(post, with_tags=True, with_author=True, with_category=True))

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

    def publish_post(self, user_id: int, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}
        if post.get('user_id') != user_id:
            return {'code': 1, 'message': '只能发布自己的文章', 'data': None}

        return self.update_post(user_id, post_id, {'status': BlogPostModel.STATUS_PUBLISHED})

    def delete_post(self, user_id: int, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}
        if post.get('user_id') != user_id:
            return {'code': 1, 'message': '只能删除自己的文章', 'data': None}

        affected = self.post_model.delete(post_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}

        return {'code': 1, 'message': '删除失败', 'data': None}

    def like_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {'code': 1, 'message': '文章不存在', 'data': None}
        if post.get('status') != BlogPostModel.STATUS_PUBLISHED:
            return {'code': 1, 'message': '文章未发布', 'data': None}

        self.post_model.increment_like_count(post_id, 1)
        return {'code': 0, 'message': '已点赞', 'data': None}

    def search_posts(self, keyword: str, page: int = 1, page_size: int = 10,
                     category_id: int = None, tag_id: int = None) -> Dict[str, Any]:
        return self.get_post_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            tag_id=tag_id,
            status=1,
            keyword=keyword
        )
