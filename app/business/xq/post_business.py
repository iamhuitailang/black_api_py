from typing import Dict, Any, Optional
from app.model.xq import PostModel, UserModel, ClaimModel
from app.model.xq.post import PostModel


class XqPostBusiness:
    def __init__(self):
        self.post_model = PostModel()
        self.user_model = UserModel()
        self.claim_model = ClaimModel()

    def _validate_category(self, category: str) -> bool:
        valid_categories = [cat['code'] for cat in PostModel.CATEGORIES]
        return category in valid_categories

    def create_need(self, user_id: int, category: str, title: str,
                    content: str, expect_time: str = None) -> Dict[str, Any]:
        return self.create_post(user_id, PostModel.TYPE_NEED, category, title, content, expect_time)

    def create_help(self, user_id: int, category: str, title: str,
                    content: str, expect_time: str = None) -> Dict[str, Any]:
        return self.create_post(user_id, PostModel.TYPE_HELP, category, title, content, expect_time)

    def create_post(self, user_id: int, post_type: str, category: str,
                    title: str, content: str, expect_time: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {
                'code': 1,
                'msg': '账号已被封号，无法发布',
                'data': None
            }

        if user.get('status') == self.user_model.STATUS_MUTED:
            return {
                'code': 1,
                'msg': '账号已被禁言，无法发布',
                'data': None
            }

        if not self._validate_category(category):
            return {
                'code': 1,
                'msg': '分类参数不正确',
                'data': None
            }

        if not title or len(title.strip()) < 2:
            return {
                'code': 1,
                'msg': '标题至少2个字符',
                'data': None
            }

        if not content or len(content.strip()) < 5:
            return {
                'code': 1,
                'msg': '描述至少5个字符',
                'data': None
            }

        post_id = self.post_model.create(
            user_id=user_id,
            post_type=post_type,
            category=category,
            title=title.strip(),
            content=content.strip(),
            expect_time=expect_time
        )

        if post_id > 0:
            post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': self.post_model.to_dict(post)
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def get_post_detail(self, post_id: int, viewer_user_id: int = None) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('is_checked') == 0:
            return {
                'code': 1,
                'msg': '帖子正在审核中',
                'data': None
            }

        self.post_model.increment_view_count(post_id)

        post_data = self.post_model.to_dict(post)

        user = self.user_model.get_by_id(post.get('user_id'))
        if user:
            post_data['publisher'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'credit': user.get('credit')
            }

        claims_result = self.claim_model.get_by_post(post_id, page=1, page_size=100)
        post_data['claims'] = [self.claim_model.to_dict(c) for c in claims_result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': post_data
        }

    def get_post_list(self, page: int = 1, page_size: int = 10,
                      post_type: str = None, category: str = None, status: int = None,
                      keyword: str = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            post_type=post_type,
            category=category,
            status=status,
            is_checked=1,
            keyword=keyword,
            order_by=order_by
        )

        items = []
        for post in result.get('items', []):
            post_data = self.post_model.to_dict(post)
            user = self.user_model.get_by_id(post.get('user_id'))
            if user:
                post_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar'),
                    'credit': user.get('credit')
                }
            items.append(post_data)

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

    def get_my_posts(self, user_id: int, page: int = 1, page_size: int = 10,
                     post_type: str = None, status: int = None) -> Dict[str, Any]:
        result = self.post_model.get_by_user(
            user_id=user_id,
            page=page,
            page_size=page_size,
            post_type=post_type,
            status=status
        )

        items = [self.post_model.to_dict(post) for post in result.get('items', [])]

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

    def update_post(self, user_id: int, post_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能修改自己的帖子',
                'data': None
            }

        if post.get('status') != PostModel.STATUS_PENDING:
            return {
                'code': 1,
                'msg': '该状态下无法修改',
                'data': None
            }

        if 'category' in data and not self._validate_category(data['category']):
            return {
                'code': 1,
                'msg': '分类参数不正确',
                'data': None
            }

        affected = self.post_model.update(post_id, data)
        if affected >= 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.post_model.to_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def cancel_post(self, user_id: int, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        if post.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '只能取消自己的帖子',
                'data': None
            }

        if post.get('status') not in [PostModel.STATUS_PENDING, PostModel.STATUS_IN_PROGRESS]:
            return {
                'code': 1,
                'msg': '该状态下无法取消',
                'data': None
            }

        affected = self.post_model.update_status(post_id, PostModel.STATUS_CANCELLED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '取消成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def get_admin_post_list(self, page: int = 1, page_size: int = 10,
                            post_type: str = None, category: str = None, status: int = None,
                            is_checked: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            post_type=post_type,
            category=category,
            status=status,
            is_checked=is_checked,
            keyword=keyword,
            order_by='created_at DESC'
        )

        items = []
        for post in result.get('items', []):
            post_data = self.post_model.to_dict(post)
            user = self.user_model.get_by_id(post.get('user_id'))
            if user:
                post_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'phone': user.get('phone')
                }
            items.append(post_data)

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

    def check_post(self, post_id: int, is_checked: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '帖子不存在',
                'data': None
            }

        affected = self.post_model.update_check_status(post_id, is_checked)
        if affected > 0:
            return {
                'code': 0,
                'msg': '审核成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '审核失败',
            'data': None
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.post_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_categories(self) -> Dict[str, Any]:
        categories = []
        for cat in PostModel.CATEGORIES:
            categories.append({
                'code': cat['code'],
                'name': cat['name'],
                'description': cat['desc']
            })
        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }
