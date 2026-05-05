from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DotaUserEquipmentModel:
    TABLE_NAME = 'tb_dota_user_equipment'

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                equipment_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                level INTEGER DEFAULT 1,
                is_equipped INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, equipment_id)
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_equipment_id ON {cls.TABLE_NAME}(equipment_id)"
        db.execute(index_sql2)

    def create(self, user_id: int, equipment_id: int, quantity: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'equipment_id': equipment_id,
            'quantity': quantity,
            'level': 1,
            'is_equipped': 0,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_user_equipment(self, user_id: int, equipment_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id, 'equipment_id': equipment_id})

    def get_by_user(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id}, order_by='is_equipped DESC, id ASC')

    def get_equipped(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_equipped': 1}, order_by='id ASC')

    def add_or_update(self, user_id: int, equipment_id: int, quantity: int = 1) -> int:
        existing = self.get_by_user_equipment(user_id, equipment_id)
        if existing:
            new_quantity = existing.get('quantity', 0) + quantity
            now = datetime.now().isoformat()
            return self.exec.update_by_condition(
                {'user_id': user_id, 'equipment_id': equipment_id},
                {'quantity': new_quantity, 'updated_at': now}
            )
        else:
            return self.create(user_id, equipment_id, quantity)

    def equip(self, user_id: int, equipment_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_condition(
            {'user_id': user_id, 'equipment_id': equipment_id},
            {'is_equipped': 1, 'updated_at': now}
        )

    def unequip(self, user_id: int, equipment_id: int) -> int:
        now = datetime.now().isoformat()
        return self.exec.update_by_condition(
            {'user_id': user_id, 'equipment_id': equipment_id},
            {'is_equipped': 0, 'updated_at': now}
        )

    def remove_quantity(self, user_id: int, equipment_id: int, quantity: int = 1) -> int:
        existing = self.get_by_user_equipment(user_id, equipment_id)
        if not existing:
            return 0

        new_quantity = existing.get('quantity', 0) - quantity
        if new_quantity <= 0:
            return self.exec.delete_by_condition({'user_id': user_id, 'equipment_id': equipment_id})
        else:
            now = datetime.now().isoformat()
            return self.exec.update_by_condition(
                {'user_id': user_id, 'equipment_id': equipment_id},
                {'quantity': new_quantity, 'updated_at': now}
            )

    def get_total_bonuses(self, user_id: int) -> Dict[str, int]:
        from app.model.dota.equipment import DotaEquipmentModel
        equipped = self.get_equipped(user_id)
        equipment_model = DotaEquipmentModel()

        total_attack = 0
        total_hp = 0
        total_defense = 0
        total_attack_speed = 0
        special_effects = []

        for ue in equipped:
            equipment = equipment_model.get_by_id(ue.get('equipment_id'))
            if equipment:
                total_attack += equipment.get('attack_bonus', 0)
                total_hp += equipment.get('hp_bonus', 0)
                total_defense += equipment.get('defense_bonus', 0)
                total_attack_speed += equipment.get('attack_speed_bonus', 0)
                if equipment.get('special_effect'):
                    special_effects.append(equipment.get('special_effect'))

        return {
            'attack_bonus': total_attack,
            'hp_bonus': total_hp,
            'defense_bonus': total_defense,
            'attack_speed_bonus': total_attack_speed,
            'special_effects': special_effects
        }

    def to_dict(self, user_equipment: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': user_equipment.get('id'),
            'user_id': user_equipment.get('user_id'),
            'equipment_id': user_equipment.get('equipment_id'),
            'quantity': user_equipment.get('quantity'),
            'level': user_equipment.get('level'),
            'is_equipped': user_equipment.get('is_equipped')
        }
