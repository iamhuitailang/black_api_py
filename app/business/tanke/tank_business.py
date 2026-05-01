from typing import Dict, Any, List, Optional
from app.model.tanke import TankeTankModel


class TankeTankBusiness:
    def __init__(self):
        self.tank_model = TankeTankModel()

    def get_tank_by_user_id(self, user_id: int) -> Dict[str, Any]:
        tank = self.tank_model.get_or_create_for_user(user_id)
        if not tank:
            return {
                'code': 1,
                'msg': '坦克信息不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': self.tank_model.to_public_dict(tank)
        }

    def add_exp(self, user_id: int, exp: int) -> Dict[str, Any]:
        if exp <= 0:
            return {
                'code': 1,
                'msg': '经验值必须大于0',
                'data': None
            }

        result = self.tank_model.add_exp(user_id, exp)

        if result.get('level_up'):
            tank = self.tank_model.get_by_user_id(user_id)
            return {
                'code': 0,
                'msg': f'恭喜升级！达到 {result.get("new_level")} 级',
                'data': {
                    'level_up': True,
                    'new_level': result.get('new_level'),
                    'exp': result.get('exp'),
                    'tank': self.tank_model.to_public_dict(tank) if tank else None
                }
            }

        return {
            'code': 0,
            'msg': '经验值已增加',
            'data': {
                'level_up': False,
                'exp': result.get('exp')
            }
        }

    def update_skin(self, user_id: int, skin_id: int) -> Dict[str, Any]:
        if skin_id not in TankeTankModel.SKIN_INFO:
            return {
                'code': 1,
                'msg': '无效的外观ID',
                'data': None
            }

        tank = self.tank_model.get_by_user_id(user_id)
        if not tank:
            return {
                'code': 1,
                'msg': '坦克信息不存在',
                'data': None
            }

        skin_info = TankeTankModel.SKIN_INFO.get(skin_id)
        current_level = tank.get('level', 1)

        if skin_info.get('min_level', 1) > current_level:
            return {
                'code': 1,
                'msg': f'需要达到 {skin_info.get("min_level")} 级才能解锁此外观',
                'data': None
            }

        affected = self.tank_model.update_skin(user_id, skin_id)
        if affected > 0:
            updated_tank = self.tank_model.get_by_user_id(user_id)
            return {
                'code': 0,
                'msg': '外观更新成功',
                'data': self.tank_model.to_public_dict(updated_tank)
            }

        return {
            'code': 1,
            'msg': '外观更新失败',
            'data': None
        }

    def get_all_skins(self, user_id: int) -> Dict[str, Any]:
        tank = self.tank_model.get_by_user_id(user_id)
        if not tank:
            return {
                'code': 1,
                'msg': '坦克信息不存在',
                'data': None
            }

        current_level = tank.get('level', 1)
        skins = []

        for skin_id, skin_info in TankeTankModel.SKIN_INFO.items():
            skins.append({
                'skin_id': skin_id,
                'name': skin_info.get('name'),
                'min_level': skin_info.get('min_level'),
                'color': skin_info.get('color'),
                'barrels': skin_info.get('barrels'),
                'has_armor': skin_info.get('armor', False),
                'has_laser': skin_info.get('laser', False),
                'is_unlocked': skin_info.get('min_level', 1) <= current_level
            })

        return {
            'code': 0,
            'msg': 'success',
            'data': {
                'current_level': current_level,
                'current_skin_id': tank.get('skin_id', 1),
                'skins': skins
            }
        }
