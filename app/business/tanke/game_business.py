from typing import Dict, Any, List, Optional
from app.model.tanke import TankeGameRecordModel, TankeUserModel, TankeTankModel


class TankeGameBusiness:
    ENEMY_SCORE_MAP = {
        'light': 10,
        'medium': 20,
        'heavy': 30,
        'helicopter': 25,
        'suicide': 15,
        'boss': 100
    }

    ENEMY_EXP_MAP = {
        'light': 10,
        'medium': 20,
        'heavy': 30,
        'helicopter': 25,
        'suicide': 15,
        'boss': 100
    }

    def __init__(self):
        self.game_record_model = TankeGameRecordModel()
        self.user_model = TankeUserModel()
        self.tank_model = TankeTankModel()

    def save_game_result(self, user_id: int, wave: int, score: int, killed: int) -> Dict[str, Any]:
        if wave < 1:
            wave = 1
        if score < 0:
            score = 0
        if killed < 0:
            killed = 0

        record_id = self.game_record_model.create(user_id, wave, score, killed)

        if record_id > 0:
            self.user_model.update_stats(user_id, score, killed, wave)

            record = self.game_record_model.get_by_id(record_id)
            return {
                'code': 0,
                'msg': '游戏记录已保存',
                'data': self.game_record_model.to_public_dict(record)
            }

        return {
            'code': 1,
            'msg': '保存失败',
            'data': None
        }

    def get_user_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.get_by_user_id(user_id, page, page_size)
        items = [self.game_record_model.to_public_dict(item) for item in result.get('items', [])]

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

    def get_user_high_score(self, user_id: int) -> Dict[str, Any]:
        record = self.game_record_model.get_user_high_score(user_id)
        if record:
            return {
                'code': 0,
                'msg': 'success',
                'data': self.game_record_model.to_public_dict(record)
            }

        return {
            'code': 0,
            'msg': '暂无记录',
            'data': None
        }

    def get_leaderboard(self, limit: int = 10) -> Dict[str, Any]:
        records = self.game_record_model.get_leaderboard(limit)
        result = []
        for idx, record in enumerate(records):
            result.append({
                'rank': idx + 1,
                'nickname': record.get('nickname', '匿名'),
                'score': record.get('score', 0),
                'wave': record.get('wave', 0),
                'killed': record.get('killed', 0),
                'played_at': record.get('played_at')
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def calculate_enemy_score(self, enemy_type: str) -> int:
        return self.ENEMY_SCORE_MAP.get(enemy_type, 0)

    def calculate_enemy_exp(self, enemy_type: str) -> int:
        return self.ENEMY_EXP_MAP.get(enemy_type, 0)

    def calculate_wave_bonus(self, wave: int) -> int:
        return 50 * wave

    def calculate_total_exp_for_game(self, killed_enemies: List[str], wave: int) -> int:
        total_exp = 0
        for enemy_type in killed_enemies:
            total_exp += self.calculate_enemy_exp(enemy_type)

        total_exp += self.calculate_wave_bonus(wave) // 2

        return total_exp
