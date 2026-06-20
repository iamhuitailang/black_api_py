from typing import Dict, Any, List, Optional
from app.model.swordsman import PlayerModel, EquipmentModel, LeaderboardModel


class SwordsmanBusiness:
    def __init__(self):
        self.player_model = PlayerModel()
        self.equipment_model = EquipmentModel()
        self.leaderboard_model = LeaderboardModel()

    def create_or_get_player(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': '玩家名不能为空',
                'data': None
            }

        player_name = player_name.strip()
        player = self.player_model.get_by_name(player_name)

        if player:
            return {
                'code': 0,
                'message': 'success',
                'data': player
            }

        new_id = self.player_model.create(player_name)
        player = self.player_model.get_by_id(new_id)
        return {
            'code': 0,
            'message': '创建成功',
            'data': player
        }

    def save_player_progress(self, player_name: str, strength: int, agility: int, will: int,
                             soul_stones: int, current_area: int, equipment: List[str],
                             total_kills: int, current_wave: int = 0, hp: int = 100,
                             areas_cleared: int = 0) -> Dict[str, Any]:
        player = self.player_model.get_by_name(player_name)
        if not player:
            return {
                'code': 1,
                'message': '玩家不存在',
                'data': None
            }

        self.player_model.update_player(
            player['id'],
            strength=strength,
            agility=agility,
            will=will,
            soul_stones=soul_stones,
            current_area=current_area,
            current_wave=current_wave,
            hp=hp,
            areas_cleared=areas_cleared,
            equipment=equipment,
            total_kills=total_kills
        )

        updated = self.player_model.get_by_id(player['id'])
        return {
            'code': 0,
            'message': '保存成功',
            'data': updated
        }

    def get_equipment_list(self) -> Dict[str, Any]:
        equipment = self.equipment_model.get_all()
        return {
            'code': 0,
            'message': 'success',
            'data': equipment
        }

    def get_equipment_by_area(self, area: int) -> Dict[str, Any]:
        equipment = self.equipment_model.get_by_area(area)
        if not equipment:
            return {
                'code': 1,
                'message': '该区域装备不存在',
                'data': None
            }
        return {
            'code': 0,
            'message': 'success',
            'data': equipment
        }

    def submit_score(self, player_name: str, kills: int, areas_cleared: int, remaining_hp: int) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': '玩家名不能为空',
                'data': None
            }

        player_name = player_name.strip()
        score = kills * 10 + areas_cleared * 50 + remaining_hp * 2

        record_id = self.leaderboard_model.create(
            player_name=player_name,
            score=score,
            kills=kills,
            areas_cleared=areas_cleared,
            remaining_hp=remaining_hp
        )

        rank = self.leaderboard_model.get_rank(score)
        player_best = self.leaderboard_model.get_player_best(player_name)

        return {
            'code': 0,
            'message': '提交成功',
            'data': {
                'id': record_id,
                'score': score,
                'kills': kills,
                'areas_cleared': areas_cleared,
                'remaining_hp': remaining_hp,
                'current_rank': rank,
                'best_score': player_best['score'] if player_best else score
            }
        }

    def get_leaderboard(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.leaderboard_model.paginate(page, page_size)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': result['items'],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def get_top_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        items = self.leaderboard_model.get_top(limit)
        return {
            'code': 0,
            'message': 'success',
            'data': items
        }
