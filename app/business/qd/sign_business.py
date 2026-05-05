from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from app.model.qd import (
    SignUserModel,
    SignRecordModel,
    SignStatsModel,
    SignConfigModel
)


class SignBusiness:
    def __init__(self):
        self.user_model = SignUserModel()
        self.record_model = SignRecordModel()
        self.stats_model = SignStatsModel()
        self.config_model = SignConfigModel()

    def get_sign_status(self, user_id: int) -> Dict[str, Any]:
        today = date.today().isoformat()
        
        stats = self.stats_model.get_sign_status(user_id, today)
        today_sign_count = self.record_model.get_today_sign_count(today)
        
        consecutive_rewards = self.config_model.get_all_consecutive_rewards()
        daily_points = self.config_model.get_daily_points()
        
        next_award_info = None
        if stats.get('next_award_day'):
            next_day = stats.get('next_award_day')
            next_award_info = {
                'day': next_day,
                'points': consecutive_rewards.get(next_day, 0),
                'days_to_award': stats.get('days_to_next_award', 0)
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user_id': user_id,
                'today': today,
                'is_signed_today': stats.get('is_signed_today', False),
                'current_continuous': stats.get('current_continuous', 0),
                'max_continuous': stats.get('max_continuous', 0),
                'total_days': stats.get('total_days', 0),
                'total_points': stats.get('total_points', 0),
                'today_sign_count': today_sign_count,
                'next_award': next_award_info,
                'daily_points': daily_points,
                'consecutive_rewards': consecutive_rewards,
                'can_sign': stats.get('can_sign', True)
            }
        }

    def sign(self, user_id: int) -> Dict[str, Any]:
        today = date.today().isoformat()
        
        existing_sign = self.record_model.get_by_user_and_date(user_id, today)
        if existing_sign:
            return {
                'code': 1,
                'msg': '今日已签到',
                'data': None
            }

        stats = self.stats_model.get_or_create(user_id)
        last_sign_date = stats.get('last_sign_date', '')
        
        continuous_days = 1
        if last_sign_date:
            try:
                last_dt = date.fromisoformat(last_sign_date)
                today_dt = date.fromisoformat(today)
                if (today_dt - last_dt).days == 1:
                    continuous_days = stats.get('current_continuous', 0) + 1
            except (ValueError, TypeError):
                pass

        daily_points = self.config_model.get_daily_points()
        consecutive_bonus = self.config_model.get_consecutive_reward(continuous_days)
        total_points = daily_points + consecutive_bonus

        self.record_model.create(
            user_id=user_id,
            sign_date=today,
            continuous_days=continuous_days,
            reward_points=total_points,
            sign_type=SignRecordModel.SIGN_TYPE_NORMAL
        )

        self.stats_model.update_sign_stats(
            user_id=user_id,
            sign_date=today,
            points=total_points,
            continuous_days=continuous_days
        )

        self.user_model.update_points(user_id, total_points)

        updated_stats = self.stats_model.get_sign_status(user_id, today)

        return {
            'code': 0,
            'msg': '签到成功',
            'data': {
                'sign_date': today,
                'continuous_days': continuous_days,
                'points_earned': total_points,
                'daily_points': daily_points,
                'consecutive_bonus': consecutive_bonus,
                'is_award_day': consecutive_bonus > 0,
                'current_continuous': updated_stats.get('current_continuous', 0),
                'total_days': updated_stats.get('total_days', 0),
                'total_points': updated_stats.get('total_points', 0)
            }
        }

    def supplement_sign(self, user_id: int, target_date: str) -> Dict[str, Any]:
        if not self.config_model.is_supplement_enabled():
            return {
                'code': 1,
                'msg': '补签功能未开启',
                'data': None
            }

        today = date.today().isoformat()
        try:
            target_dt = date.fromisoformat(target_date)
            today_dt = date.fromisoformat(today)
        except ValueError:
            return {
                'code': 1,
                'msg': '日期格式错误',
                'data': None
            }

        if target_dt >= today_dt:
            return {
                'code': 1,
                'msg': '只能补签过去的日期',
                'data': None
            }

        max_days = self.config_model.get_max_supplement_days()
        if (today_dt - target_dt).days > max_days:
            return {
                'code': 1,
                'msg': f'只能补签最近{max_days}天的日期',
                'data': None
            }

        existing_sign = self.record_model.get_by_user_and_date(user_id, target_date)
        if existing_sign:
            return {
                'code': 1,
                'msg': '该日期已签到',
                'data': None
            }

        supplement_cost = self.config_model.get_supplement_cost()
        user_points = self.user_model.get_points(user_id)
        if user_points < supplement_cost:
            return {
                'code': 1,
                'msg': f'积分不足，补签需要{supplement_cost}积分',
                'data': None
            }

        daily_points = self.config_model.get_daily_points()
        
        self.record_model.create(
            user_id=user_id,
            sign_date=target_date,
            continuous_days=1,
            reward_points=daily_points,
            sign_type=SignRecordModel.SIGN_TYPE_SUPPLEMENT
        )

        self.user_model.update_points(user_id, daily_points - supplement_cost)

        stats = self.stats_model.get_or_create(user_id)
        total_days = stats.get('total_days', 0) + 1
        total_points = stats.get('total_points_from_sign', 0) + daily_points
        
        now = datetime.now().isoformat()
        self.stats_model.exec.update(
            {
                'total_days': total_days,
                'total_points_from_sign': total_points,
                'updated_at': now
            },
            {'user_id': user_id}
        )

        return {
            'code': 0,
            'msg': '补签成功',
            'data': {
                'sign_date': target_date,
                'points_earned': daily_points,
                'points_cost': supplement_cost,
                'net_points': daily_points - supplement_cost,
                'sign_type': 'supplement'
            }
        }

    def get_month_calendar(self, user_id: int, year: int = None, month: int = None) -> Dict[str, Any]:
        today = date.today()
        if year is None:
            year = today.year
        if month is None:
            month = today.month

        first_day = date(year, month, 1)
        if month == 12:
            last_day = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            last_day = date(year, month + 1, 1) - timedelta(days=1)

        signs = self.record_model.get_user_signs_by_month(user_id, year, month)
        
        sign_map = {}
        for sign in signs:
            sign_map[sign.get('sign_date')] = {
                'sign_date': sign.get('sign_date'),
                'continuous_days': sign.get('continuous_days'),
                'reward_points': sign.get('reward_points'),
                'sign_type': sign.get('sign_type'),
                'is_signed': True,
                'is_supplement': sign.get('sign_type') == SignRecordModel.SIGN_TYPE_SUPPLEMENT
            }

        calendar_data = []
        current_day = first_day
        while current_day <= last_day:
            date_str = current_day.isoformat()
            day_info = {
                'date': date_str,
                'day': current_day.day,
                'weekday': current_day.weekday(),
                'is_today': current_day == today,
                'is_signed': False,
                'is_supplement': False,
                'sign_data': None
            }
            
            if date_str in sign_map:
                day_info['is_signed'] = True
                day_info['is_supplement'] = sign_map[date_str]['is_supplement']
                day_info['sign_data'] = sign_map[date_str]
            
            calendar_data.append(day_info)
            current_day += timedelta(days=1)

        consecutive_days_list = self._find_consecutive_dates(sign_map, year, month)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'year': year,
                'month': month,
                'today': today.isoformat(),
                'first_day': first_day.isoformat(),
                'last_day': last_day.isoformat(),
                'calendar': calendar_data,
                'consecutive_intervals': consecutive_days_list,
                'total_signed_days': len(signs)
            }
        }

    def _find_consecutive_dates(self, sign_map: Dict, year: int, month: int) -> List[Dict]:
        signed_dates = sorted(sign_map.keys())
        if not signed_dates:
            return []

        intervals = []
        current_interval = None

        for i, date_str in enumerate(signed_dates):
            try:
                dt = date.fromisoformat(date_str)
            except ValueError:
                continue

            if current_interval is None:
                current_interval = {
                    'start_date': date_str,
                    'end_date': date_str,
                    'days': 1,
                    'is_consecutive': True
                }
            else:
                try:
                    prev_dt = date.fromisoformat(current_interval['end_date'])
                    if (dt - prev_dt).days == 1:
                        current_interval['end_date'] = date_str
                        current_interval['days'] += 1
                    else:
                        if current_interval['days'] > 1:
                            intervals.append(current_interval)
                        current_interval = {
                            'start_date': date_str,
                            'end_date': date_str,
                            'days': 1,
                            'is_consecutive': False
                        }
                except ValueError:
                    if current_interval['days'] > 1:
                        intervals.append(current_interval)
                    current_interval = {
                        'start_date': date_str,
                        'end_date': date_str,
                        'days': 1,
                        'is_consecutive': False
                    }

        if current_interval and current_interval['days'] > 1:
            intervals.append(current_interval)

        return intervals

    def get_sign_history(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.record_model.get_user_sign_list(user_id, page, page_size)
        
        items = []
        for item in result.get('items', []):
            items.append({
                'id': item.get('id'),
                'sign_date': item.get('sign_date'),
                'continuous_days': item.get('continuous_days'),
                'reward_points': item.get('reward_points'),
                'sign_type': item.get('sign_type'),
                'sign_type_text': '正常签到' if item.get('sign_type') == SignRecordModel.SIGN_TYPE_NORMAL else '补签',
                'created_at': item.get('created_at')
            })

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

    def get_config(self) -> Dict[str, Any]:
        all_config = self.config_model.get_all_config()
        consecutive_rewards = self.config_model.get_all_consecutive_rewards()

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'daily_points': self.config_model.get_daily_points(),
                'supplement_cost': self.config_model.get_supplement_cost(),
                'enable_supplement': self.config_model.is_supplement_enabled(),
                'max_supplement_days': self.config_model.get_max_supplement_days(),
                'consecutive_rewards': consecutive_rewards,
                'raw_config': all_config
            }
        }
