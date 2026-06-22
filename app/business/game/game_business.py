from typing import Dict, Any, List
from app.model.game import PlayerProgressModel, BattleRecordModel


ACTION_UNLOCK_ORDER = ['light_attack', 'defend', 'heavy_attack', 'dodge', 'special_attack', 'combo', 'super_armor']


class GameBusiness:
    def __init__(self):
        self.progress_model = PlayerProgressModel()
        self.battle_model = BattleRecordModel()

    def get_player_progress(self, player_name: str = 'player') -> Dict[str, Any]:
        record = self.progress_model.get_or_create(player_name)
        unlocked_list = record.get('unlocked_actions', '').split(',') if record.get('unlocked_actions') else []
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': record.get('id'),
                'player_name': record.get('player_name'),
                'current_floor': record.get('current_floor'),
                'max_floor': record.get('max_floor'),
                'unlocked_actions': unlocked_list,
                'total_battles': record.get('total_battles'),
                'total_wins': record.get('total_wins'),
                'created_at': record.get('created_at'),
                'updated_at': record.get('updated_at')
            }
        }

    def record_battle_result(self, player_name: str, floor: int, result: str,
                             player_hp_remaining: int, enemy_hp_remaining: int,
                             battle_duration: int, actions_used: str = '') -> Dict[str, Any]:
        valid_results = ['win', 'lose', 'timeout']
        if result not in valid_results:
            return {
                'code': 1,
                'message': f'Invalid result: {result}',
                'data': None
            }
        
        if floor < 1 or floor > 10:
            return {
                'code': 1,
                'message': 'Floor must be between 1 and 10',
                'data': None
            }

        battle_id = self.battle_model.create(
            player_name=player_name,
            floor=floor,
            result=result,
            player_hp_remaining=player_hp_remaining,
            enemy_hp_remaining=enemy_hp_remaining,
            battle_duration=battle_duration,
            actions_used=actions_used
        )

        progress = self.progress_model.get_or_create(player_name)
        total_battles = progress.get('total_battles', 0) + 1
        total_wins = progress.get('total_wins', 0) + (1 if result == 'win' else 0)
        
        current_floor = progress.get('current_floor', 1)
        max_floor = progress.get('max_floor', 1)
        unlocked_actions = progress.get('unlocked_actions', 'light_attack,defend')
        
        if result == 'win' and floor == current_floor and floor < 10:
            current_floor = floor + 1
            if current_floor > max_floor:
                max_floor = current_floor
            
            unlocked_list = unlocked_actions.split(',') if unlocked_actions else []
            unlock_map = {
                1: 'heavy_attack',
                2: 'dodge',
                3: 'special_attack',
                4: 'combo',
                5: 'super_armor'
            }
            if floor in unlock_map and unlock_map[floor] not in unlocked_list:
                unlocked_list.append(unlock_map[floor])
                unlocked_actions = ','.join(unlocked_list)

        self.progress_model.update_progress(
            record_id=progress.get('id'),
            current_floor=current_floor,
            max_floor=max_floor,
            unlocked_actions=unlocked_actions,
            total_battles=total_battles,
            total_wins=total_wins
        )

        updated_progress = self.progress_model.get_by_id(progress.get('id'))
        unlocked_list = updated_progress.get('unlocked_actions', '').split(',') if updated_progress.get('unlocked_actions') else []
        new_unlock = None
        if result == 'win' and floor in unlock_map:
            new_unlock = unlock_map[floor]

        return {
            'code': 0,
            'message': 'Battle recorded',
            'data': {
                'battle_id': battle_id,
                'new_unlock': new_unlock,
                'progress': {
                    'current_floor': updated_progress.get('current_floor'),
                    'max_floor': updated_progress.get('max_floor'),
                    'unlocked_actions': unlocked_list,
                    'total_battles': updated_progress.get('total_battles'),
                    'total_wins': updated_progress.get('total_wins')
                }
            }
        }

    def get_battle_records(self, player_name: str = None, floor: int = None, limit: int = 50) -> Dict[str, Any]:
        if player_name:
            records = self.battle_model.get_by_player(player_name, limit)
        elif floor:
            records = self.battle_model.get_by_floor(floor, limit)
        else:
            records = self.battle_model.get_all(limit)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'records': records,
                'count': len(records)
            }
        }

    def reset_progress(self, player_name: str = 'player') -> Dict[str, Any]:
        progress = self.progress_model.get_by_player(player_name)
        if not progress:
            return {
                'code': 1,
                'message': 'Player not found',
                'data': None
            }
        
        self.progress_model.update_progress(
            record_id=progress.get('id'),
            current_floor=1,
            max_floor=1,
            unlocked_actions='light_attack,defend',
            total_battles=0,
            total_wins=0
        )

        return {
            'code': 0,
            'message': 'Progress reset',
            'data': None
        }
