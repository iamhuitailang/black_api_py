from typing import Dict, Any
from datetime import datetime, date as date_type, timedelta
from app.model.jianshen import (
    JianshenUserModel, JianshenCheckinModel, JianshenDailyQuoteModel
)


class JianshenDashboardBusiness:
    def __init__(self):
        self.user_model = JianshenUserModel()
        self.checkin_model = JianshenCheckinModel()
        self.quote_model = JianshenDailyQuoteModel()

    def get_dashboard(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        today = date_type.today().isoformat()
        today_checkin = self.checkin_model.get_by_user_and_date(user_id, today)
        has_checked_in = today_checkin is not None
        total = user.get('total_checkins', 0)
        consecutive = user.get('consecutive_days', 0)
        week_start = (date_type.today() - timedelta(days=date_type.today().weekday())).isoformat()
        week_end = date_type.today().isoformat()
        week_records = self.checkin_model.get_by_user_date_range(user_id, week_start, week_end)
        week_completed = len(week_records)
        week_target = 7
        week_rate = int(week_completed / week_target * 100)
        month_start = date_type.today().replace(day=1).isoformat()
        month_records = self.checkin_model.get_by_user_date_range(user_id, month_start, today)
        month_completed = len(month_records)
        month_target = 30
        month_rate = int(month_completed / month_target * 100)
        recent = self.checkin_model.get_recent(user_id, 5)
        recent_list = []
        for r in recent:
            recent_list.append({
                'id': r.get('id'),
                'checkin_date': r.get('checkin_date'),
                'duration': r.get('duration', 0),
                'calories': r.get('calories', 0),
                'projects': r.get('projects', ''),
                'remark': r.get('remark', '')
            })
        quote = self.quote_model.ensure_today()
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'today_status': {
                    'has_checked_in': has_checked_in,
                    'consecutive_days': consecutive,
                    'total_days': total
                },
                'weekly_progress': {
                    'completed': week_completed,
                    'target': week_target,
                    'rate': week_rate
                },
                'monthly_progress': {
                    'completed': month_completed,
                    'target': month_target,
                    'rate': month_rate
                },
                'recent_activities': recent_list,
                'daily_quote': {
                    'content': quote.get('content', ''),
                    'author': quote.get('author', '')
                } if quote else None
            }
        }

    def get_admin_dashboard(self) -> Dict[str, Any]:
        total_users = self.user_model.query.count({})
        active_users = self.user_model.query.count({'status': 0})
        total_checkins = self.checkin_model.query.count({})
        today = date_type.today().isoformat()
        today_checkins = self.checkin_model.query.count({'checkin_date': today})
        month_start = date_type.today().replace(day=1).isoformat()
        month_checkins_sql = f"SELECT COUNT(*) as cnt FROM {self.checkin_model.TABLE_NAME} WHERE checkin_date >= ?"
        month_checkins = self.checkin_model.db.fetch_one(month_checkins_sql, (month_start,))
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'total_users': total_users,
                'active_users': active_users,
                'total_checkins': total_checkins,
                'today_checkins': today_checkins,
                'month_checkins': month_checkins.get('cnt', 0) if month_checkins else 0
            }
        }
