import json
from typing import Dict, Any
from app.model.heping_model import (
    HepingUserModel, GameRecordModel, GameStateModel, MapModel
)
from app.business.heping.achievement_business import AchievementBusiness


class GameBusiness:
    def __init__(self):
        self.user_model = HepingUserModel()
        self.game_record_model = GameRecordModel()
        self.game_state_model = GameStateModel()
        self.map_model = MapModel()
        self.achievement_business = AchievementBusiness()

    def start_game(self, user_id: int, map_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        map_data = self.map_model.get_by_id(map_id)
        if not map_data:
            return {
                'code': 1,
                'msg': '地图不存在',
                'data': None
            }

        if map_data.get('status') == 1:
            return {
                'code': 1,
                'msg': '该地图已禁用',
                'data': None
            }

        weapons_data = self._get_available_weapons()
        equipments_data = self._get_available_equipments()

        return {
            'code': 0,
            'msg': '游戏开始',
            'data': {
                'user_id': user_id,
                'map': map_data,
                'weapons': weapons_data,
                'equipments': equipments_data,
                'safe_zone': {
                    'center_x': map_data.get('width', 800) / 2,
                    'center_y': map_data.get('height', 600) / 2,
                    'radius': min(map_data.get('width', 800), map_data.get('height', 600)) / 2,
                    'speed': map_data.get('safe_zone_speed', 1.0)
                }
            }
        }

    def _get_available_weapons(self):
        try:
            from app.model.heping_model import WeaponModel
            weapon_model = WeaponModel()
            result = weapon_model.get_all(1, 100, None, None)
            return result.get('items', [])
        except Exception:
            return []

    def _get_available_equipments(self):
        try:
            from app.model.heping_model import EquipmentModel
            equipment_model = EquipmentModel()
            result = equipment_model.get_all(1, 100)
            return result.get('items', [])
        except Exception:
            return []

    def save_game_state(self, user_id: int, state_data: str) -> Dict[str, Any]:
        self.game_state_model.save_state(user_id, state_data)
        return {
            'code': 0,
            'msg': '保存成功',
            'data': None
        }

    def load_game_state(self, user_id: int) -> Dict[str, Any]:
        state = self.game_state_model.load_state(user_id)
        if state:
            return {
                'code': 0,
                'msg': 'success',
                'data': state
            }

        return {
            'code': 0,
            'msg': '无存档',
            'data': None
        }

    def end_game(self, user_id: int, map_id: int, rank: int, kills: int,
                 damage_dealt: float, damage_taken: float, survive_time: float,
                 weapons_used: str = '', items_collected: str = '',
                 is_win: bool = False) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        record_id = self.game_record_model.create(
            user_id=user_id, map_id=map_id, rank=rank, kills=kills,
            damage_dealt=damage_dealt, damage_taken=damage_taken,
            survive_time=survive_time, weapons_used=weapons_used,
            items_collected=items_collected, is_win=1 if is_win else 0
        )

        wins_delta = 1 if is_win else 0
        deaths_delta = 0 if is_win else 1
        self.user_model.update_stats(
            user_id=user_id,
            kills=kills,
            deaths=deaths_delta,
            wins=wins_delta,
            games_played=1
        )

        updated_user = self.user_model.get_by_id(user_id)
        total_kills = updated_user.get('kills', 0)
        total_wins = updated_user.get('wins', 0)
        total_games = updated_user.get('games_played', 0)

        unlock_result = self.achievement_business.check_and_unlock(user_id, 'kills', total_kills)
        self.achievement_business.check_and_unlock(user_id, 'wins', total_wins)
        self.achievement_business.check_and_unlock(user_id, 'games', total_games)
        self.achievement_business.check_and_unlock(user_id, 'survive_time', int(survive_time))

        self.game_state_model.delete_state(user_id)

        exp_gained = kills * 10 + (100 if is_win else 0) + (50 if rank <= 10 else 0)
        self._add_exp(user_id, exp_gained)

        return {
            'code': 0,
            'msg': '游戏结束',
            'data': {
                'record_id': record_id,
                'rank': rank,
                'kills': kills,
                'is_win': is_win,
                'exp_gained': exp_gained,
                'newly_unlocked_achievements': unlock_result.get('data', {}).get('newly_unlocked', []),
                'user': self.user_model.to_public_dict(self.user_model.get_by_id(user_id))
            }
        }

    def _add_exp(self, user_id: int, exp: int):
        user = self.user_model.get_by_id(user_id)
        if not user:
            return

        current_exp = user.get('exp', 0) + exp
        current_level = user.get('level', 1)

        exp_needed = current_level * 100
        while current_exp >= exp_needed:
            current_exp -= exp_needed
            current_level += 1
            exp_needed = current_level * 100

        from app.common.sqlite.orm_exec import ORMExec
        orm = ORMExec(HepingUserModel.TABLE_NAME)
        from datetime import datetime
        orm.update_by_id(user_id, {
            'exp': current_exp,
            'level': current_level,
            'updated_at': datetime.now().isoformat()
        })

    def get_game_records(self, user_id: int, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.game_record_model.get_by_user_id(user_id, page, page_size)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_leaderboard(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        db = self.user_model.db
        offset = (page - 1) * page_size
        count_sql = f"SELECT COUNT(*) as total FROM {HepingUserModel.TABLE_NAME} WHERE status = 0"
        total_result = db.fetch_one(count_sql)
        total = total_result['total'] if total_result else 0

        sql = f"""
            SELECT id, username, nickname, avatar, level, kills, deaths, wins, games_played,
                   CASE WHEN deaths > 0 THEN ROUND(CAST(kills AS FLOAT) / deaths, 2) ELSE kills END as kd_ratio,
                   CASE WHEN games_played > 0 THEN ROUND(CAST(wins AS FLOAT) / games_played * 100, 1) ELSE 0 END as win_rate
            FROM {HepingUserModel.TABLE_NAME}
            WHERE status = 0
            ORDER BY wins DESC, kills DESC
            LIMIT {page_size} OFFSET {offset}
        """
        items = db.fetch_all(sql)

        for i, item in enumerate(items):
            item['rank'] = offset + i + 1

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'items': items,
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size
            }
        }

    def get_user_stats(self, user_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        stats = self.game_record_model.get_stats_by_user(user_id)
        public_user = self.user_model.to_public_dict(user)

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'user': public_user,
                'game_stats': stats
            }
        }
