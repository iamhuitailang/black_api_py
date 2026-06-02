from typing import Dict, Any, List, Optional
from datetime import datetime
from app.model.majiang_model import RankingModel, UserModel


class MajiangRankingBusiness:
    def __init__(self):
        self.ranking_model = RankingModel()
        self.user_model = UserModel()

    def _get_period(self, ranking_type: int) -> str:
        now = datetime.now()
        if ranking_type == RankingModel.TYPE_DAILY:
            return now.strftime('%Y%m%d')
        elif ranking_type == RankingModel.TYPE_WEEKLY:
            return now.strftime('%Y%W')
        elif ranking_type == RankingModel.TYPE_MONTHLY:
            return now.strftime('%Y%m')
        else:
            return 'all'

    def refresh_ranking(self, ranking_type: int) -> Dict[str, Any]:
        period = self._get_period(ranking_type)
        players = self.user_model.get_top_players(limit=100)

        rankings = []
        for player in players:
            score = player.get('coins', 0) * 2 + player.get('wins', 0) * 100 + player.get('max_fan', 0) * 50
            rankings.append({
                'user_id': player.get('id'),
                'score': score,
                'wins': player.get('wins', 0),
                'losses': player.get('losses', 0),
                'max_fan': player.get('max_fan', 0)
            })

        rankings.sort(key=lambda x: x['score'], reverse=True)

        success = self.ranking_model.update_ranking_batch(ranking_type, period, rankings)
        if success:
            return {
                'code': 0,
                'msg': '排行榜更新成功',
                'data': {
                    'ranking_type': ranking_type,
                    'period': period,
                    'count': len(rankings)
                }
            }

        return {
            'code': 1,
            'msg': '排行榜更新失败',
            'data': None
        }

    def get_ranking(self, ranking_type: int, period: str = None, limit: int = 100) -> Dict[str, Any]:
        if period is None:
            period = self._get_period(ranking_type)

        rankings = self.ranking_model.get_ranking(ranking_type, period, limit)

        if not rankings:
            self.refresh_ranking(ranking_type)
            rankings = self.ranking_model.get_ranking(ranking_type, period, limit)

        result = []
        for idx, r in enumerate(rankings):
            result.append({
                'rank': idx + 1,
                'user_id': r.get('user_id'),
                'nickname': r.get('nickname', ''),
                'avatar': r.get('avatar', ''),
                'level': r.get('level', 1),
                'score': r.get('score', 0),
                'wins': r.get('wins', 0),
                'losses': r.get('losses', 0),
                'max_fan': r.get('max_fan', 0)
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'ranking_type': ranking_type,
                'ranking_type_text': self.ranking_model.get_type_text(ranking_type),
                'period': period,
                'items': result
            }
        }

    def get_user_ranking(self, user_id: int, ranking_type: int) -> Dict[str, Any]:
        period = self._get_period(ranking_type)
        ranking = self.ranking_model.get_user_ranking(user_id, ranking_type, period)

        if not ranking:
            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'ranking_type': ranking_type,
                    'ranking_type_text': self.ranking_model.get_type_text(ranking_type),
                    'period': period,
                    'rank': None,
                    'score': 0,
                    'wins': 0,
                    'losses': 0,
                    'max_fan': 0
                }
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'ranking_type': ranking_type,
                'ranking_type_text': self.ranking_model.get_type_text(ranking_type),
                'period': period,
                'rank': ranking.get('rank'),
                'score': ranking.get('score', 0),
                'wins': ranking.get('wins', 0),
                'losses': ranking.get('losses', 0),
                'max_fan': ranking.get('max_fan', 0)
            }
        }

    def get_all_rankings(self, user_id: int = None) -> Dict[str, Any]:
        types = [
            (RankingModel.TYPE_DAILY, '日榜'),
            (RankingModel.TYPE_WEEKLY, '周榜'),
            (RankingModel.TYPE_MONTHLY, '月榜'),
            (RankingModel.TYPE_ALL_TIME, '总榜')
        ]

        result = {}
        for ranking_type, name in types:
            ranking_data = self.get_ranking(ranking_type, limit=10)
            result[name] = ranking_data.get('data', {})

        if user_id:
            user_rankings = {}
            for ranking_type, name in types:
                user_ranking = self.get_user_ranking(user_id, ranking_type)
                user_rankings[name] = user_ranking.get('data', {})
            result['my_rankings'] = user_rankings

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def delete_old_rankings(self, days: int = 30) -> Dict[str, Any]:
        count = self.ranking_model.delete_old_rankings(days)
        return {
            'code': 0,
            'msg': f'已删除{count}条过期排行榜数据',
            'data': {'deleted_count': count}
        }
