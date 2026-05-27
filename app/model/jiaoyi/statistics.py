from datetime import datetime, timedelta
from typing import Dict, Any
from app.common.sqlite.db import get_db


class StatisticsModel:
    def __init__(self):
        self.db = get_db()

    def get_overall_statistics(self) -> Dict[str, Any]:
        user_count_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_users WHERE status = 0"
        user_count = self.db.fetch_one(user_count_sql)

        book_count_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_books WHERE status = 1"
        book_count = self.db.fetch_one(book_count_sql)

        order_count_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_orders"
        order_count = self.db.fetch_one(order_count_sql)

        total_amount_sql = "SELECT IFNULL(SUM(total_price), 0) as amount FROM tb_jiaoyi_model_orders WHERE status >= 3"
        total_amount = self.db.fetch_one(total_amount_sql)

        return {
            'user_count': user_count.get('count', 0) if user_count else 0,
            'book_count': book_count.get('count', 0) if book_count else 0,
            'order_count': order_count.get('count', 0) if order_count else 0,
            'total_amount': total_amount.get('amount', 0) if total_amount else 0
        }

    def get_user_statistics(self, user_id: int, role: str = 'buyer') -> Dict[str, Any]:
        if role in ['seller', 'both']:
            my_books_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_books WHERE seller_id = ?"
            my_books = self.db.fetch_one(my_books_sql, (user_id,))

            sold_books_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_books WHERE seller_id = ? AND status = 3"
            sold_books = self.db.fetch_one(sold_books_sql, (user_id,))

            seller_orders_sql = "SELECT COUNT(*) as count, IFNULL(SUM(total_price), 0) as amount FROM tb_jiaoyi_model_orders WHERE seller_id = ?"
            seller_orders = self.db.fetch_one(seller_orders_sql, (user_id,))

            return {
                'my_books': my_books.get('count', 0) if my_books else 0,
                'sold_books': sold_books.get('count', 0) if sold_books else 0,
                'order_count': seller_orders.get('count', 0) if seller_orders else 0,
                'total_sales': seller_orders.get('amount', 0) if seller_orders else 0
            }
        else:
            buyer_orders_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_orders WHERE buyer_id = ?"
            buyer_orders = self.db.fetch_one(buyer_orders_sql, (user_id,))

            favorites_sql = "SELECT COUNT(*) as count FROM tb_jiaoyi_model_favorites WHERE user_id = ?"
            favorites = self.db.fetch_one(favorites_sql, (user_id,))

            return {
                'order_count': buyer_orders.get('count', 0) if buyer_orders else 0,
                'favorite_count': favorites.get('count', 0) if favorites else 0
            }

    def get_daily_trend(self, days: int = 7) -> Dict[str, Any]:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days - 1)

        dates = []
        order_counts = []
        user_counts = []

        for i in range(days):
            current_date = start_date + timedelta(days=i)
            date_str = current_date.strftime('%Y-%m-%d')
            dates.append(date_str)

            order_sql = """
                SELECT COUNT(*) as count FROM tb_jiaoyi_model_orders 
                WHERE DATE(created_at) = ?
            """
            order_result = self.db.fetch_one(order_sql, (date_str,))
            order_counts.append(order_result.get('count', 0) if order_result else 0)

            user_sql = """
                SELECT COUNT(*) as count FROM tb_jiaoyi_model_users 
                WHERE DATE(created_at) = ?
            """
            user_result = self.db.fetch_one(user_sql, (date_str,))
            user_counts.append(user_result.get('count', 0) if user_result else 0)

        return {
            'dates': dates,
            'order_counts': order_counts,
            'user_counts': user_counts
        }

    def get_category_statistics(self) -> Dict[str, Any]:
        sql = """
            SELECT c.id, c.name, COUNT(b.id) as book_count
            FROM tb_jiaoyi_model_categories c
            LEFT JOIN tb_jiaoyi_model_books b ON c.id = b.category_id AND b.status = 1
            WHERE c.status = 0
            GROUP BY c.id, c.name
            ORDER BY book_count DESC
        """
        categories = self.db.fetch_all(sql)
        return {
            'categories': categories
        }
