from typing import Dict, Any, List, Optional
from app.model.shieldgame import GameRecordModel, ShieldStatsModel


class ShieldGameBusiness:
    def __init__(self):
        self.game_record_model = GameRecordModel()
        self.shield_stats_model = ShieldStatsModel()

    def submit_game_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        player_name = data.get('player_name', 'Player')
        level = data.get('level', 1)
        cleared = data.get('cleared', 0)
        final_hp = data.get('final_hp', 0)
        final_shield_durability = data.get('final_shield_durability', 0)
        shield_broken = data.get('shield_broken', 0)
        total_damage_dealt = data.get('total_damage_dealt', 0)
        total_damage_taken = data.get('total_damage_taken', 0)
        play_time_seconds = data.get('play_time_seconds', 0)

        if not level or level < 1 or level > 8:
            return {
                'code': 1,
                'message': 'Invalid level. Must be 1-8',
                'data': None
            }

        record_data = {
            'player_name': player_name,
            'level': level,
            'cleared': 1 if cleared else 0,
            'final_hp': final_hp,
            'final_shield_durability': final_shield_durability,
            'shield_broken': 1 if shield_broken else 0,
            'total_damage_dealt': total_damage_dealt,
            'total_damage_taken': total_damage_taken,
            'play_time_seconds': play_time_seconds
        }

        record_id = self.game_record_model.create(record_data)

        shield_stats_data = {
            'record_id': record_id,
            'level': level,
            'player_name': player_name,
            'shield_bash_count': data.get('shield_bash_count', 0),
            'shield_smash_count': data.get('shield_smash_count', 0),
            'shield_block_count': data.get('shield_block_count', 0),
            'total_damage_blocked': data.get('total_damage_blocked', 0),
            'shield_durability_lost': data.get('shield_durability_lost', 0),
            'repaired_times': data.get('repaired_times', 0),
            'repaired_amount': data.get('repaired_amount', 0),
            'shield_broken': 1 if shield_broken else 0
        }
        self.shield_stats_model.create(shield_stats_data)

        record = self.game_record_model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def get_player_records(self, player_name: str) -> Dict[str, Any]:
        if not player_name:
            return {
                'code': 1,
                'message': 'Player name is required',
                'data': None
            }

        records = self.game_record_model.get_by_player(player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'records': records,
                'total': len(records)
            }
        }

    def get_cleared_levels(self, player_name: str) -> Dict[str, Any]:
        if not player_name:
            return {
                'code': 1,
                'message': 'Player name is required',
                'data': None
            }

        levels = self.game_record_model.get_cleared_levels(player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'player_name': player_name,
                'cleared_levels': levels,
                'max_cleared_level': max(levels) if levels else 0
            }
        }

    def get_player_shield_stats(self, player_name: str) -> Dict[str, Any]:
        if not player_name:
            return {
                'code': 1,
                'message': 'Player name is required',
                'data': None
            }

        summary = self.shield_stats_model.get_player_summary(player_name)
        return {
            'code': 0,
            'message': 'success',
            'data': summary
        }

    def get_level_leaderboard(self, level: int, limit: int = 10) -> Dict[str, Any]:
        if not level or level < 1 or level > 8:
            return {
                'code': 1,
                'message': 'Invalid level. Must be 1-8',
                'data': None
            }

        best = self.game_record_model.get_best_by_level(level)
        level_records = self.game_record_model.query.find_all(
            conditions={'level': level, 'cleared': 1},
            order_by='play_time_seconds ASC',
            limit=limit
        )

        return {
            'code': 0,
            'message': 'success',
            'data': {
                'level': level,
                'best_record': best,
                'leaderboard': level_records
            }
        }

    def get_all_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.paginate(page, page_size)
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
