from typing import Dict, Any
from app.model.jiaoyi import CategoryModel, BookModel, FavoriteModel, ReviewModel


class JiaoyiCategoryBusiness:
    def __init__(self):
        self.category_model = CategoryModel()

    def get_category_list(self, status: int = None) -> Dict[str, Any]:
        items = self.category_model.get_all(status)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_category_detail(self, category_id: int) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': category
        }

    def create_category(self, name: str, icon: str = '', sort_order: int = 0) -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '分类名称不能为空',
                'data': None
            }

        existing = self.category_model.get_by_name(name)
        if existing:
            return {
                'code': 1,
                'msg': '分类名称已存在',
                'data': None
            }

        category_id = self.category_model.create(name, icon, sort_order)
        if category_id > 0:
            category = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': category
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def update_category(self, category_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        category = self.category_model.get_by_id(category_id)
        if not category:
            return {
                'code': 1,
                'msg': '分类不存在',
                'data': None
            }

        affected = self.category_model.update(category_id, data)
        if affected >= 0:
            updated = self.category_model.get_by_id(category_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_category(self, category_id: int) -> Dict[str, Any]:
        affected = self.category_model.delete(category_id)
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


class JiaoyiBookBusiness:
    def __init__(self):
        self.book_model = BookModel()

    def get_book_list(self, page: int = 1, page_size: int = 10, seller_id: int = None,
                      category_id: int = None, status: int = None, school: str = None,
                      keyword: str = None, min_price: float = None, max_price: float = None,
                      condition: str = None) -> Dict[str, Any]:
        result = self.book_model.get_all(page, page_size, seller_id, category_id, status,
                                         school, keyword, min_price, max_price, condition)
        
        for item in result.get('items', []):
            item['status_text'] = self.book_model.get_status_text(item.get('status', 0))
            item['condition_text'] = self.book_model.get_condition_text(item.get('condition', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_book_detail(self, book_id: int, user_id: int = None) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        self.book_model.update_view_count(book_id)
        book['view_count'] = book.get('view_count', 0) + 1
        book['status_text'] = self.book_model.get_status_text(book.get('status', 0))
        book['condition_text'] = self.book_model.get_condition_text(book.get('condition', ''))

        return {
            'code': 0,
            'msg': 'success',
            'data': book
        }

    def create_book(self, seller_id: int, category_id: int, title: str, author: str = '',
                    publisher: str = '', publish_date: str = '', isbn: str = '', edition: str = '',
                    price: float = 0, original_price: float = 0, condition: str = 'good',
                    description: str = '', images: str = '', school: str = '', major: str = '',
                    course: str = '') -> Dict[str, Any]:
        if not title:
            return {
                'code': 1,
                'msg': '教材标题不能为空',
                'data': None
            }

        if price <= 0:
            return {
                'code': 1,
                'msg': '价格必须大于0',
                'data': None
            }

        book_id = self.book_model.create(
            seller_id=seller_id,
            category_id=category_id,
            title=title,
            author=author,
            publisher=publisher,
            publish_date=publish_date,
            isbn=isbn,
            edition=edition,
            price=price,
            original_price=original_price,
            condition=condition,
            description=description,
            images=images,
            school=school,
            major=major,
            course=course,
            status=self.book_model.STATUS_ON_SALE
        )

        if book_id > 0:
            book = self.book_model.get_by_id(book_id)
            return {
                'code': 0,
                'msg': '发布成功',
                'data': book
            }

        return {
            'code': 1,
            'msg': '发布失败',
            'data': None
        }

    def update_book(self, book_id: int, seller_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        if book.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限编辑',
                'data': None
            }

        affected = self.book_model.update(book_id, data)
        if affected >= 0:
            updated = self.book_model.get_by_id(book_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def update_book_status(self, book_id: int, status: int, reject_reason: str = '') -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        data = {'status': status}
        if reject_reason:
            data['reject_reason'] = reject_reason

        affected = self.book_model.update(book_id, data)
        if affected > 0:
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def off_shelf_book(self, book_id: int, seller_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        if book.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.update_book_status(book_id, self.book_model.STATUS_OFF_SHELF)

    def on_shelf_book(self, book_id: int, seller_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        if book.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限操作',
                'data': None
            }

        return self.update_book_status(book_id, self.book_model.STATUS_ON_SALE)

    def delete_book(self, book_id: int, seller_id: int) -> Dict[str, Any]:
        book = self.book_model.get_by_id(book_id)
        if not book:
            return {
                'code': 1,
                'msg': '教材不存在',
                'data': None
            }

        if book.get('seller_id') != seller_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.book_model.delete(book_id)
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

    def get_my_books(self, seller_id: int, page: int = 1, page_size: int = 10, status: int = None) -> Dict[str, Any]:
        return self.get_book_list(page, page_size, seller_id=seller_id, status=status)


class JiaoyiFavoriteBusiness:
    def __init__(self):
        self.favorite_model = FavoriteModel()
        self.book_model = BookModel()

    def toggle_favorite(self, user_id: int, book_id: int) -> Dict[str, Any]:
        existing = self.favorite_model.get_by_user_and_book(user_id, book_id)
        if existing:
            self.favorite_model.delete_by_user_and_book(user_id, book_id)
            self.book_model.update_favorite_count(book_id, -1)
            return {
                'code': 0,
                'msg': '取消收藏成功',
                'data': {'is_favorite': False}
            }
        else:
            favorite_id = self.favorite_model.create(user_id, book_id)
            if favorite_id > 0:
                self.book_model.update_favorite_count(book_id, 1)
                return {
                    'code': 0,
                    'msg': '收藏成功',
                    'data': {'is_favorite': True}
                }

        return {
            'code': 1,
            'msg': '操作失败',
            'data': None
        }

    def get_favorite_list(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.favorite_model.get_by_user(user_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def check_favorite(self, user_id: int, book_id: int) -> Dict[str, Any]:
        existing = self.favorite_model.get_by_user_and_book(user_id, book_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {'is_favorite': existing is not None}
        }


class JiaoyiReviewBusiness:
    def __init__(self):
        self.review_model = ReviewModel()

    def create_review(self, user_id: int, book_id: int, order_id: int = 0,
                      rating: int = 5, content: str = '', images: str = '') -> Dict[str, Any]:
        if rating < 1 or rating > 5:
            return {
                'code': 1,
                'msg': '评分必须在1-5之间',
                'data': None
            }

        review_id = self.review_model.create(user_id, book_id, order_id, rating, content, images)
        if review_id > 0:
            review = self.review_model.get_by_id(review_id)
            return {
                'code': 0,
                'msg': '评价成功',
                'data': review
            }

        return {
            'code': 1,
            'msg': '评价失败',
            'data': None
        }

    def get_book_reviews(self, book_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_book(book_id, page, page_size, status=1)
        
        for item in result.get('items', []):
            item['status_text'] = self.review_model.get_status_text(item.get('status', 0))

        avg_rating = self.review_model.get_average_rating(book_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'list': result,
                'avg_rating': round(avg_rating, 1)
            }
        }

    def get_my_reviews(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.review_model.get_by_user(user_id, page, page_size)
        
        for item in result.get('items', []):
            item['status_text'] = self.review_model.get_status_text(item.get('status', 0))

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def update_review_status(self, review_id: int, status: int) -> Dict[str, Any]:
        affected = self.review_model.update(review_id, {'status': status})
        if affected > 0:
            return {
                'code': 0,
                'msg': '状态更新成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '状态更新失败',
            'data': None
        }

    def delete_review(self, review_id: int, user_id: int) -> Dict[str, Any]:
        review = self.review_model.get_by_id(review_id)
        if not review:
            return {
                'code': 1,
                'msg': '评价不存在',
                'data': None
            }

        if review.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除',
                'data': None
            }

        affected = self.review_model.delete(review_id)
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
