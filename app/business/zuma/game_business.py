from typing import Dict, Any, List, Optional
from app.model.zuma_model import ZumaGameScoreModel, ZumaGameRecordModel, ZumaUserModel
from app.business.zuma.achievement_business import ZumaAchievementBusiness


class ZumaGameBusiness:
    def __init__(self):
        self.game_score_model = ZumaGameScoreModel()
        self.game_record_model = ZumaGameRecordModel()
        self.user_model = ZumaUserModel()
        self.achievement_business = ZumaAchievementBusiness()

    def submit_score(self, user_id: int, score: int, level: int, combo: int = 0,
                     duration: int = 0, balls_fired: int = 0, balls_matched: int = 0) -> Dict[str, Any]:
        if score < 0:
            return {
                'code': 1,
                'msg': '分数不能为负',
                'data': None
            }

        record_id = self.game_score_model.create(
            user_id=user_id,
            score=score,
            level=level,
            combo=combo,
            duration=duration,
            balls_fired=balls_fired,
            balls_matched=balls_matched
        )

        if record_id > 0:
            self.user_model.update_game_stats(user_id, score, combo)
            self.achievement_business.check_and_unlock_achievements(user_id)

            user = self.user_model.get_by_id(user_id)
            return {
                'code': 0,
                'msg': '分数提交成功',
                'data': {
                    'record_id': record_id,
                    'user': self.user_model.to_public_dict(user)
                }
            }

        return {
            'code': 1,
            'msg': '分数提交失败',
            'data': None
        }

    def get_top_scores(self, limit: int = 100) -> Dict[str, Any]:
        scores = self.game_score_model.get_top_scores(limit)
        return {
            'code': 0,
            'msg': 'success',
            'data': scores
        }

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.game_score_model.get_by_user_id(user_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def save_game_state(self, user_id: int, game_state: Dict[str, Any]) -> Dict[str, Any]:
        affected = self.game_record_model.save_game_state(user_id, game_state)
        if affected > 0:
            return {
                'code': 0,
                'msg': '游戏状态保存成功',
                'data': None
            }
        return {
            'code': 1,
            'msg': '游戏状态保存失败',
            'data': None
        }

    def get_game_state(self, user_id: int) -> Dict[str, Any]:
        game_state = self.game_record_model.get_game_state(user_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': game_state
        }

    def clear_game_state(self, user_id: int) -> Dict[str, Any]:
        affected = self.game_record_model.clear_game_state(user_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '游戏状态清除成功',
                'data': None
            }
        return {
            'code': 0,
            'msg': '无需要清除的游戏状态',
            'data': None
        }
