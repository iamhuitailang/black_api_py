from typing import Dict, Any, List
from app.model.blog import BlogTagModel


class BlogTagBusiness:
    def __init__(self):
        self.tag_model = BlogTagModel()

    def create_tag(self, name: str, slug: str = None, color: str = None) -> Dict[str, Any]:
        if not name or len(name.strip()) < 1:
            return {'code': 1, 'message': '标签名称不能为空', 'data': None}

        slug = slug or name.strip().lower().replace(' ', '-')
        if self.tag_model.exists_by_slug(slug):
            existing = self.tag_model.get_by_slug(slug)
            return {'code': 0, 'message': '标签已存在', 'data': self.tag_model.to_dict(existing, with_count=True)}

        tag_id = self.tag_model.create(name, slug, color)
        if tag_id > 0:
            tag = self.tag_model.get_by_id(tag_id)
            return {
                'code': 0,
                'message': '创建成功',
                'data': self.tag_model.to_dict(tag, with_count=True)
            }
        return {'code': 1, 'message': '创建失败', 'data': None}

    def update_tag(self, tag_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        tag = self.tag_model.get_by_id(tag_id)
        if not tag:
            return {'code': 1, 'message': '标签不存在', 'data': None}
        if 'slug' in data and self.tag_model.exists_by_slug(data['slug'], exclude_id=tag_id):
            return {'code': 1, 'message': '标签标识已存在', 'data': None}

        affected = self.tag_model.update(tag_id, data)
        if affected >= 0:
            updated = self.tag_model.get_by_id(tag_id)
            return {
                'code': 0,
                'message': '更新成功',
                'data': self.tag_model.to_dict(updated, with_count=True)
            }
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_tag(self, tag_id: int) -> Dict[str, Any]:
        tag = self.tag_model.get_by_id(tag_id)
        if not tag:
            return {'code': 1, 'message': '标签不存在', 'data': None}

        post_count = self.tag_model.count_posts(tag_id)
        if post_count > 0:
            return {'code': 1, 'message': f'该标签下还有 {post_count} 篇文章，无法删除', 'data': None}

        affected = self.tag_model.delete(tag_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_tag_list(self, page: int = 1, page_size: int = 10, keyword: str = None) -> Dict[str, Any]:
        result = self.tag_model.get_list(page, page_size, keyword)
        items = [self.tag_model.to_dict(t, with_count=True) for t in result.get('items', [])]
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

    def get_all_tags(self) -> Dict[str, Any]:
        tags = self.tag_model.get_all()
        items = [self.tag_model.to_dict(t, with_count=True) for t in tags]
        return {'code': 0, 'message': 'success', 'data': items}

    def get_tag_detail(self, tag_id: int) -> Dict[str, Any]:
        tag = self.tag_model.get_by_id(tag_id)
        if not tag:
            return {'code': 1, 'message': '标签不存在', 'data': None}
        return {
            'code': 0,
            'message': 'success',
            'data': self.tag_model.to_dict(tag, with_count=True)
        }

    def get_or_create_tags(self, names: List[str]) -> Dict[str, Any]:
        tag_ids = []
        for name in names:
            if name and name.strip():
                tag_id = self.tag_model.get_or_create(name.strip())
                tag_ids.append(tag_id)
        return {'code': 0, 'message': 'success', 'data': tag_ids}
