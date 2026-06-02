from typing import Dict, Any
from app.model.dafuweng import UserModel, GameModel, GamePlayerModel, PlayerLandModel


class RankBusiness:
    def __init__(self):
        self.user_model = UserModel()
        self.game_model = GameModel()
        self.game_player_model = GamePlayerModel()
        self.player_land_model = PlayerLandModel()

    def get_rank_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]
        items.sort(key=lambda x: x.get('coins', 0), reverse=True)

        for idx, item in enumerate(items):
            item['rank'] = (page - 1) * page_size + idx + 1

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

    def get_win_rank_list(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.user_model.get_all(page, page_size)
        items = [self.user_model.to_public_dict(item) for item in result.get('items', [])]
        items.sort(key=lambda x: x.get('wins', 0), reverse=True)

        for idx, item in enumerate(items):
            item['rank'] = (page - 1) * page_size + idx + 1

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

    def get_game_rank_list(self, game_id: int) -> Dict[str, Any]:
        game = self.game_model.get_by_id(game_id)
        if not game:
            return {
                'code': 1,
                'msg': '游戏不存在',
                'data': None
            }

        players = self.game_player_model.get_by_game_id(game_id)
        rankings = []

        for p in players:
            user = self.user_model.get_by_id(p.get('user_id'))
            lands = self.player_land_model.get_by_game_and_user(game_id, p.get('user_id'))
            land_value = 0
            for land in lands:
                from app.model.dafuweng import MapCellModel
                cell_model = MapCellModel()
                cell = cell_model.get_by_id(land.get('cell_id'))
                if cell:
                    land_value += cell.get('base_price', 0) * land.get('level', 1)

            total_score = p.get('money', 0) + land_value
            rankings.append({
                'user_id': p.get('user_id'),
                'nickname': user.get('nickname', '') if user else '',
                'money': p.get('money', 0),
                'land_count': len(lands),
                'land_value': land_value,
                'total_score': total_score,
                'is_bankrupt': p.get('is_bankrupt', 0)
            })

        rankings.sort(key=lambda x: x.get('total_score', 0), reverse=True)

        for idx, item in enumerate(rankings):
            item['rank'] = idx + 1

        return {
            'code': 0,
            'msg': 'success',
            'data': rankings
        }
