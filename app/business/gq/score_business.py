from typing import Dict, Any
from app.model.gq_model import GqScoreModel, GqUserProgressModel, GqUserModel


class GqScoreBusiness:
    def __init__(self):
        self.score_model = GqScoreModel()
        self.user_progress_model = GqUserProgressModel()
        self.user_model = GqUserModel()

    def submit_score(self, user_id: int, track_id: int, score: int = 0,
                     max_combo: int = 0, accuracy: float = 0.0,
                     stars: int = 0, magic_effects: str = '[]') -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        score_id = self.score_model.create(
            user_id, track_id, score, max_combo, accuracy, stars, magic_effects
        )
        if score_id <= 0:
            return {
                'code': 1,
                'msg': '提交成绩失败',
                'data': None
            }
        progress = self.user_progress_model.get_or_create(user_id, track_id)
        update_data = {}
        if score > progress.get('best_score', 0):
            update_data['best_score'] = score
        if stars > progress.get('best_stars', 0):
            update_data['best_stars'] = stars
        if update_data:
            self.user_progress_model.update_progress(user_id, track_id, update_data)
        self.user_progress_model.increment_play_count(user_id, track_id)
        coins_reward = score // 10
        exp_reward = stars * 50 + score // 20
        if coins_reward > 0:
            self.user_model.update_currency(user_id, coins_reward, 0)
        if exp_reward > 0:
            self.user_model.add_exp(user_id, exp_reward)
        score_record = self.score_model.get_by_id(score_id)
        return {
            'code': 0,
            'msg': '提交成功',
            'data': {
                'score': score_record,
                'rewards': {
                    'coins': coins_reward,
                    'exp': exp_reward
                }
            }
        }

    def get_score_detail(self, score_id: int) -> Dict[str, Any]:
        score = self.score_model.get_by_id(score_id)
        if not score:
            return {
                'code': 1,
                'msg': '成绩记录不存在',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': score
        }

    def get_user_scores(self, user_id: int, page: int = 1,
                        page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_user_scores(user_id, page, page_size)
        items = result.get('items', [])
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

    def get_track_leaderboard(self, track_id: int, page: int = 1,
                              page_size: int = 10) -> Dict[str, Any]:
        result = self.score_model.get_track_scores(track_id, page, page_size)
        items = result.get('items', [])
        leaderboard = []
        for item in items:
            user = self.user_model.get_by_id(item.get('user_id'))
            leaderboard.append({
                'score_id': item.get('id'),
                'user_id': item.get('user_id'),
                'nickname': user.get('nickname', '') if user else '',
                'avatar': user.get('avatar', '') if user else '',
                'score': item.get('score'),
                'max_combo': item.get('max_combo'),
                'accuracy': item.get('accuracy'),
                'stars': item.get('stars'),
                'created_at': item.get('created_at')
            })
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': leaderboard,
                'total': result.get('total'),
                'page': result.get('page'),
                'page_size': result.get('page_size'),
                'total_pages': result.get('total_pages')
            }
        }

    def get_user_best_score(self, user_id: int, track_id: int) -> Dict[str, Any]:
        best = self.score_model.get_user_best_score(user_id, track_id)
        if not best:
            return {
                'code': 0,
                'msg': '暂无成绩记录',
                'data': None
            }
        return {
            'code': 0,
            'msg': 'success',
            'data': best
        }

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }
        progress_list = self.user_progress_model.get_user_progress(user_id)
        total_plays = 0
        total_stars = 0
        best_combo = 0
        total_accuracy = 0.0
        track_count = len(progress_list)
        for progress in progress_list:
            total_plays += progress.get('play_count', 0)
            total_stars += progress.get('best_stars', 0)
        user_scores_result = self.score_model.get_user_scores(user_id, page=1, page_size=1000)
        score_items = user_scores_result.get('items', [])
        for score_item in score_items:
            if score_item.get('max_combo', 0) > best_combo:
                best_combo = score_item.get('max_combo', 0)
            total_accuracy += score_item.get('accuracy', 0.0)
        avg_accuracy = total_accuracy / len(score_items) if score_items else 0.0
        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'total_plays': total_plays,
                'total_stars': total_stars,
                'best_combo': best_combo,
                'average_accuracy': round(avg_accuracy, 2),
                'track_count': track_count
            }
        }
