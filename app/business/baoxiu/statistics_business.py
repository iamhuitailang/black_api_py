from typing import Dict, Any
from app.model.baoxiu import OrderModel, UserModel, DormitoryModel


class BaoxiuStatisticsBusiness:
    def __init__(self):
        self.order_model = OrderModel()
        self.user_model = UserModel()
        self.dormitory_model = DormitoryModel()

    def get_dashboard_stats(self, user_id: int = None, role: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics(
            student_id=user_id if role == UserModel.ROLE_STUDENT else None,
            repairman_id=user_id if role == UserModel.ROLE_REPAIRMAN else None
        )
        
        if role == UserModel.ROLE_REPAIRMAN:
            pending_all = self.order_model.query.count({'status': OrderModel.STATUS_PENDING})
            order_stats['pending_all'] = pending_all

        total_students = None
        total_repairmen = None
        total_dormitories = None
        
        if role == UserModel.ROLE_ADMIN:
            total_students = self.user_model.query.count({'role': UserModel.ROLE_STUDENT})
            total_repairmen = self.user_model.query.count({'role': UserModel.ROLE_REPAIRMAN})
            total_dormitories = self.dormitory_model.query.count()

        recent_where = {}
        if role == UserModel.ROLE_STUDENT:
            recent_where['student_id'] = user_id
            recent_orders = self.order_model.query.find_all(
                conditions=recent_where,
                order_by='id DESC',
                limit=10
            )
        elif role == UserModel.ROLE_REPAIRMAN:
            pending_orders = self.order_model.query.find_all(
                conditions={'status': OrderModel.STATUS_PENDING},
                order_by='id DESC',
                limit=5
            )
            my_orders = self.order_model.query.find_all(
                conditions={'repairman_id': user_id},
                order_by='id DESC',
                limit=5
            )
            all_recent = list(pending_orders) + list(my_orders)
            seen_ids = set()
            unique_recent = []
            for order in all_recent:
                oid = order.get('id')
                if oid not in seen_ids:
                    seen_ids.add(oid)
                    unique_recent.append(order)
            unique_recent.sort(key=lambda x: x.get('id', 0), reverse=True)
            recent_orders = unique_recent[:10]
        else:
            recent_orders = self.order_model.query.find_all(
                conditions=recent_where if recent_where else None,
                order_by='id DESC',
                limit=10
            )
        formatted_recent = []
        for order in recent_orders:
            order_dict = dict(order)
            order_dict['status_text'] = self.order_model.get_status_text(order.get('status', 0))
            order_dict['urgency_text'] = self.order_model.get_urgency_text(order.get('urgency', 1))

            student = self.user_model.get_by_id(order.get('student_id', 0))
            if student:
                order_dict['student_name'] = student.get('real_name', '')

            repairman_id = order.get('repairman_id', 0)
            if repairman_id and repairman_id > 0:
                repairman = self.user_model.get_by_id(repairman_id)
                if repairman:
                    order_dict['repairman_name'] = repairman.get('real_name', '')

            formatted_recent.append(order_dict)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'order_stats': order_stats,
                'total_students': total_students,
                'total_repairmen': total_repairmen,
                'total_dormitories': total_dormitories,
                'recent_orders': formatted_recent
            }
        }

    def get_order_statistics(self, start_date: str = None,
                             end_date: str = None) -> Dict[str, Any]:
        order_stats = self.order_model.get_statistics()

        where_clauses = ["1=1"]
        params = []

        if start_date:
            where_clauses.append("DATE(created_at) >= ?")
            params.append(start_date)
        if end_date:
            where_clauses.append("DATE(created_at) <= ?")
            params.append(end_date)

        status_stats = []
        for status in range(5):
            status_where = where_clauses + [f"status = {status}"]
            count_sql = f"SELECT COUNT(*) as total FROM {self.order_model.TABLE_NAME} WHERE {' AND '.join(status_where)}"
            result = self.order_model.db.fetch_one(count_sql, tuple(params) if params else None)
            status_stats.append({
                'status': status,
                'status_text': self.order_model.get_status_text(status),
                'count': result['total'] if result else 0
            })

        urgency_stats = []
        for urgency in range(4):
            urgency_where = where_clauses + [f"urgency = {urgency}"]
            count_sql = f"SELECT COUNT(*) as total FROM {self.order_model.TABLE_NAME} WHERE {' AND '.join(urgency_where)}"
            result = self.order_model.db.fetch_one(count_sql, tuple(params) if params else None)
            urgency_stats.append({
                'urgency': urgency,
                'urgency_text': self.order_model.get_urgency_text(urgency),
                'count': result['total'] if result else 0
            })

        daily_sql = f"""
            SELECT DATE(created_at) as date, COUNT(*) as count,
                   SUM(CASE WHEN status = 3 THEN 1 ELSE 0 END) as completed
            FROM {self.order_model.TABLE_NAME}
            WHERE {' AND '.join(where_clauses)}
            GROUP BY DATE(created_at)
            ORDER BY date DESC
            LIMIT 30
        """
        daily_stats = self.order_model.db.fetch_all(daily_sql, tuple(params) if params else None)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'order_stats': order_stats,
                'status_stats': status_stats,
                'urgency_stats': urgency_stats,
                'daily_stats': daily_stats
            }
        }
