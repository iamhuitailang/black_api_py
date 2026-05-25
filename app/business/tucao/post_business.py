from typing import Dict, Any, Optional, List
from app.model.tucao import PostModel, ReplyModel, LikeModel, CategoryModel


class TucaoPostBusiness:
    def __init__(self):
        self.post_model = PostModel()
        self.reply_model = ReplyModel()
        self.like_model = LikeModel()
        self.category_model = CategoryModel()

    def _validate_category(self, category: str) -> bool:
        if not category:
            return True
        categories = self.category_model.get_all(only_active=True)
        valid_codes = [cat['code'] for cat in categories]
        return category in valid_codes

    def _get_client_ip(self, request) -> str:
        if hasattr(request, 'client') and request.client:
            return request.client.host or ''
        return ''

    def _mask_anonymous_id(self, anonymous_id: str) -> str:
        if len(anonymous_id) <= 4:
            return anonymous_id[0] + '***'
        return anonymous_id[:2] + '***' + anonymous_id[-2:]

    def create_post(self, content: str, category: str = '', user_id: int = 0,
                    ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        if not content or len(content.strip()) < 1:
            return {
                'code': 1,
                'msg': '内容不能为空',
                'data': None
            }

        if len(content.strip()) > 500:
            return {
                'code': 1,
                'msg': '内容不能超过500字',
                'data': None
            }

        if category and not self._validate_category(category):
            return {
                'code': 1,
                'msg': '分类参数不正确',
                'data': None
            }

        result = self.post_model.create(
            content=content.strip(),
            category=category,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )

        if result.get('id') and result['id'] > 0:
            post = self.post_model.get_by_id(result['id'])
            return {
                'code': 0,
                'msg': '发布成功',
                'data': {
                    'post': self.post_model.to_public_dict(post),
                    'delete_code': result.get('delete_code', '')
                }
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def get_post_detail(self, post_id: int, user_id: int = 0,
                        ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('status') != self.post_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '吐槽不存在或已删除',
                'data': None
            }

        self.post_model.increment_view_count(post_id)

        post_data = self.post_model.to_public_dict(post)

        replies_result = self.reply_model.get_by_post(post_id, page=1, page_size=100)
        replies = []
        for reply in replies_result.get('items', []):
            reply_data = self.reply_model.to_public_dict(reply)
            children = self.reply_model.get_by_parent(reply.get('id'))
            reply_data['children'] = [self.reply_model.to_public_dict(c) for c in children]
            replies.append(reply_data)

        post_data['replies'] = replies

        is_liked = self.like_model.check_liked(
            target_id=post_id,
            target_type=self.like_model.TYPE_POST,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )
        post_data['is_liked'] = is_liked

        return {
            'code': 0,
            'msg': 'success',
            'data': post_data
        }

    def get_post_list(self, page: int = 1, page_size: int = 10,
                      category: str = None, keyword: str = None,
                      order_by: str = 'created_at DESC',
                      user_id: int = 0, ip_address: str = '',
                      device_id: str = '') -> Dict[str, Any]:
        if order_by == 'hot':
            result = self.post_model.get_hot_list(page, page_size, category)
        else:
            result = self.post_model.get_list(
                page=page,
                page_size=page_size,
                category=category,
                keyword=keyword,
                order_by=order_by
            )

        items = []
        for post in result.get('items', []):
            post_data = self.post_model.to_public_dict(post)
            is_liked = self.like_model.check_liked(
                target_id=post.get('id'),
                target_type=self.like_model.TYPE_POST,
                user_id=user_id,
                ip_address=ip_address,
                device_id=device_id
            )
            post_data['is_liked'] = is_liked
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

    def like_post(self, post_id: int, user_id: int = 0,
                  ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('status') != self.post_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '吐槽不存在或已删除',
                'data': None
            }

        existing = self.like_model.get_like_record(
            target_id=post_id,
            target_type=self.like_model.TYPE_POST,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )

        if existing:
            self.like_model.delete(existing.get('id'))
            self.post_model.increment_like_count(post_id, -1)
            return {
                'code': 0,
                'msg': '取消点赞成功',
                'data': {'liked': False}
            }
        else:
            self.like_model.create(
                target_id=post_id,
                target_type=self.like_model.TYPE_POST,
                user_id=user_id,
                ip_address=ip_address,
                device_id=device_id
            )
            self.post_model.increment_like_count(post_id, 1)
            return {
                'code': 0,
                'msg': '点赞成功',
                'data': {'liked': True}
            }

    def reply_post(self, post_id: int, content: str, parent_id: int = 0,
                   reply_to_id: int = 0, user_id: int = 0,
                   ip_address: str = '', device_id: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('status') != self.post_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '吐槽不存在或已删除',
                'data': None
            }

        if not content or len(content.strip()) < 1:
            return {
                'code': 1,
                'msg': '回复内容不能为空',
                'data': None
            }

        if len(content.strip()) > 100:
            return {
                'code': 1,
                'msg': '回复内容不能超过100字',
                'data': None
            }

        if parent_id > 0:
            parent = self.reply_model.get_by_id(parent_id)
            if not parent:
                return {
                    'code': 1,
                    'msg': '父回复不存在',
                    'data': None
                }
            if parent.get('level') >= self.reply_model.MAX_LEVEL:
                return {
                    'code': 1,
                    'msg': '最多支持3级回复',
                    'data': None
                }

        result = self.reply_model.create(
            post_id=post_id,
            content=content.strip(),
            parent_id=parent_id,
            reply_to_id=reply_to_id,
            user_id=user_id,
            ip_address=ip_address,
            device_id=device_id
        )

        if result.get('id') and result['id'] > 0:
            self.post_model.increment_reply_count(post_id, 1)
            reply = self.reply_model.get_by_id(result['id'])
            return {
                'code': 0,
                'msg': '回复成功',
                'data': self.reply_model.to_public_dict(reply)
            }

        return {
            'code': 1,
            'msg': '回复失败',
            'data': None
        }

    def report_post(self, post_id: int, report_type: str, description: str = '',
                    user_id: int = 0, ip_address: str = '') -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        from app.model.tucao.report import ReportModel
        report_model = ReportModel()
        report_id = report_model.create(
            target_id=post_id,
            target_type=ReportModel.TYPE_POST,
            report_type=report_type,
            description=description,
            user_id=user_id,
            ip_address=ip_address
        )

        if report_id > 0:
            return {
                'code': 0,
                'msg': '举报成功，我们会尽快处理',
                'data': None
            }

        return {
            'code': 1,
            'msg': '举报失败',
            'data': None
        }

    def edit_post(self, post_id: int, delete_code: str, content: str,
                  category: str = None) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('delete_code') != delete_code:
            return {
                'code': 1,
                'msg': '删除码不正确',
                'data': None
            }

        if post.get('status') != self.post_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '吐槽不存在或已删除',
                'data': None
            }

        if not content or len(content.strip()) < 1:
            return {
                'code': 1,
                'msg': '内容不能为空',
                'data': None
            }

        if len(content.strip()) > 500:
            return {
                'code': 1,
                'msg': '内容不能超过500字',
                'data': None
            }

        if category and not self._validate_category(category):
            return {
                'code': 1,
                'msg': '分类参数不正确',
                'data': None
            }

        affected = self.post_model.update_content(post_id, content.strip(), category)
        if affected > 0:
            updated_post = self.post_model.get_by_id(post_id)
            return {
                'code': 0,
                'msg': '编辑成功',
                'data': self.post_model.to_public_dict(updated_post)
            }

        return {
            'code': 1,
            'msg': '编辑失败',
            'data': None
        }

    def delete_post(self, post_id: int, delete_code: str) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('delete_code') != delete_code:
            return {
                'code': 1,
                'msg': '删除码不正确',
                'data': None
            }

        affected = self.post_model.soft_delete(post_id)
        if affected > 0:
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

    def get_my_posts(self, delete_code: str, page: int = 1,
                     page_size: int = 10) -> Dict[str, Any]:
        if not delete_code:
            return {
                'code': 1,
                'msg': '删除码不能为空',
                'data': None
            }

        posts = self.post_model.get_by_delete_code_prefix(delete_code)
        filtered_posts = [p for p in posts if p.get('delete_code', '').startswith(delete_code[:4])]

        total = len(filtered_posts)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered_posts[start:end]

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': [self.post_model.to_dict(p) for p in items],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def get_share_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        if post.get('status') != self.post_model.STATUS_APPROVED:
            return {
                'code': 1,
                'msg': '吐槽不存在或已删除',
                'data': None
            }

        post_data = self.post_model.to_public_dict(post)
        post_data['anonymous_id'] = self._mask_anonymous_id(post_data.get('anonymous_id', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': post_data
        }

    def get_categories(self) -> Dict[str, Any]:
        categories = self.category_model.get_all(only_active=True)
        return {
            'code': 0,
            'msg': 'success',
            'data': [self.category_model.to_dict(c) for c in categories]
        }

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.post_model.get_statistics()
        return {
            'code': 0,
            'msg': 'success',
            'data': stats
        }

    def get_admin_post_list(self, page: int = 1, page_size: int = 10,
                            category: str = None, status: int = None,
                            keyword: str = None) -> Dict[str, Any]:
        result = self.post_model.get_list(
            page=page,
            page_size=page_size,
            category=category,
            status=status,
            keyword=keyword,
            order_by='created_at DESC'
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

    def admin_delete_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        affected = self.post_model.soft_delete(post_id)
        if affected > 0:
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

    def admin_restore_post(self, post_id: int) -> Dict[str, Any]:
        post = self.post_model.get_by_id(post_id)
        if not post:
            return {
                'code': 1,
                'msg': '吐槽不存在',
                'data': None
            }

        affected = self.post_model.update_status(post_id, self.post_model.STATUS_APPROVED)
        if affected > 0:
            return {
                'code': 0,
                'msg': '恢复成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '恢复失败',
            'data': None
        }
