from typing import Dict, Any, Optional
from app.model.wangzhe_model import RankingModel, UserModel, HeroModel


class WangzheRankingBusiness:
    def __init__(self):
        self.ranking_model = RankingModel()
        self.user_model = UserModel()
        self.hero_model = HeroModel()

    def get_ranking_list(self, ranking_type: str = 'all', page: int = 1, 
                         page_size: int = 100) -> Dict[str, Any]:
        result = self.ranking_model.get_ranking(ranking_type, page, page_size)
        items = [self.ranking_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_user_ranking(self, user_id: int, ranking_type: str = 'all') -> Dict[str, Any]:
        rank_position = self.ranking_model.get_user_rank_position(user_id, ranking_type)
        rank_record = self.ranking_model.get_by_user_and_type(user_id, ranking_type)
        
        if not rank_record:
            self.ranking_model.create(user_id, ranking_type)
            rank_record = self.ranking_model.get_by_user_and_type(user_id, ranking_type)

        if rank_record:
            rank_dict = self.ranking_model.to_public_dict(rank_record)
            rank_dict['rank'] = rank_position
            return {
                'code': 0,
                'msg': 'success',
                'data': rank_dict
            }

        return {
            'code': 1,
            'msg': '获取排名信息失败',
            'data': None
        }

    def get_all_tiers(self) -> Dict[str, Any]:
        tiers = [
            {'name': '青铜', 'min': 0, 'max': 999, 'color': '#CD7F32'},
            {'name': '白银', 'min': 1000, 'max': 1249, 'color': '#C0C0C0'},
            {'name': '黄金', 'min': 1250, 'max': 1499, 'color': '#FFD700'},
            {'name': '铂金', 'min': 1500, 'max': 1749, 'color': '#00BFFF'},
            {'name': '钻石', 'min': 1750, 'max': 1999, 'color': '#B9F2FF'},
            {'name': '星耀', 'min': 2000, 'max': 2499, 'color': '#9400D3'},
            {'name': '王者', 'min': 2500, 'max': 2999, 'color': '#FF4500'},
            {'name': '荣耀王者', 'min': 3000, 'max': 9999, 'color': '#FF0000'},
        ]

        return {
            'code': 0,
            'msg': 'success',
            'data': tiers
        }
