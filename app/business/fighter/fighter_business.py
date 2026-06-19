from typing import Dict, Any, List
from app.model.fighter import BattleRecordModel, CharacterStatModel


class FighterBusiness:
    def __init__(self):
        self.battle_model = BattleRecordModel()
        self.stat_model = CharacterStatModel()

    def save_battle_result(self, player1_character: str, player2_character: str,
                           player1_wins: int, player2_wins: int, winner: str,
                           winner_character: str, total_rounds: int,
                           max_combo_p1: int = 0, max_combo_p2: int = 0) -> Dict[str, Any]:
        valid_chars = CharacterStatModel.CHARACTERS
        if player1_character not in valid_chars or player2_character not in valid_chars:
            return {
                'code': 1,
                'message': f'Invalid character. Valid characters: {valid_chars}',
                'data': None
            }

        if winner not in ['player1', 'player2']:
            return {
                'code': 1,
                'message': 'Invalid winner. Must be player1 or player2',
                'data': None
            }

        record_id = self.battle_model.create(
            player1_character=player1_character,
            player2_character=player2_character,
            player1_wins=player1_wins,
            player2_wins=player2_wins,
            winner=winner,
            winner_character=winner_character,
            total_rounds=total_rounds,
            max_combo_p1=max_combo_p1,
            max_combo_p2=max_combo_p2
        )

        self.stat_model.increment_usage(player1_character)
        self.stat_model.increment_usage(player2_character)
        self.stat_model.increment_win(winner_character)

        record = self.battle_model.get_by_id(record_id)
        return {
            'code': 0,
            'message': 'success',
            'data': record
        }

    def get_battle_records(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.battle_model.paginate(page, page_size)
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

    def get_character_statistics(self) -> Dict[str, Any]:
        stats = self.stat_model.get_statistics()
        total_battles = self.battle_model.get_total_battles()
        return {
            'code': 0,
            'message': 'success',
            'data': {
                'total_battles': total_battles,
                'characters': stats
            }
        }

    def get_available_characters(self) -> Dict[str, Any]:
        characters = [
            {
                'id': 'warrior',
                'name': '战士',
                'description': '攻守兼备的近战角色',
                'stats': {
                    'light_damage': 8,
                    'heavy_damage': 20,
                    'speed': 1.0
                }
            },
            {
                'id': 'ninja',
                'name': '忍者',
                'description': '速度快但伤害稍低',
                'stats': {
                    'light_damage': 7,
                    'heavy_damage': 18,
                    'speed': 1.2
                }
            },
            {
                'id': 'samurai',
                'name': '武士',
                'description': '伤害高但速度较慢',
                'stats': {
                    'light_damage': 9,
                    'heavy_damage': 22,
                    'speed': 0.9
                }
            }
        ]
        return {
            'code': 0,
            'message': 'success',
            'data': characters
        }
