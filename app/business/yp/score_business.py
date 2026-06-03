from typing import Dict, Any
from app.model.yp_model import ScoreModel, UserModel, UserMusicModel


class YpScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()
        self.user_model = UserModel()
        self.user_music_model = UserMusicModel()

    def submit_score(self, user_id: int, music_id: int, score: int, max_combo: int,
                     perfect_count: int, good_count: int, miss_count: int,
                     distance: float, play_time: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        score_multiplier = 1.0
        from app.model.yp_model import UserCharacterModel, UserSkillModel
        user_char_model = UserCharacterModel()
        user_skill_model = UserSkillModel()

        using_char = user_char_model.get_using_character(user_id)
        if using_char:
            score_multiplier *= using_char.get('score_bonus', 1.0)

        skill_effects = user_skill_model.get_skill_effects(user_id)
        score_multiplier *= (1 + skill_effects.get('score_multiplier', 0))

        final_score = int(score * score_multiplier)
        coins_earned = int(final_score / 10)

        score_data = {
            'user_id': user_id,
            'music_id': music_id,
            'score': final_score,
            'max_combo': max_combo,
            'perfect_count': perfect_count,
            'good_count': good_count,
            'miss_count': miss_count,
            'coins_earned': coins_earned,
            'distance': distance,
            'play_time': play_time
        }

        score_id = self.score_model.create(score_data)
        if score_id > 0:
            self.user_model.update_score(user_id, final_score, coins_earned)
            self.user_music_model.update_score(user_id, music_id, final_score)

            from app.model.yp_model import GameStateModel
            game_state_model = GameStateModel()
            game_state_model.update_last_play_time(user_id)

            new_score = self.score_model.get_by_id(score_id)
            user_rank = self.score_model.get_user_rank(user_id, music_id)
            updated_user = self.user_model.get_by_id(user_id)

            return {
                'code': 0,
                'msg': '提交成功',
                'data': {
                    'score': self.score_model.to_public_dict(new_score) if new_score else None,
                    'final_score': final_score,
                    'coins_earned': coins_earned,
                    'score_multiplier': score_multiplier,
                    'rank': user_rank,
                    'user': self.user_model.to_public_dict(updated_user) if updated_user else None
                }
            }

        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }

    def get_leaderboard(self, music_id: int = 0, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.score_model.get_leaderboard(music_id, page, page_size)
        items = [self.score_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_user_scores(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.score_model.get_user_scores(user_id, page, page_size)
        items = [self.score_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_user_rank(self, user_id: int, music_id: int = 0) -> Dict[str, Any]:
        rank = self.score_model.get_user_rank(user_id, music_id)
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user_id': user_id,
                'music_id': music_id,
                'rank': rank
            }
        }

    def delete_score(self, score_id: int) -> Dict[str, Any]:
        affected = self.score_model.delete(score_id)
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
