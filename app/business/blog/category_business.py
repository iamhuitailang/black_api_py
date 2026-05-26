from typing import Dict, Any, List
from app.model.blog import BlogCategoryModel, BlogPostModel


class BlogCategoryBusiness:
    def __init__(self):
        self.category_model = BlogCategoryModel()
        self.post_model = BlogPostModel()

    def create_category(self, name: str, slug: str, description: str = None,
                        color: str = None, sort: int = 0) -> Dict[str, Any]:
        if not name or len(name.strip()) < 1:
            return {'code': 1, 'message': '分类名称不能为空', 'data': None}
        if not slug or len(slug.strip()) < 1:
            return {'code': 1, 'message': '分类标识不能为空', 'data': None}
        if self.category_model.exists_by_slug(slug):
            return {'code': 1, 'message': '分类标识已存在', 'data': None}

        category_id = self.category_model.create(name, slug, description, color, sort)
        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'message': '创建成功',
                'data': self.category_model.to_dict(category, with_count=True)
            }
        return {'code': 1, 'message': '创建失败', 'data': None}

    def update_category(self, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {'code': 1, 'message': '分类不存在', 'data': None}
        if 'slug' in data and self.category_model.exists_by_slug(data['slug'], exclude_id=category_id):
            return {'code': 1, 'message': '分类标识已存在', 'data': None}

        affected = self.category_model.update(category_id, data)
        if affected >= 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.category_model.to_dict(updated, with_count=True)
            }
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_category(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {'code': 1, 'message': '分类不存在', 'data': None}

        post_count = self.category_model.count_posts(category_id)
        if post_count > 0:
            return {'code': 1, 'message': f'该分类下还有 {post_count} 篇文章，无法删除', 'data': None}

        affected = self.category_model.delete(category_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_category_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        result = self.category_model.get_list(page, page_size, keyword)
        items = [self.category_model.to_dict(c, with_count=True) for c in result.get('items', [])]
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

    def get_all_categories(self) -> Dict[str, Any]:
        categories = self.category_model.get_all()
        items = [self.category_model.to_dict(c, with_count=True) for c in categories]
        return {'code': 0, 'message': 'success', 'data': items}

    def get_category_detail(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {'code': 1, 'message': '分类不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': self.category_model.to_dict(category, with_count=True)
        }
