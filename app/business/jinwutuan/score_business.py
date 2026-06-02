from typing import Dict, Any, Optional
from app.model.jinwutuan import ScoreModel, UserModel, GameStatsModel, AchievementModel, UserAchievementModel


class JinwutuanScoreBusiness:
    def __init__(self):
        self.score_model = ScoreModel()
        self.user_model = UserModel()
        self.game_stats_model = GameStatsModel()
        self.achievement_model = AchievementModel()
        self.user_achievement_model = UserAchievementModel()

    def submit_score(self, user_id: int, song_id: int, instrument_id: int,
                     difficulty: str, score: int, max_combo: int = 0,
                     perfect_count: int = 0, great_count: int = 0,
                     good_count: int = 0, miss_count: int = 0) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        score_id = self.score_model.create(
            user_id=user_id,
            song_id=song_id,
            instrument_id=instrument_id,
            difficulty=difficulty,
            score=score,
            max_combo=max_combo,
            perfect_count=perfect_count,
            great_count=great_count,
            good_count=good_count,
            miss_count=miss_count
        )

        if score_id > 0:
            self.game_stats_model.increment_stats(
                user_id=user_id,
                score=score,
                perfect=perfect_count,
                great=great_count,
                good=good_count,
                miss=miss_count,
                combo=max_combo
            )

            exp_reward = score // 100
            self.user_model.add_exp(user_id, exp_reward)

            coins_reward = score // 1000 + max_combo // 10
            self.user_model.add_coins(user_id, coins_reward)

            from app.business.jinwutuan.achievement_business import JinwutuanAchievementBusiness
            achievement_business = JinwutuanAchievementBusiness()
            achievement_business.check_achievements(user_id)

            score_record = self.score_model.get_by_id(score_id)
            result_data = self.score_model.to_dict(score_record)
            result_data['exp_reward'] = exp_reward
            result_data['coins_reward'] = coins_reward

            return {
                'code': 0,
                'msg': '提交成功',
                'data': result_data
            }

        return {
            'code': 1,
            'msg': '提交失败',
            'data': None
        }

    def get_song_leaderboard(self, song_id: int, difficulty: str = None,
                             instrument_id: int = None, page: int = 1,
                             page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_song_leaderboard(
            song_id=song_id,
            difficulty=difficulty,
            instrument_id=instrument_id,
            page=page,
            page_size=page_size
        )

        items = []
        for score in result.get('items', []):
            score_data = self.score_model.to_dict(score)
            user = self.user_model.get_by_id(score.get('user_id'))
            if user:
                score_data['user'] = self.user_model.to_public_dict(user)
            items.append(score_data)

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

    def get_user_scores(self, user_id: int, page: int = 1,
                        page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_user_scores(
            user_id=user_id,
            page=page,
            page_size=page_size
        )

        items = [self.score_model.to_dict(score) for score in result.get('items', [])]

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

    def get_user_best_score(self, user_id: int, song_id: int,
                            difficulty: str) -> Dict[str, Any]:
        best = self.score_model.get_user_best_score(user_id, song_id, difficulty)
        if not best:
            return {
                'code': 0,
                'msg': 'success',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.score_model.to_dict(best)
        }
