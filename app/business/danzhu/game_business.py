from typing import Dict, Any, List
from app.model.danzhu_model import (
    UserModel, LevelModel, ScoreModel, AchievementModel,
    UserAchievementModel, GameRecordModel
)
import json


class DanzhuGameBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.level_model = LevelModel()
        self.score_model = ScoreModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()
        self.game_record_model = GameRecordModel()

    def get_level_config(self, level_id: int = 0) -> Dict[str, Any]:
        if level_id > 0:
            level = self.level_model.get_by_id(level_id)
            if level:
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': self.level_model.to_dict(level)
                }

        levels = self.level_model.get_published()
        if levels:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.level_model.to_dict(levels[0])
            }

        return {
            'code': 1,
            'msg': '暂无可用关卡',
            'data': None
        }

    def get_level_list(self) -> Dict[str, Any]:
        levels = self.level_model.get_published()
        items = [self.level_model.to_dict(level) for level in levels]

        return {
            'code': 0,
            'msg': 'success',
            'data': items
        }

    def save_game_result(self, user_id: int, level_id: int, score: int,
                         combo_max: int, combo_count: int, balls_used: int,
                         play_duration: int, hit_count: int,
                         hit_details: List = None, item_hits: Dict = None) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        score_id = self.score_model.create(
            user_id=user_id,
            level_id=level_id,
            score=score,
            combo_max=combo_max,
            combo_count=combo_count,
            balls_used=balls_used,
            play_duration=play_duration,
            hit_count=hit_count
        )

        if level_id > 0:
            self.level_model.increment_play_count(level_id)

        user = self.user_model.get_by_id(user_id)
        user_stats = {
            'games_played': user.get('games_played', 0),
            'single_score': score,
            'total_score': user.get('total_score', 0),
            'max_combo': combo_max
        }

        new_achievements = self.achievement_model.check_and_unlock(user_id, user_stats)

        hit_details_str = json.dumps(hit_details) if hit_details else ''
        item_hits_str = json.dumps(item_hits) if item_hits else ''
        new_achievements_str = json.dumps([a.get('name') for a in new_achievements]) if new_achievements else ''

        self.game_record_model.create(
            user_id=user_id,
            level_id=level_id,
            score_id=score_id,
            score=score,
            combo_max=combo_max,
            combo_count=combo_count,
            balls_used=balls_used,
            play_duration=play_duration,
            hit_count=hit_count,
            hit_details=hit_details_str,
            item_hits=item_hits_str,
            new_achievements=new_achievements_str
        )

        updated_user = self.user_model.get_by_id(user_id)
        rank = self.user_model.get_rank(user_id)

        return {
            'code': 0,
            'msg': '游戏结果保存成功',
            'data': {
                'score': score,
                'combo_max': combo_max,
                'new_achievements': new_achievements,
                'highest_score': updated_user.get('highest_score', 0),
                'rank': rank,
                'is_new_record': score >= updated_user.get('highest_score', 0) and score > 0
            }
        }

    def get_user_game_history(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.get_user_records(user_id, page, page_size)
        items = [self.game_record_model.to_dict(record) for record in result.get('items', [])]

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
