from typing import Dict, Any, List, Optional
from datetime import datetime, date as date_type, timedelta
from app.model.jianshen import (
    JianshenCheckinModel, JianshenUserModel,
    JianshenAchievementModel, JianshenUserAchievementModel
)
import json


PROJECT_OPTIONS = ['胸部', '背部', '腿部', '肩部', '手臂', '核心', '有氧', '瑜伽']


class JianshenCheckinBusiness:
    def __init__(self):
        self.checkin_model = JianshenCheckinModel()
        self.user_model = JianshenUserModel()
        self.achievement_model = JianshenAchievementModel()
        self.user_achievement_model = JianshenUserAchievementModel()

    def create_checkin(self, user_id: int, checkin_date: str, projects: List[str] = None,
                    details: List[Dict] = None,
                    duration: int = 0, calories: int = 0,
                    remark: str = '', mood: str = '') -> Dict[str, Any]:
        if not checkin_date:
            return {'code': 1, 'msg': '请选择打卡日期', 'data': None}
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        projects = projects or []
        details = details or []
        existing = self.checkin_model.get_by_user_and_date(user_id, checkin_date)
        if existing:
            checkin_id = existing.get('id')
            self.checkin_model.update(checkin_id, {
                'projects': json.dumps(projects, ensure_ascii=False),
                'details': json.dumps(details, ensure_ascii=False),
                'duration': duration,
                'calories': calories,
                'remark': remark,
                'mood': mood
            })
            record = self.checkin_model.get_by_id(checkin_id)
        else:
            checkin_id = self.checkin_model.create(
                user_id, checkin_date,
                json.dumps(projects, ensure_ascii=False),
                json.dumps(details, ensure_ascii=False),
                duration, calories, remark, mood
            )
            if checkin_id > 0:
                self.user_model.increment_checkin_stats(user_id, checkin_date)
            record = self.checkin_model.get_by_id(checkin_id)
        new_achievements = self._check_achievements(user_id, checkin_date)
        exp_gained = 0
        if existing is None:
            exp_gained = 20
            for a in new_achievements:
                exp_gained += a.get('exp_reward', 0)
        if exp_gained > 0:
            self.user_model.add_exp(user_id, exp_gained)
        return {
            'code': 0,
            'msg': '打卡成功' if existing is None else '更新成功',
            'data': {
                'checkin': self.checkin_model.to_dict(record) if record else None,
                'new_achievements': new_achievements,
                'is_new': existing is None
            }
        }

    def _check_achievements(self, user_id: int, checkin_date: str) -> List[Dict[str, Any]]:
        unlocked = []
        all_achievements = self.achievement_model.get_all()
        user = self.user_model.get_by_id(user_id)
        if not user:
            return unlocked
        total_checkins = user.get('total_checkins', 0)
        consecutive_days = user.get('consecutive_days', 0)
        for achievement in all_achievements:
            ach_id = achievement.get('id')
            if self.user_achievement_model.is_unlocked(user_id, ach_id):
                continue
            atype = achievement.get('type')
            condition = achievement.get('condition_value', 0)
            ok = False
            if atype == 'first_time' and total_checkins >= 1:
                ok = True
            elif atype == 'consecutive_days' and consecutive_days >= condition:
                ok = True
            elif atype == 'total_checkins' and total_checkins >= condition:
                ok = True
            elif atype == 'all_projects':
                recent = self.checkin_model.get_by_user(user_id, 1, 9999)
                projects_set = set()
                for c in recent.get('items', []):
                    try:
                        projs = json.loads(c.get('projects', '[]'))
                        projects_set.update(projs)
                    except Exception:
                        pass
                if len(projects_set) >= condition:
                    ok = True
            elif atype == 'morning':
                now = datetime.now()
                if now.hour < 8:
                    ok = True
            elif atype == 'night':
                now = datetime.now()
                if now.hour >= 21:
                    ok = True
            if ok:
                self.user_achievement_model.create(user_id, ach_id)
                unlocked.append(self.achievement_model.to_dict(achievement))
        return unlocked

    def get_checkin_list(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.checkin_model.get_by_user(user_id, page, page_size)
        items = [self.checkin_model.to_dict(item) for item in result.get('items', [])]
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

    def get_checkin_by_date(self, user_id: int, checkin_date: str) -> Dict[str, Any]:
        record = self.checkin_model.get_by_user_and_date(user_id, checkin_date)
        if not record:
            return {'code': 0, 'msg': 'success', 'data': None}
        return {'code': 0, 'msg': 'success', 'data': self.checkin_model.to_dict(record)}

    def update_checkin(self, user_id: int, checkin_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        record = self.checkin_model.get_by_id(checkin_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        if record.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权限', 'data': None}
        update_data = {}
        if 'projects' in data:
            update_data['projects'] = json.dumps(data['projects'], ensure_ascii=False)
        if 'details' in data:
            update_data['details'] = json.dumps(data['details'], ensure_ascii=False)
        for field in ['duration', 'calories', 'remark', 'mood']:
            if field in data:
                update_data[field] = data[field]
        self.checkin_model.update(checkin_id, update_data)
        updated = self.checkin_model.get_by_id(checkin_id)
        return {'code': 0, 'msg': '更新成功', 'data': self.checkin_model.to_dict(updated)}

    def delete_checkin(self, user_id: int, checkin_id: int) -> Dict[str, Any]:
        record = self.checkin_model.get_by_id(checkin_id)
        if not record:
            return {'code': 1, 'msg': '记录不存在', 'data': None}
        if record.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权限', 'data': None}
        if self.checkin_model.delete(checkin_id) > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}

    def get_recent(self, user_id: int, limit: int = 5) -> Dict[str, Any]:
        records = self.checkin_model.get_recent(user_id, limit)
        items = [self.checkin_model.to_dict(r) for r in records]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_calendar(self, user_id: int, year: int, month: int) -> Dict[str, Any]:
        start = date_type(year, month, 1)
        if month == 12:
            end = date_type(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date_type(year, month + 1, 1) - timedelta(days=1)
        records = self.checkin_model.get_by_user_date_range(user_id, start.isoformat(), end.isoformat())
        days = {}
        for r in records:
            d = r.get('checkin_date')
            if d:
                items = []
                try:
                    items = json.loads(r.get('projects', '[]'))
                except Exception:
                    pass
                days[d] = {
                    'checkin_date': d,
                    'projects': items,
                    'duration': r.get('duration', 0),
                    'calories': r.get('calories', 0)
                }
        return {'code': 0, 'msg': 'success', 'data': days}

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                keyword: str = None) -> Dict[str, Any]:
        result = self.checkin_model.get_all(page, page_size, user_id, keyword)
        items = []
        for item in result.get('items', []):
            d = self.checkin_model.to_dict(item)
            user = self.user_model.get_by_id(item.get('user_id'))
            if user:
                d['username'] = user.get('username', '')
                d['nickname'] = user.get('nickname', '')
            items.append(d)
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

    def delete_by_admin(self, checkin_id: int) -> Dict[str, Any]:
        if self.checkin_model.delete(checkin_id) > 0:
            return {'code': 0, 'msg': '删除成功', 'data': None}
        return {'code': 1, 'msg': '删除失败', 'data': None}
