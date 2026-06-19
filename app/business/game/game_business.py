from typing import Dict, Any, List, Optional
from app.model.game import PlayerModel, GameSaveModel, CheckpointRecordModel, LeaderboardModel


class GameBusiness:
    def __init__(self):
        self.player_model = PlayerModel()
        self.game_save_model = GameSaveModel()
        self.checkpoint_model = CheckpointRecordModel()
        self.leaderboard_model = LeaderboardModel()

    def register_player(self, player_name: str) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }
        
        player_name = player_name.strip()
        
        if len(player_name) > 20:
            return {
                'code': 1,
                'message': 'Player name must be less than 20 characters',
                'data': None
            }
        
        player = self.player_model.get_or_create(player_name)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'id': player.get('id'),
                'player_name': player.get('player_name'),
                'total_kills': player.get('total_kills'),
                'total_play_time': player.get('total_play_time'),
                'best_clear_time': player.get('best_clear_time')
            }
        }

    def start_new_game(self, player_id: int) -> Dict[str, Any]:
        player = self.player_model.get_by_id(player_id)
        if not player:
            return {
                'code': 1,
                'message': 'Player not found',
                'data': None
            }
        
        self.game_save_model.deactivate_all(player_id)
        
        new_save_id = self.game_save_model.create(player_id)
        save = self.game_save_model.get_by_id(new_save_id)
        
        return {
            'code': 0,
            'message': 'New game started',
            'data': {
                'save_id': save.get('id'),
                'player_id': save.get('player_id'),
                'current_distance': save.get('current_distance'),
                'health': save.get('health'),
                'ammo': save.get('ammo'),
                'total_ammo': save.get('total_ammo'),
                'current_kills': save.get('current_kills'),
                'play_time': save.get('play_time')
            }
        }

    def get_active_save(self, player_id: int) -> Dict[str, Any]:
        save = self.game_save_model.get_active_save(player_id)
        
        if not save:
            return {
                'code': 1,
                'message': 'No active save found',
                'data': None
            }
        
        checkpoints = self.checkpoint_model.get_all_by_game_save(save['id'])
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'save_id': save.get('id'),
                'player_id': save.get('player_id'),
                'current_distance': save.get('current_distance'),
                'health': save.get('health'),
                'ammo': save.get('ammo'),
                'total_ammo': save.get('total_ammo'),
                'current_kills': save.get('current_kills'),
                'play_time': save.get('play_time'),
                'checkpoints': checkpoints
            }
        }

    def save_checkpoint(self, player_id: int, game_save_id: int, checkpoint_distance: int,
                        arrival_time: float, kills_at_checkpoint: int, health_at_checkpoint: int,
                        current_ammo: int, current_total_ammo: int) -> Dict[str, Any]:
        
        player = self.player_model.get_by_id(player_id)
        if not player:
            return {
                'code': 1,
                'message': 'Player not found',
                'data': None
            }
        
        save = self.game_save_model.get_by_id(game_save_id)
        if not save:
            return {
                'code': 1,
                'message': 'Game save not found',
                'data': None
            }
        
        if self.checkpoint_model.exists(player_id, game_save_id, checkpoint_distance):
            return {
                'code': 2,
                'message': 'Checkpoint already saved',
                'data': None
            }
        
        self.checkpoint_model.create(
            player_id, game_save_id, checkpoint_distance,
            arrival_time, kills_at_checkpoint, health_at_checkpoint
        )
        
        self.game_save_model.update_save(
            game_save_id,
            distance=checkpoint_distance,
            health=health_at_checkpoint,
            ammo=current_ammo,
            total_ammo=current_total_ammo,
            kills=kills_at_checkpoint,
            play_time=arrival_time
        )
        
        return {
            'code': 0,
            'message': 'Checkpoint saved successfully',
            'data': {
                'checkpoint_distance': checkpoint_distance,
                'arrival_time': arrival_time,
                'kills_at_checkpoint': kills_at_checkpoint,
                'health_at_checkpoint': health_at_checkpoint
            }
        }

    def update_game_state(self, game_save_id: int, distance: int, health: int, 
                          ammo: int, total_ammo: int, kills: int, play_time: float) -> Dict[str, Any]:
        save = self.game_save_model.get_by_id(game_save_id)
        if not save:
            return {
                'code': 1,
                'message': 'Game save not found',
                'data': None
            }
        
        affected = self.game_save_model.update_save(
            game_save_id,
            distance=distance,
            health=health,
            ammo=ammo,
            total_ammo=total_ammo,
            kills=kills,
            play_time=play_time
        )
        
        if affected > 0:
            return {
                'code': 0,
                'message': 'Game state updated',
                'data': None
            }
        
        return {
            'code': 1,
            'message': 'Failed to update game state',
            'data': None
        }

    def complete_game(self, player_id: int, game_save_id: int, total_time: float, total_kills: int) -> Dict[str, Any]:
        player = self.player_model.get_by_id(player_id)
        if not player:
            return {
                'code': 1,
                'message': 'Player not found',
                'data': None
            }
        
        self.leaderboard_model.create_or_update(
            player_id,
            player['player_name'],
            total_time,
            total_kills
        )
        
        self.player_model.update_best_clear_time(player_id, total_time)
        
        self.game_save_model.deactivate_all(player_id)
        
        rank_data = self.leaderboard_model.get_player_rank(player_id)
        
        return {
            'code': 0,
            'message': 'Game completed',
            'data': {
                'total_time': total_time,
                'total_kills': total_kills,
                'rank': rank_data.get('rank') if rank_data else None
            }
        }

    def get_leaderboard(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        result = self.leaderboard_model.paginate(page, page_size)
        
        items = []
        for idx, item in enumerate(result['items']):
            rank = (page - 1) * page_size + idx + 1
            items.append({
                'rank': rank,
                'player_name': item.get('player_name'),
                'total_time': item.get('total_time'),
                'total_kills': item.get('total_kills'),
                'updated_at': item.get('updated_at')
            })
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': items,
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def get_player_checkpoints(self, player_id: int) -> Dict[str, Any]:
        player = self.player_model.get_by_id(player_id)
        if not player:
            return {
                'code': 1,
                'message': 'Player not found',
                'data': None
            }
        
        checkpoints = self.checkpoint_model.get_all_by_player(player_id)
        
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'player_name': player.get('player_name'),
                'checkpoints': checkpoints
            }
        }
