from typing import Dict, Any
from app.model.game import UpgradeModel


class UpgradeBusiness:
    def __init__(self):
        self.model = UpgradeModel()

    def get_upgrades(self) -> Dict[str, Any]:
        upgrades = self.model.get_all()

        result = []
        for upgrade in upgrades:
            result.append({
                'id': upgrade.get('id'),
                'tower_type': upgrade.get('tower_type'),
                'level': upgrade.get('level'),
                'cost': upgrade.get('cost'),
                'damage': upgrade.get('damage'),
                'range': upgrade.get('range'),
                'attack_speed': upgrade.get('attack_speed'),
                'special_value': upgrade.get('special_value')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }

    def get_upgrades_by_type(self, tower_type: str) -> Dict[str, Any]:
        if not tower_type:
            return {
                'code': 1,
                'message': 'tower_type is required',
                'data': None
            }

        upgrades = self.model.get_by_tower_type(tower_type)

        result = []
        for upgrade in upgrades:
            result.append({
                'id': upgrade.get('id'),
                'tower_type': upgrade.get('tower_type'),
                'level': upgrade.get('level'),
                'cost': upgrade.get('cost'),
                'damage': upgrade.get('damage'),
                'range': upgrade.get('range'),
                'attack_speed': upgrade.get('attack_speed'),
                'special_value': upgrade.get('special_value')
            })

        return {
            'code': 0,
            'message': 'success',
            'data': result
        }
