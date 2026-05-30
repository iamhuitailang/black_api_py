from typing import Dict, Any
from app.model.jieyong_model import BorrowModel, ItemModel, UserModel, MessageModel


class JieyongStatisticsBusiness:
    def __init__(self):
        self.borrow_model = BorrowModel()
        self.item_model = ItemModel()
        self.user_model = UserModel()
        self.message_model = MessageModel()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        borrow_stats = self.borrow_model.get_statistics()

        total_items = self.item_model.query.count()
        total_users = self.user_model.query.count()
        
        total_borrows = self.borrow_model.query.count()
        borrowing_count = self.borrow_model.query.count({'status': self.borrow_model.STATUS_BORROWED})
        returned_count = self.borrow_model.query.count({'status': self.borrow_model.STATUS_RETURNED})
        overdue_count = self.borrow_model.query.count({'status': self.borrow_model.STATUS_OVERDUE})

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_items': total_items,
                'total_users': total_users,
                'total_borrows': total_borrows,
                'borrowing_count': borrowing_count,
                'returned_count': returned_count,
                'overdue_count': overdue_count
            }
        }

    def get_borrow_trend(self, days: int = 30) -> Dict[str, Any]:
        from datetime import datetime, timedelta
        
        result = []

        for i in range(days - 1, -1, -1):
            date = datetime.now() - timedelta(days=i)
            date_str = date.strftime('%Y-%m-%d')

            borrow_sql = f"SELECT COUNT(*) as count FROM {self.borrow_model.TABLE_NAME} WHERE DATE(created_at) = ?"
            borrow_result = self.borrow_model.db.fetch_one(borrow_sql, (date_str,))
            count = borrow_result.get('count', 0) if borrow_result else 0

            result.append({
                'date': date_str,
                'count': count
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_category_distribution(self) -> Dict[str, Any]:
        from app.model.jieyong_model import CategoryModel
        category_model = CategoryModel()

        sql = f"""
            SELECT c.id, c.name, 
                   COUNT(i.id) as count
            FROM {category_model.TABLE_NAME} c
            LEFT JOIN {self.item_model.TABLE_NAME} i ON c.id = i.category_id
            GROUP BY c.id, c.name
            ORDER BY c.sort_order ASC
        """
        result = self.item_model.db.fetch_all(sql)

        categories = []
        for row in result:
            categories.append({
                'name': row.get('name'),
                'count': row.get('count', 0) or 0
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': categories
        }

    def get_hot_items(self, limit: int = 10) -> Dict[str, Any]:
        items = self.item_model.get_hot_items(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def get_active_users(self, limit: int = 10) -> Dict[str, Any]:
        sql = f"""
            SELECT user_id, COUNT(*) as borrow_count 
            FROM {self.borrow_model.TABLE_NAME} 
            GROUP BY user_id 
            ORDER BY borrow_count DESC 
            LIMIT ?
        """
        top_users = self.borrow_model.db.fetch_all(sql, (limit,))

        active_users = []
        for row in top_users:
            user = self.user_model.get_by_id(row.get('user_id'))
            if user:
                active_users.append({
                    'user_id': row.get('user_id'),
                    'user_nickname': user.get('nickname'),
                    'user_phone': user.get('phone'),
                    'borrow_count': row.get('borrow_count')
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': active_users
        }

    def get_overdue_stats(self) -> Dict[str, Any]:
        total_overdue = self.borrow_model.query.count({'status': self.borrow_model.STATUS_OVERDUE})

        sql = f"""
            SELECT user_id, COUNT(*) as overdue_count 
            FROM {self.borrow_model.TABLE_NAME} 
            WHERE status = ?
            GROUP BY user_id 
            ORDER BY overdue_count DESC 
            LIMIT 10
        """
        top_overdue = self.borrow_model.db.fetch_all(sql, (self.borrow_model.STATUS_OVERDUE,))

        overdue_users = []
        for row in top_overdue:
            user = self.user_model.get_by_id(row.get('user_id'))
            if user:
                overdue_users.append({
                    'user_id': row.get('user_id'),
                    'user_nickname': user.get('nickname'),
                    'user_phone': user.get('phone'),
                    'overdue_count': row.get('overdue_count')
                })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_overdue': total_overdue,
                'overdue_users': overdue_users
            }
        }

    def export_records(self, status: int = None, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.borrow_model.get_all(
            page=1,
            page_size=10000,
            status=status,
            start_date=start_date,
            end_date=end_date
        )

        items = [self.borrow_model.to_dict(item) for item in result.get('items', [])]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }
