from typing import Dict, Any, List
from app.model.jianshen import (
    JianshenAchievementModel, JianshenUserAchievementModel,
    JianshenUserModel
)


class JianshenAchievementBusiness:
    def __init__(self):
        self.achievement_model = JianshenAchievementModel()
        self.user_achievement_model = JianshenUserAchievementModel()
        self.user_model = JianshenUserModel()

    def get_all_achievements(self) -> Dict[str, Any]:
        achievements = self.achievement_model.get_all()
        items = [self.achievement_model.to_dict(a) for a in achievements]
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_user_achievements(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        user_unlocked = self.user_achievement_model.get_by_user(user_id)
        unlocked_ids = {ua.get('achievement_id') for ua in user_unlocked}
        items = []
        for a in all_achievements:
            d = self.achievement_model.to_dict(a)
            d['unlocked'] = a.get('id') in unlocked_ids
            ua = next((u for u in user_unlocked if u.get('achievement_id') == a.get('id')), None)
            d['unlocked_at'] = ua.get('unlocked_at') if ua else None
            items.append(d)
        return {'code': 0, 'msg': 'success', 'data': items}

    def get_level_info(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'msg': '用户不存在', 'data': None}
        level = user.get('level', 1)
        exp = user.get('exp', 0)
        next_level_exp = level * 100
        progress = min(100, int(exp / next_level_exp * 100)) if next_level_exp > 0 else 0
        return {
            'code': 0, 'msg': 'success',
            'data': {
                'level': level,
                'exp': exp,
                'next_level_exp': next_level_exp,
                'progress': progress,
                'total_checkins': user.get('total_checkins', 0),
                'consecutive_days': user.get('consecutive_days', 0)
            }
        }

    def get_upcoming(self, user_id: int) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        user_unlocked = self.user_achievement_model.get_by_user(user_id)
        unlocked_ids = {ua.get('achievement_id') for ua in user_unlocked}
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 0, 'msg': 'success', 'data': []}
        total = user.get('total_checkins', 0)
        consecutive = user.get('consecutive_days', 0)
        upcoming = []
        for a in all_achievements:
            if a.get('id') in unlocked_ids:
                continue
            atype = a.get('type')
            cond = a.get('condition_value', 0)
            progress = 0
            target = cond
            if atype == 'consecutive_days':
                progress = consecutive
                upcoming.append({
                    'achievement': self.achievement_model.to_dict(a),
                    'progress': min(progress, target),
                    'target': target,
                    'percent': min(100, int(progress / target * 100)) if target > 0 else 0
                })
            elif atype == 'total_checkins':
                progress = total
                upcoming.append({
                    'achievement': self.achievement_model.to_dict(a),
                    'progress': min(progress, target),
                    'target': target,
                    'percent': min(100, int(progress / target * 100)) if target > 0 else 0
                })
        upcoming.sort(key=lambda x: x['percent'], reverse=True)
        return {'code': 0, 'msg': 'success', 'data': upcoming[:3]}
