from typing import Dict, Any
from app.model.heping_model import WeaponModel


class WeaponBusiness:
    def __init__(self):
        self.weapon_model = WeaponModel()

    def create_weapon(self, name: str, type: str, damage: float, fire_rate: float,
                      range: float, accuracy: float, ammo_capacity: int,
                      rarity: str, description: str = '', icon: str = '') -> Dict[str, Any]:
        if not name:
            return {
                'code': 1,
                'msg': '武器名称不能为空',
                'data': None
            }

        valid_types = ['pistol', 'rifle', 'sniper', 'shotgun', 'smg']
        if type not in valid_types:
            return {
                'code': 1,
                'msg': f'武器类型无效，可选: {", ".join(valid_types)}',
                'data': None
            }

        valid_rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary']
        if rarity not in valid_rarities:
            return {
                'code': 1,
                'msg': f'稀有度无效，可选: {", ".join(valid_rarities)}',
                'data': None
            }

        weapon_id = self.weapon_model.create(
            name=name, type=type, damage=damage, fire_rate=fire_rate,
            range=range, accuracy=accuracy, ammo_capacity=ammo_capacity,
            rarity=rarity, description=description, icon=icon
        )

        if weapon_id > 0:
            weapon = self.weapon_model.get_by_id(weapon_id)
            return {
                'code': 0,
                'msg': '创建成功',
                'data': weapon
            }

        return {
            'code': 1,
            'msg': '创建失败',
            'data': None
        }

    def get_weapon(self, weapon_id: int) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        return {
            'code': 0,
            'msg': 'success',
            'data': weapon
        }

    def get_weapon_list(self, page: int = 1, page_size: int = 10,
                        type: str = None, rarity: str = None) -> Dict[str, Any]:
        result = self.weapon_model.get_all(page, page_size, type, rarity)
        return {
            'code': 0,
            'msg': 'success',
            'data': result
        }

    def update_weapon(self, weapon_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        update_data = {k: v for k, v in data.items() if k in [
            'name', 'type', 'damage', 'fire_rate', 'range', 'accuracy',
            'ammo_capacity', 'rarity', 'description', 'icon', 'status'
        ]}

        if not update_data:
            return {
                'code': 1,
                'msg': '没有可更新的字段',
                'data': None
            }

        affected = self.weapon_model.update(weapon_id, **update_data)
        if affected >= 0:
            updated_weapon = self.weapon_model.get_by_id(weapon_id)
            return {
                'code': 0,
                'msg': '更新成功',
                'data': updated_weapon
            }

        return {
            'code': 1,
            'msg': '更新失败',
            'data': None
        }

    def delete_weapon(self, weapon_id: int) -> Dict[str, Any]:
        weapon = self.weapon_model.get_by_id(weapon_id)
        if not weapon:
            return {
                'code': 1,
                'msg': '武器不存在',
                'data': None
            }

        affected = self.weapon_model.delete(weapon_id)
        if affected > 0:
            return {
                'code': 0,
                'msg': '删除成功',
                'data': None
            }

        return {
            'code': 1,
            'msg': '删除失败',
            'data': None
        }
