from typing import Dict, Any, Optional
from app.model.ty_model import BattleModel, WeaponModel, UserModel
import random


class TyBattleBusiness:
    def __init__(self):
        self.battle_model = BattleModel()
        self.weapon_model = WeaponModel()
        self.user_model = UserModel()

    def create_pve_battle(self, user_id: int, weapon_id: int) -> Dict[str, Any]:
        user = self.user_model.get_by_id(user_id)
        if not user:
            return {
                'code': 1,
                'msg': '用户不存在',
                'data': None
            }

        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon or weapon.get('user_id') != user_id:
            return {
                'code': 1,
                'msg': '武器不存在或不属于当前用户',
                'data': None
            }

        if weapon.get('durability', 0) <= 0:
            return {
                'code': 1,
                'msg': '武器耐久度为0，请先维修',
                'data': None
            }

        enemy = self.battle_model.create_pve_enemy(user.get('level', 1))

        enemy_weapon_id = self.weapon_model.create(
            user_id=-1,
            name=enemy['weapon']['name'],
            doodle_data='{}',
            weapon_type='custom',
            attack=enemy['weapon']['attack'],
            defense=enemy['weapon']['defense'],
            speed=enemy['weapon']['speed']
        )

        battle_id = self.battle_model.create_battle(
            player1_id=user_id,
            player1_weapon_id=weapon_id,
            mode='pve',
            player2_id=-1,
            player2_weapon_id=enemy_weapon_id
        )

        if battle_id > 0:
            self.battle_model.start_battle(battle_id)
            battle = self.battle_model.get_by_id(battle_id)
            return {
                'code': 0,
                'msg': '战斗创建成功',
                'data': {
                    **self.battle_model.to_public_dict(battle),
                    'enemy': enemy
                }
            }

        return {
            'code': 1,
            'msg': '战斗创建失败',
            'data': None
        }

    def execute_round(self, battle_id: int, user_id: int) -> Dict[str, Any]:
        battle = self.battle_model.get_by_id(battle_id)
        if not battle:
            return {
                'code': 1,
                'msg': '战斗不存在',
                'data': None
            }

        if battle.get('player1_id') != user_id and battle.get('player2_id') != user_id:
            return {
                'code': 1,
                'msg': '无权参与该战斗',
                'data': None
            }

        if battle.get('status') != self.battle_model.STATUS_IN_PROGRESS:
            return {
                'code': 1,
                'msg': '战斗已结束或未开始',
                'data': None
            }

        result = self.battle_model.execute_round(battle_id)
        if result.get('success'):
            return {
                'code': 0,
                'msg': '回合执行成功',
                'data': result
            }

        return {
            'code': 1,
            'msg': result.get('msg', '回合执行失败'),
            'data': None
        }

    def get_battle_detail(self, battle_id: int, user_id: int) -> Dict[str, Any]:
        battle = self.battle_model.get_by_id(battle_id)
        if not battle:
            return {
                'code': 1,
                'msg': '战斗不存在',
                'data': None
            }

        if battle.get('player1_id') != user_id and battle.get('player2_id') != user_id:
            return {
                'code': 1,
                'msg': '无权查看该战斗',
                'data': None
            }

        player1 = self.user_model.get_by_id(battle.get('player1_id', 0))
        player2 = None
        if battle.get('player2_id') and battle.get('player2_id') > 0:
            player2 = self.user_model.get_by_id(battle.get('player2_id', 0))

        player1_weapon = self.weapon_model.get_by_id(battle.get('player1_weapon_id', 0))
        player2_weapon = self.weapon_model.get_by_id(battle.get('player2_weapon_id', 0))

        result = self.battle_model.to_public_dict(battle)
        result['player1'] = self.user_model.to_public_dict(player1) if player1 else None
        result['player2'] = self.user_model.to_public_dict(player2) if player2 else {
            'id': -1,
            'nickname': 'AI敌人',
            'level': 1
        }
        result['player1_weapon'] = self.weapon_model.to_public_dict(player1_weapon) if player1_weapon else None
        result['player2_weapon'] = self.weapon_model.to_public_dict(player2_weapon) if player2_weapon else None

        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def get_user_battles(self, user_id: int, page: int = 1, page_size: int = 10,
                         status: int = None, mode: str = None) -> Dict[str, Any]:
        result = self.battle_model.get_user_battles(user_id, page, page_size, status, mode)
        items = [self.battle_model.to_public_dict(item) for item in result.get('items', [])]

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

    def cancel_battle(self, battle_id: int, user_id: int) -> Dict[str, Any]:
        battle = self.battle_model.get_by_id(battle_id)
        if not battle:
            return {
                'code': 1,
                'msg': '战斗不存在',
                'data': None
            }

        if battle.get('player1_id') != user_id:
            return {
                'code': 1,
                'msg': '无权取消该战斗',
                'data': None
            }

        if self.battle_model.cancel_battle(battle_id):
            return {
                'code': 0,
                'msg': '战斗已取消',
                'data': None
            }

        return {
            'code': 1,
            'msg': '取消失败',
            'data': None
        }

    def auto_battle(self, battle_id: int, user_id: int) -> Dict[str, Any]:
        battle = self.battle_model.get_by_id(battle_id)
        if not battle:
            return {
                'code': 1,
                'msg': '战斗不存在',
                'data': None
            }

        if battle.get('player1_id') != user_id:
            return {
                'code': 1,
                'msg': '无权操作该战斗',
                'data': None
            }

        if battle.get('status') != self.battle_model.STATUS_IN_PROGRESS:
            return {
                'code': 1,
                'msg': '战斗已结束或未开始',
                'data': None
            }

        round_results = []
        max_rounds = 10
        current_rounds = battle.get('rounds', 0)

        for i in range(current_rounds, max_rounds):
            result = self.battle_model.execute_round(battle_id)
            round_results.append(result)
            if result.get('battle_complete'):
                break

        final_battle = self.battle_model.get_by_id(battle_id)

        return {
            'code': 0,
            'msg': '战斗完成',
            'data': {
                'battle': self.battle_model.to_public_dict(final_battle),
                'rounds': round_results
            }
        }
