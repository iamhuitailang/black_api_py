from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.dafeiji import (
    PlaneModel, WaveModel, GameStateModel,
    ScoreModel, AchievementModel, UserAchievementModel,
    DafeijiUserModel
)


class GameBusiness:
    def __init__(self):
        self.plane_model = PlaneModel()
        self.wave_model = WaveModel()
        self.game_state_model = GameStateModel()
        self.score_model = ScoreModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.user_model = DafeijiUserModel()

    def get_planes(self) -> Dict[str, Any]:
        planes = self.plane_model.get_all()
        return {'code': 0, 'message': 'success', 'data': planes}

    def get_waves(self) -> Dict[str, Any]:
        waves = self.wave_model.get_all_waves()
        return {'code': 0, 'message': 'success', 'data': waves}

    def get_wave(self, wave_number: int) -> Dict[str, Any]:
        wave = self.wave_model.get_by_wave_number(wave_number)
        if not wave:
            max_wave = self.wave_model.get_max_wave()
            base_wave_num = wave_number % max_wave if max_wave > 0 else wave_number
            if base_wave_num == 0:
                base_wave_num = max_wave
            base_wave = self.wave_model.get_by_wave_number(base_wave_num)
            if base_wave:
                multiplier = 1.0 + ((wave_number - 1) // 10) * 0.1
                wave = dict(base_wave)
                wave['wave_number'] = wave_number
                wave['difficulty_multiplier'] = multiplier
                wave['is_generated'] = True
            else:
                return {'code': 1, 'message': '波次不存在', 'data': None}
        return {'code': 0, 'message': 'success', 'data': wave}

    def save_game_state(self, user_id: int, plane_id: str, state_data: Dict[str, Any],
                        score: int, wave: int, is_paused: bool = False) -> Dict[str, Any]:
        active_state = self.game_state_model.get_active_state(user_id)
        if active_state:
            self.game_state_model.update_state(
                active_state['id'], state_data, score, wave
            )
            state_id = active_state['id']
        else:
            state_id = self.game_state_model.create_state(
                user_id, plane_id, state_data, score, wave
            )
        return {'code': 0, 'message': '状态保存成功', 'data': {'state_id': state_id}}

    def load_game_state(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.get_active_state(user_id)
        if not state:
            return {'code': 1, 'message': '没有可恢复的游戏状态', 'data': None}
        return {'code': 0, 'message': 'success', 'data': state}

    def end_game(self, user_id: int, state_id: int, score: int, wave: int,
                 kills: int, play_time: int, plane_id: str,
                 collected_items: List[str] = None,
                 used_planes: List[str] = None,
                 perfect_waves: int = 0) -> Dict[str, Any]:
        if not self.score_model.verify_score_reasonable(score, wave, kills, play_time):
            return {'code': 1, 'message': '分数异常，已拒绝提交', 'data': None}

        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        self.game_state_model.deactivate_state(state_id)

        self.score_model.add_score(
            user_id=user_id,
            username=user.get('username', ''),
            score=score,
            wave=wave,
            plane_id=plane_id,
            kills=kills,
            play_time=play_time
        )

        self.user_model.update_stats(user_id, score, kills, wave)

        newly_unlocked = []
        achievements = self.achievement_model.get_all()

        for ach in achievements:
            if self.user_achievement_model.has_achievement(user_id, ach['achievement_id']):
                continue

            ach_id = ach['achievement_id']
            unlocked = False

            if ach_id == 'first_kill' and kills >= 1:
                unlocked = True
            elif ach_id == 'kill_100' and (user.get('total_kills', 0) + kills) >= 100:
                unlocked = True
            elif ach_id == 'kill_500' and (user.get('total_kills', 0) + kills) >= 500:
                unlocked = True
            elif ach_id == 'kill_1000' and (user.get('total_kills', 0) + kills) >= 1000:
                unlocked = True
            elif ach_id == 'survive_5min' and play_time >= 300:
                unlocked = True
            elif ach_id == 'score_10000' and score >= 10000:
                unlocked = True
            elif ach_id == 'all_items' and collected_items and len(set(collected_items)) >= 5:
                unlocked = True
            elif ach_id == 'all_planes' and used_planes and len(set(used_planes)) >= 3:
                unlocked = True
            elif ach_id == 'perfect_5waves' and perfect_waves >= 5:
                unlocked = True

            if unlocked:
                if self.user_achievement_model.unlock_achievement(user_id, ach_id):
                    newly_unlocked.append(ach)

        return {
            'code': 0,
            'message': '游戏结束',
            'data': {
                'score': score,
                'wave': wave,
                'kills': kills,
                'new_achievements': newly_unlocked
            }
        }

    def get_leaderboard(self, type: str = 'daily', limit: int = 50) -> Dict[str, Any]:
        if type == 'daily':
            scores = self.score_model.get_daily_top(limit=limit)
        elif type == 'weekly':
            scores = self.score_model.get_weekly_top(limit=limit)
        elif type == 'all':
            scores = self.score_model.get_all_time_top(limit=limit)
        else:
            return {'code': 1, 'message': '无效的排行榜类型', 'data': None}

        return {'code': 0, 'message': 'success', 'data': scores}

    def get_achievements(self, user_id: int = None) -> Dict[str, Any]:
        all_achievements = self.achievement_model.get_all()
        if user_id:
            user_achs = self.user_achievement_model.get_user_achievements(user_id)
            user_ach_ids = {a['achievement_id'] for a in user_achs}
            for ach in all_achievements:
                ach['unlocked'] = ach['achievement_id'] in user_ach_ids
            stats = self.user_achievement_model.get_user_stats(user_id)
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'achievements': all_achievements,
                    'stats': stats
                }
            }
        return {'code': 0, 'message': 'success', 'data': all_achievements}

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {'code': 1, 'message': '用户不存在', 'data': None}

        best_score = self.score_model.get_user_best(user_id)
        achievement_stats = self.user_achievement_model.get_user_stats(user_id)
        recent_scores = self.score_model.get_user_scores(user_id, 10)

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'user_info': {
                    'id': user.get('id'),
                    'username': user.get('username'),
                    'total_score': user.get('total_score', 0),
                    'total_kills': user.get('total_kills', 0),
                    'highest_wave': user.get('highest_wave', 0)
                },
                'best_score': best_score,
                'achievement_stats': achievement_stats,
                'recent_scores': recent_scores
            }
        }

    def check_boss_first_kill(self, user_id: int) -> Dict[str, Any]:
        newly_unlocked = []
        if not self.user_achievement_model.has_achievement(user_id, 'first_boss'):
            ach = self.achievement_model.get_by_achievement_id('first_boss')
            if ach and self.user_achievement_model.unlock_achievement(user_id, 'first_boss'):
                newly_unlocked.append(ach)
        return {'code': 0, 'message': 'success', 'data': {'new_achievements': newly_unlocked}}
