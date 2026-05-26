from typing import Dict, Any
from app.model.movie import UserModel, MovieModel, ShowtimeModel, OrderModel, ReviewModel
from datetime import datetime, timedelta


class MovieAdminBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.movie_model = MovieModel()
        self.showtime_model = ShowtimeModel()
        self.order_model = OrderModel()
        self.review_model = ReviewModel()

    def get_statistics(self) -> Dict[str, Any]:
        total_users = self.user_model.count_users()
        total_movies = self.movie_model.count_movies()
        showing_movies = self.movie_model.count_movies(MovieModel.STATUS_SHOWING)
        coming_movies = self.movie_model.count_movies(MovieModel.STATUS_COMING)
        total_showtimes = self.showtime_model.count_showtimes()
        total_orders = self.order_model.count_orders()
        paid_orders = self.order_model.count_orders(OrderModel.STATUS_PAID)
        verified_orders = self.order_model.count_orders(OrderModel.STATUS_VERIFIED)
        total_reviews = self.review_model.count_reviews()

        today = datetime.now().strftime('%Y-%m-%d')
        today_revenue = self.order_model.get_revenue(
            start_date=today + 'T00:00:00',
            end_date=today + 'T23:59:59'
        )
        total_revenue = self.order_model.get_revenue()

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_users': total_users,
                'total_movies': total_movies,
                'showing_movies': showing_movies,
                'coming_movies': coming_movies,
                'total_showtimes': total_showtimes,
                'total_orders': total_orders,
                'paid_orders': paid_orders,
                'verified_orders': verified_orders,
                'total_reviews': total_reviews,
                'today_revenue': round(today_revenue, 2),
                'total_revenue': round(total_revenue, 2)
            }
        }

    def get_user_list(self, page: int = 1, page_size: int = 10,
                      role: str = None, status: int = None,
                      keyword: str = None) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size, role, status, keyword)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]

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

    def ban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        if user.get('role') == UserModel.ROLE_ADMIN:
            return {'code': 1, 'msg': '不能封禁管理员', 'data': None}

        affected = self.user_model.update_status(user_id, UserModel.STATUS_BANNED)
        if affected > 0:
            return {'code': 0, 'msg': '封禁成功', 'data': None}

        return {'code': 1, 'msg': '封禁失败', 'data': None}

    def unban_user(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}

        affected = self.user_model.update_status(user_id, UserModel.STATUS_ACTIVE)
        if affected > 0:
            return {'code': 0, 'msg': '解封成功', 'data': None}

        return {'code': 1, 'msg': '解封失败', 'data': None}