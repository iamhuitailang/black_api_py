from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from app.model.ts import TsRecordModel, TsUserModel, TsUserAchievementModel


class TsRecordBusiness:
    def __init__(self):
        self.record_model = TsRecordModel()
        self.user_model = TsUserModel()
        self.user_achievement_model = TsUserAchievementModel()

    def create_record(self, user_id: int, count: int, duration: int, note: str = '',
                       record_date: str = None, record_time: str = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        if count < 0:
            return {
                'code': 1,
                'msg': '跳绳数量不能为负数',
                'data': None
            }

        if duration < 0:
            return {
                'code': 1,
                'msg': '跳绳时长不能为负数',
                'data': None
            }

        if count == 0 and duration == 0:
            return {
                'code': 1,
                'msg': '跳绳数量和时长不能同时为0',
                'data': None
            }

        weight = user.get('weight', 60.0)

        record_id = self.record_model.create(
            user_id=user_id,
            count=count,
            duration=duration,
            note=note,
            record_date=record_date,
            record_time=record_time,
            weight=weight
        )

        if record_id > 0:
            calories = self.record_model.calculate_calories(count, weight)
            self.user_model.update_stats(user_id, count, duration, calories)

            self._update_streak_days(user_id)

            newly_unlocked = self._check_achievements(user_id)

            record = self.record_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '记录成功',
                'data': {
                    'record': self.record_model.to_dict(record),
                    'new_achievements': newly_unlocked
                }
            }

        return {
            'code': 1,
            'msg': '记录失败',
            'data': None
        }

    def _update_streak_days(self, user_id: int):
        today = datetime.now().strftime('%Y-%m-%d')
        yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')

        today_records = self.record_model.get_daily_total(user_id, today)
        if today_records.get('record_count', 0) > 1:
            return

        user = self.user_model.get_by_id(user_id)
        if not user:
            return

        current_streak = user.get('streak_days', 0)

        yesterday_records = self.record_model.get_daily_total(user_id, yesterday)
        if yesterday_records.get('record_count', 0) > 0:
            new_streak = current_streak + 1
        else:
            new_streak = 1

        self.user_model.update_streak_days(user_id, new_streak)

    def _check_achievements(self, user_id: int) -> List[Dict[str, Any]]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return []

        best_records = self.record_model.get_best_records(user_id)

        user_stats = {
            'total_count': user.get('total_count', 0),
            'max_single_count': best_records.get('max_single_count', 0),
            'streak_days': user.get('streak_days', 0)
        }

        newly_unlocked = self.user_achievement_model.check_and_unlock(user_id, user_stats)
        return newly_unlocked

    def get_record_by_id(self, record_id: int, user_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if record.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限查看该记录',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.record_model.to_dict(record)
        }

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10,
                         start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        result = self.record_model.get_by_user(user_id, page, page_size, start_date, end_date)
        items = [self.record_model.to_dict(item) for item in result.get('items', [])]

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

    def get_daily_stats(self, user_id: int, date: str = None) -> Dict[str, Any]:
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')

        daily_total = self.record_model.get_daily_total(user_id, date)
        daily_records = self.record_model.get_by_user_and_date(user_id, date)

        user = self.user_model.get_by_id(user_id)
        if user:
            daily_goal = user.get('daily_goal', 1000)
            total_count = daily_total.get('total_count', 0)
            completion_rate = (total_count / daily_goal * 100) if daily_goal > 0 else 0
        else:
            completion_rate = 0

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'date': date,
                'stats': {
                    'total_count': daily_total.get('total_count', 0),
                    'total_duration': daily_total.get('total_duration', 0),
                    'total_calories': daily_total.get('total_calories', 0.0),
                    'record_count': daily_total.get('record_count', 0)
                },
                'completion_rate': round(completion_rate, 2),
                'records': [self.record_model.to_dict(r) for r in daily_records]
            }
        }

    def get_weekly_stats(self, user_id: int) -> Dict[str, Any]:
        today = datetime.now()
        start_date = (today - timedelta(days=today.weekday())).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')

        weekly_total = self.record_model.get_weekly_total(user_id, start_date, end_date)
        trend_data = self.record_model.get_trend_data(user_id, start_date, end_date)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'start_date': start_date,
                'end_date': end_date,
                'stats': {
                    'total_count': weekly_total.get('total_count', 0),
                    'total_duration': weekly_total.get('total_duration', 0),
                    'total_calories': weekly_total.get('total_calories', 0.0),
                    'record_count': weekly_total.get('record_count', 0)
                },
                'trend_data': trend_data
            }
        }

    def get_monthly_stats(self, user_id: int) -> Dict[str, Any]:
        today = datetime.now()
        year_month = today.strftime('%Y-%m')
        start_date = today.replace(day=1).strftime('%Y-%m-%d')
        end_date = today.strftime('%Y-%m-%d')

        monthly_total = self.record_model.get_monthly_total(user_id, year_month)
        trend_data = self.record_model.get_trend_data(user_id, start_date, end_date)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'year_month': year_month,
                'stats': {
                    'total_count': monthly_total.get('total_count', 0),
                    'total_duration': monthly_total.get('total_duration', 0),
                    'total_calories': monthly_total.get('total_calories', 0.0),
                    'record_count': monthly_total.get('record_count', 0)
                },
                'trend_data': trend_data
            }
        }

    def get_trend_data(self, user_id: int, start_date: str, end_date: str) -> Dict[str, Any]:
        trend_data = self.record_model.get_trend_data(user_id, start_date, end_date)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'start_date': start_date,
                'end_date': end_date,
                'trend_data': trend_data
            }
        }

    def get_best_records(self, user_id: int) -> Dict[str, Any]:
        best_records = self.record_model.get_best_records(user_id)

        return {
            'code': 0,
            'msg': 'success',
            'data': best_records
        }

    def update_record(self, record_id: int, user_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if record.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限修改该记录',
                'data': None
            }

        user = self.user_model.get_by_id(user_id)
        weight = user.get('weight', 60.0) if user else 60.0

        affected = self.record_model.update(record_id, data, weight)
        if affected >= 0:
            updated_record = self.record_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': self.record_model.to_dict(updated_record)
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_record(self, record_id: int, user_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {
                'code': 1,
                'msg': '记录不存在',
                'data': None
            }

        if record.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '无权限删除该记录',
                'data': None
            }

        affected = self.record_model.delete(record_id)
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

    def calculate_calories(self, count: int, weight: float = 60.0) -> Dict[str, Any]:
        calories = self.record_model.calculate_calories(count, weight)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'count': count,
                'weight': weight,
                'calories': calories
            }
        }
