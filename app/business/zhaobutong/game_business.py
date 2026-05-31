from typing import Dict, Any, Optional
from app.model.zhaobutong_model import ZbtRecordModel, ZbtLevelModel, ZbtDifferenceModel
from app.model.zhaobutong_model import ZbtAchievementModel, ZbtUserAchievementModel
from app.model.zhaobutong_model import ZbtUserModel
import random


class ZbtGameBusiness:
    def __init__(self):
        self.record_model = ZbtRecordModel()
        self.level_model = ZbtLevelModel()
        self.diff_model = ZbtDifferenceModel()
        self.achievement_model = ZbtAchievementModel()
        self.user_achievement_model = ZbtUserAchievementModel()
        self.user_model = ZbtUserModel()

    def start_game(self, user_id: int, level_id: int) -> Dict[str, Any]:
        level = self.level_model.get_by_id(level_id)
        if not level:
            return {'code': 1, 'msg': '关卡不存在', 'data': None}
        if level.get('status') != ZbtLevelModel.STATUS_ACTIVE:
            return {'code': 1, 'msg': '关卡未启用', 'data': None}

        record_id = self.record_model.create(user_id, level_id)
        diffs = self.diff_model.get_by_level_id(level_id)

        if not diffs:
            diff_count = level.get('difference_count', 5)
            difficulty = level.get('difficulty', 1)
            img_w, img_h = 600, 400
            margin = 40
            for idx in range(diff_count):
                x = random.randint(margin, img_w - margin)
                y = random.randint(margin, img_h - margin)
                radius = {1: 30, 2: 25, 3: 20}.get(difficulty, 25)
                self.diff_model.create(level_id, x, y, radius, f'不同点{idx + 1}')
            diffs = self.diff_model.get_by_level_id(level_id)

        return {
            'code': 0,
            'msg': '游戏开始',
            'data': {
                'record_id': record_id,
                'level_id': level_id,
                'level_name': level.get('name'),
                'theme': level.get('theme'),
                'difficulty': level.get('difficulty'),
                'image_original': level.get('image_original'),
                'image_modified': level.get('image_modified'),
                'difference_count': len(diffs),
                'time_limit': level.get('time_limit'),
                'hint_count': level.get('hint_count'),
                'differences': diffs
            }
        }

    def get_hint(self, record_id: int, user_id: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '游戏记录不存在', 'data': None}
        if record.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if record.get('status') != ZbtRecordModel.STATUS_IN_PROGRESS:
            return {'code': 1, 'msg': '游戏已结束', 'data': None}

        level_id = record.get('level_id')
        diffs = self.diff_model.get_by_level_id(level_id)
        if not diffs:
            return {'code': 1, 'msg': '没有可提示的不同点', 'data': None}

        hints_used = record.get('hints_used', 0) + 1
        self.record_model.update_progress(record_id, record.get('differences_found', 0), hints_used, record.get('time_used', 0))

        hint_diff = diffs[hints_used - 1] if hints_used <= len(diffs) else diffs[0]
        return {
            'code': 0,
            'msg': '提示成功',
            'data': {
                'x': hint_diff.get('x'),
                'y': hint_diff.get('y'),
                'radius': hint_diff.get('radius'),
                'description': hint_diff.get('description', ''),
                'hints_used': hints_used
            }
        }

    def complete_game(self, record_id: int, user_id: int, time_used: int,
                      hints_used: int, differences_found: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '游戏记录不存在', 'data': None}
        if record.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}
        if record.get('status') != ZbtRecordModel.STATUS_IN_PROGRESS:
            return {'code': 1, 'msg': '游戏已结束', 'data': None}

        self.record_model.complete(record_id, time_used, hints_used, differences_found)

        self._check_achievements(user_id, time_used, hints_used, record.get('level_id'))

        return {
            'code': 0,
            'msg': '游戏完成',
            'data': {
                'record_id': record_id,
                'time_used': time_used,
                'hints_used': hints_used,
                'differences_found': differences_found
            }
        }

    def fail_game(self, record_id: int, user_id: int, time_used: int,
                  hints_used: int, differences_found: int) -> Dict[str, Any]:
        record = self.record_model.get_by_id(record_id)
        if not record:
            return {'code': 1, 'msg': '游戏记录不存在', 'data': None}
        if record.get('user_id') != user_id:
            return {'code': 1, 'msg': '无权操作', 'data': None}

        self.record_model.fail(record_id, time_used, hints_used, differences_found)
        return {
            'code': 0,
            'msg': '游戏结束',
            'data': {
                'record_id': record_id,
                'time_used': time_used,
                'hints_used': hints_used,
                'differences_found': differences_found
            }
        }

    def get_leaderboard(self, level_id: int = None, limit: int = 50) -> Dict[str, Any]:
        records = self.record_model.get_leaderboard(level_id, limit)
        return {'code': 0, 'msg': 'success', 'data': records}

    def get_user_records(self, user_id: int, status: int = None) -> Dict[str, Any]:
        records = self.record_model.get_user_records(user_id, status)
        return {'code': 0, 'msg': 'success', 'data': records}

    def _check_achievements(self, user_id: int, time_used: int, hints_used: int, level_id: int):
        completed_count = self.record_model.query.count({
            'user_id': user_id,
            'status': ZbtRecordModel.STATUS_COMPLETED
        })

        achievements_to_check = []

        first_win = self.achievement_model.get_by_name('first_win')
        if first_win and completed_count >= 1:
            achievements_to_check.append(first_win['id'])

        five_wins = self.achievement_model.get_by_name('five_wins')
        if five_wins and completed_count >= 5:
            achievements_to_check.append(five_wins['id'])

        ten_wins = self.achievement_model.get_by_name('ten_wins')
        if ten_wins and completed_count >= 10:
            achievements_to_check.append(ten_wins['id'])

        speed_demon = self.achievement_model.get_by_name('speed_demon')
        if speed_demon and time_used <= 30:
            achievements_to_check.append(speed_demon['id'])

        if hints_used == 0:
            no_hints = self.achievement_model.get_by_name('no_hints')
            if no_hints:
                achievements_to_check.append(no_hints['id'])

        level = self.level_model.get_by_id(level_id) if level_id else None
        if level and level.get('difficulty') == ZbtLevelModel.DIFFICULTY_HARD:
            hard_master = self.achievement_model.get_by_name('hard_master')
            if hard_master:
                achievements_to_check.append(hard_master['id'])

        for ach_id in achievements_to_check:
            if not self.user_achievement_model.is_unlocked(user_id, ach_id):
                self.user_achievement_model.unlock(user_id, ach_id)

    def get_stats(self) -> Dict[str, Any]:
        stats = self.record_model.get_stats()
        level_count = self.level_model.query.count({'status': ZbtLevelModel.STATUS_ACTIVE})
        user_count = self.user_model.query.count({'role': ZbtUserModel.ROLE_USER})
        stats['total_levels'] = level_count
        stats['total_users'] = user_count
        return {'code': 0, 'msg': 'success', 'data': stats}

    def get_recent_records(self, limit: int = 20) -> Dict[str, Any]:
        sql = f"""
            SELECT r.*, u.nickname, u.avatar, l.name as level_name
            FROM {self.record_model.TABLE_NAME} r
            LEFT JOIN tb_zhaobutong_model_user u ON r.user_id = u.id
            LEFT JOIN tb_zhaobutong_model_level l ON r.level_id = l.id
            ORDER BY r.id DESC
            LIMIT ?
        """
        from app.common.sqlite.db import get_db
        db = get_db()
        records = db.fetch_all(sql, (limit,))
        return {'code': 0, 'msg': 'success', 'data': records}
