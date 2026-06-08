from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from app.model.dafeiji import (
    DafeijiUserModel, PlaneModel, WaveModel,
    ScoreModel, AchievementModel, UserAchievementModel
)


class AdminBusiness:
    def __init__(self):
        self.user_model = DafeijiUserModel()
        self.plane_model = PlaneModel()
        self.wave_model = WaveModel()
        self.score_model = ScoreModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def _is_admin(self, user_role: str) -> bool:
        return user_role == 'admin'

    def get_users(self, user_role: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        result = self.user_model.get_all(page, page_size)
        return {'code': 0, 'message': 'success', 'data': result}

    def update_user_status(self, user_role: str, user_id: int, status: int) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.user_model.update_status(user_id, status)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': None}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def update_user_role(self, user_role: str, user_id: int, role: str) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.user_model.update_role(user_id, role)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': None}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_user(self, user_role: str, user_id: int) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.user_model.delete(user_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_planes(self, user_role: str) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        planes = self.plane_model.get_all()
        return {'code': 0, 'message': 'success', 'data': planes}

    def create_plane(self, user_role: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        plane_id = self.plane_model.create(data)
        if plane_id > 0:
            return {'code': 0, 'message': '创建成功', 'data': {'id': plane_id}}
        return {'code': 1, 'message': '创建失败', 'data': None}

    def update_plane(self, user_role: str, plane_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.plane_model.update(plane_id, data)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': None}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_plane(self, user_role: str, plane_id: int) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.plane_model.delete(plane_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_waves(self, user_role: str, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        result = self.wave_model.get_all(page, page_size)
        return {'code': 0, 'message': 'success', 'data': result}

    def create_wave(self, user_role: str, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        wave_id = self.wave_model.create(data)
        if wave_id > 0:
            return {'code': 0, 'message': '创建成功', 'data': {'id': wave_id}}
        return {'code': 1, 'message': '创建失败', 'data': None}

    def update_wave(self, user_role: str, wave_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.wave_model.update(wave_id, data)
        if affected > 0:
            return {'code': 0, 'message': '更新成功', 'data': None}
        return {'code': 1, 'message': '更新失败', 'data': None}

    def delete_wave(self, user_role: str, wave_id: int) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}
        affected = self.wave_model.delete(wave_id)
        if affected > 0:
            return {'code': 0, 'message': '删除成功', 'data': None}
        return {'code': 1, 'message': '删除失败', 'data': None}

    def get_statistics(self, user_role: str) -> Dict[str, Any]:
        if not self._is_admin(user_role):
            return {'code': 1, 'message': '无权限访问', 'data': None}

        total_users = self.user_model.count()
        total_planes = self.plane_model.query.count()
        total_waves = self.wave_model.count()

        today = datetime.now().strftime('%Y-%m-%d')
        today_scores = self.score_model.get_daily_top(today, 1000)
        today_players = len(set(s['user_id'] for s in today_scores)) if today_scores else 0

        scores_all = self.score_model.get_all_time_top(100)
        total_plays = len(scores_all) if scores_all else 0

        last_7_days = []
        for i in range(6, -1, -1):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            day_scores = self.score_model.get_daily_top(date, 1000)
            last_7_days.append({
                'date': date,
                'players': len(set(s['user_id'] for s in day_scores)) if day_scores else 0,
                'games': len(day_scores) if day_scores else 0,
                'avg_score': sum(s['score'] for s in day_scores) / len(day_scores) if day_scores else 0
            })

        wave_distribution = []
        for i in range(1, 11):
            count = sum(1 for s in scores_all if s.get('wave', 0) >= i)
            wave_distribution.append({'wave': i, 'count': count})

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'overview': {
                    'total_users': total_users,
                    'total_planes': total_planes,
                    'total_waves': total_waves,
                    'today_players': today_players,
                    'total_plays': total_plays
                },
                'last_7_days': last_7_days,
                'wave_distribution': wave_distribution,
                'top_scores': scores_all[:10] if scores_all else []
            }
        }
