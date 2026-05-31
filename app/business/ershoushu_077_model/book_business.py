from typing import Dict, Any
from app.model.ershoushu_077_model import ErshoushuBookModel, ErshoushuUserModel


class ErshoushuBookBusiness:
    def __init__(self):
        self.book_model = ErshoushuBookModel()
        self.user_model = ErshoushuUserModel()

    def _validate_category(self, category: str) -> bool:
        valid_categories = [cat['code'] for cat in ErshoushuBookModel.CATEGORIES]
        return category in valid_categories

    def _validate_condition(self, condition_level: str) -> bool:
        valid_conditions = [cond['code'] for cond in ErshoushuBookModel.CONDITIONS]
        return condition_level in valid_conditions

    def create_book(self, user_id: int, title: str, author: str, isbn: str,
                    publisher: str, category: str, original_price: float, price: float,
                    condition_level: str, description: str, cover_image: str = '') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if user.get('status') == self.user_model.STATUS_BANNED:
            return {'code': 1, 'msg': '账号已被封号，无法发布', 'data': None}

        if user.get('status') == self.user_model.STATUS_MUTED:
            return {'code': 1, 'msg': '账号已被禁言，无法发布', 'data': None}

        if not self._validate_category(category):
            return {'code': 1, 'msg': '分类参数不正确', 'data': None}

        if not self._validate_condition(condition_level):
            return {'code': 1, 'msg': '成色参数不正确', 'data': None}

        if not title or len(title.strip()) < 1:
            return {'code': 1, 'msg': '书名不能为空', 'data': None}

        if price <= 0:
            return {'code': 1, 'msg': '价格必须大于0', 'data': None}

        book_id = self.book_model.create(
            user_id=user_id,
            title=title.strip(),
            author=author,
            isbn=isbn,
            publisher=publisher,
            category=category,
            original_price=original_price,
            price=price,
            condition_level=condition_level,
            description=description,
            cover_image=cover_image
        )

        if book_id > 0:
            book = self.book_model.get_by_id(book_id)
            return {'code': 0, 'msg': '发布成功', 'data': self.book_model.to_dict(book)}

        return {'code': 1, 'msg': '发布失败', 'data': None}

    def get_book_detail(self, book_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {'code': 1, 'msg': '书籍不存在', 'data': None}

        self.book_model.increment_view_count(book_id)

        book_data = self.book_model.to_dict(book)

        user = self.user_model.get_by_id(book.get('user_id'))
        if user:
            book_data['publisher_info'] = {
                'id': user.get('id'),
                'nickname': user.get('nickname'),
                'avatar': user.get('avatar'),
                'username': user.get('username')
            }

        return {'code': 0, 'msg': 'success', 'data': book_data}

    def get_book_list(self, page: int = 1, page_size: int = 10,
                      category: str = None, keyword: str = None,
                      condition_level: str = None, min_price: float = None,
                      max_price: float = None, order_by: str = 'created_at DESC') -> Dict[str, Any]:
        result = self.book_model.get_list(
            page=page, page_size=page_size,
            category=category, status=ErshoushuBookModel.STATUS_APPROVED,
            is_checked=1, keyword=keyword, condition_level=condition_level,
            min_price=min_price, max_price=max_price, order_by=order_by
        )

        items = []
        for book in result.get('items', []):
            book_data = self.book_model.to_dict(book)
            user = self.user_model.get_by_id(book.get('user_id'))
            if user:
                book_data['publisher_info'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'avatar': user.get('avatar')
                }
            items.append(book_data)

        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_my_books(self, user_id: int, page: int = 1, page_size: int = 10,
                     status: int = None) -> Dict[str, Any]:
        result = self.book_model.get_by_user(user_id, page, page_size, status)
        items = [self.book_model.to_dict(book) for book in result.get('items', [])]
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def update_book(self, user_id: int, book_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {'code': 1, 'msg': '书籍不存在', 'data': None}

        if book.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能修改自己的书籍', 'data': None}

        if book.get('status') == ErshoushuBookModel.STATUS_SOLD:
            return {'code': 1, 'msg': '已售出的书籍无法修改', 'data': None}

        if 'category' in data and not self._validate_category(data['category']):
            return {'code': 1, 'msg': '分类参数不正确', 'data': None}

        if 'condition_level' in data and not self._validate_condition(data['condition_level']):
            return {'code': 1, 'msg': '成色参数不正确', 'data': None}

        affected = self.book_model.update(book_id, data)
        if affected >= 0:
            updated_book = self.book_model.get_by_id(book_id)
            return {'code': 0, 'msg': '更新成功', 'data': self.book_model.to_dict(updated_book)}
        return {'code': 1, 'msg': '更新失败', 'data': None}

    def delete_book(self, user_id: int, book_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {'code': 1, 'msg': '书籍不存在', 'data': None}

        if book.get('user_id') != user_id:
            return {'code': 1, 'msg': '只能删除自己的书籍', 'data': None}

        if book.get('status') == ErshoushuBookModel.STATUS_SOLD:
            return {'code': 1, 'msg': '已售出的书籍无法删除', 'data': None}

        affected = self.book_model.delete(book_id)
        if affected > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_admin_book_list(self, page: int = 1, page_size: int = 10,
                            category: str = None, status: int = None,
                            is_checked: int = None, keyword: str = None) -> Dict[str, Any]:
        result = self.book_model.get_list(
            page=page, page_size=page_size,
            category=category, status=status,
            is_checked=is_checked, keyword=keyword
        )

        items = []
        for book in result.get('items', []):
            book_data = self.book_model.to_dict(book)
            user = self.user_model.get_by_id(book.get('user_id'))
            if user:
                book_data['publisher'] = {
                    'id': user.get('id'),
                    'nickname': user.get('nickname'),
                    'username': user.get('username')
                }
            items.append(book_data)

        return {
            'code': 0, 'msg': 'success',
            'data': {
                'items': items,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def check_book(self, book_id: int, is_checked: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {'code': 1, 'msg': '书籍不存在', 'data': None}

        affected = self.book_model.update_check_status(book_id, is_checked)
        if affected > 0:
            return {'code': 0, 'msg': '审核成功', 'data': None}
        return {'code': 1, 'msg': '审核失败', 'data': None}

    def get_categories(self) -> Dict[str, Any]:
        categories = [{'code': cat['code'], 'name': cat['name']} for cat in ErshoushuBookModel.CATEGORIES]
        return {'code': 0, 'msg': 'success', 'data': categories}

    def get_conditions(self) -> Dict[str, Any]:
        conditions = [{'code': cond['code'], 'name': cond['name']} for cond in ErshoushuBookModel.CONDITIONS]
        return {'code': 0, 'msg': 'success', 'data': conditions}

    def get_statistics(self) -> Dict[str, Any]:
        stats = self.book_model.get_statistics()
        return {'code': 0, 'msg': 'success', 'data': stats}
