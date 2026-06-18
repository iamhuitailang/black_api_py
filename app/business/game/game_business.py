from typing import Dict, Any, List, Optional
from app.model.game import GameStateModel


class GameStateBusiness:
    def __init__(self):
        self.model = GameStateModel()

    def get_game_state(self, record_id: int = None, player_name: str = None) -> Dict[str, Any]:
        record = None
        
        if record_id:
            record = self.model.get_by_id(record_id)
        elif player_name:
            record = self.model.get_by_player_name(player_name)
        else:
            record = self.model.get_latest()
        
        if record:
            return {
                'code': 0,
                'message': 'success',
                'data': {
                    'id': record.get('id'),
                    'player_name': record.get('player_name'),
                    'game_data': record.get('game_data'),
                    'created_at': record.get('created_at'),
                    'updated_at': record.get('updated_at')
                }
            }
        
        return {
            'code': 0,
            'message': 'no save found',
            'data': None
        }

    def get_all_saves(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.model.paginate(page, page_size)
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'items': [
                    {
                        'id': item.get('id'),
                        'player_name': item.get('player_name'),
                        'game_data': item.get('game_data'),
                        'created_at': item.get('created_at'),
                        'updated_at': item.get('updated_at')
                    }
                    for item in result['items']
                ],
                'total': result['total'],
                'page': result['page'],
                'page_size': result['page_size'],
                'total_pages': result['total_pages']
            }
        }

    def save_game(self, player_name: str, game_data: Dict[str, Any], record_id: int = None) -> Dict[str, Any]:
        if not player_name or not player_name.strip():
            return {
                'code': 1,
                'message': 'Player name cannot be empty',
                'data': None
            }
        
        if not game_data:
            return {
                'code': 1,
                'message': 'Game data cannot be empty',
                'data': None
            }
        
        player_name = player_name.strip()
        
        if record_id:
            existing = self.model.get_by_id(record_id)
            if not existing:
                return {
                    'code': 1,
                    'message': f'Record with id {record_id} not found',
                    'data': None
                }
            affected = self.model.update(record_id, game_data)
            if affected > 0:
                record = self.model.get_by_id(record_id)
                return {
                    'code': 0,
                    'message': 'save success',
                    'data': {
                        'id': record.get('id'),
                        'player_name': record.get('player_name'),
                        'game_data': record.get('game_data'),
                        'created_at': record.get('created_at'),
                        'updated_at': record.get('updated_at')
                    }
                }
            return {
                'code': 1,
                'message': 'save failed',
                'data': None
            }
        else:
            existing = self.model.get_by_player_name(player_name)
            if existing:
                affected = self.model.update(existing['id'], game_data)
                if affected > 0:
                    record = self.model.get_by_id(existing['id'])
                    return {
                        'code': 0,
                        'message': 'save success',
                        'data': {
                            'id': record.get('id'),
                            'player_name': record.get('player_name'),
                            'game_data': record.get('game_data'),
                            'created_at': record.get('created_at'),
                            'updated_at': record.get('updated_at')
                        }
                    }
                return {
                    'code': 1,
                    'message': 'save failed',
                    'data': None
                }
            
            new_id = self.model.create(player_name, game_data)
            record = self.model.get_by_id(new_id)
            return {
                'code': 0,
                'message': 'save success',
                'data': {
                    'id': record.get('id'),
                    'player_name': record.get('player_name'),
                    'game_data': record.get('game_data'),
                    'created_at': record.get('created_at'),
                    'updated_at': record.get('updated_at')
                }
            }

    def delete_save(self, record_id: int) -> Dict[str, Any]:
        if not record_id:
            return {
                'code': 1,
                'message': 'Record id is required',
                'data': None
            }
        
        existing = self.model.get_by_id(record_id)
        if not existing:
            return {
                'code': 1,
                'message': f'Record with id {record_id} not found',
                'data': None
            }
        
        affected = self.model.delete(record_id)
        if affected > 0:
            return {
                'code': 0,
                'message': 'delete success',
                'data': None
            }
        
        return {
            'code': 1,
            'message': 'delete failed',
            'data': None
        }
