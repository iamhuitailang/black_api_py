from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UserEquipmentModel:
    TABLE_NAME = 'tb_hd_model_user_equipment'

    SLOT_WEAPON = 1
    SLOT_ARMOR = 2
    SLOT_ACCESSORY = 3

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
                level INTEGER DEFAULT 1,
                is_equipped INTEGER DEFAULT 0,
                slot INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_equipment_id ON {cls.TABLE_NAME}(equipment_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_slot ON {cls.TABLE_NAME}(user_id, slot)"
        db.execute(index_sql)

    def create(self, user_id: int, equipment_id: int, slot: int, level: int = 1,
               is_equipped: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'equipment_id': equipment_id,
            'level': level,
            'is_equipped': is_equipped,
            'slot': slot,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_user_equipments(self, user_id: int, is_equipped: int = None) -> List[Dict[str, Any]]:
        conditions = {'user_id': user_id}
        if is_equipped is not None:
            conditions['is_equipped'] = is_equipped
        return self.query.find_all(conditions, order_by='is_equipped DESC, slot ASC, level DESC')

    def get_equipped_by_slot(self, user_id: int, slot: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({
            'user_id': user_id,
            'slot': slot,
            'is_equipped': 1
        })

    def get_all(self, page: int = 1, page_size: int = 10, user_id: int = None,
                is_equipped: int = None) -> Dict[str, Any]:
        conditions = {}
        if user_id is not None:
            conditions['user_id'] = user_id
        if is_equipped is not None:
            conditions['is_equipped'] = is_equipped
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, level: int = None, is_equipped: int = None,
               slot: int = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        if level is not None:
            data['level'] = level
        if is_equipped is not None:
            data['is_equipped'] = is_equipped
        if slot is not None:
            data['slot'] = slot
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def equip(self, user_id: int, user_equipment_id: int) -> bool:
        user_eq = self.get_by_id(user_equipment_id)
        if not user_eq or user_eq.get('user_id') != user_id:
            return False

        slot = user_eq.get('slot')
        now = datetime.now().isoformat()

        with self.exec.transaction():
            self.exec.update(
                {'is_equipped': 0, 'updated_at': now},
                {'user_id': user_id, 'slot': slot, 'is_equipped': 1}
            )
            self.exec.update_by_id(user_equipment_id, {'is_equipped': 1, 'updated_at': now})

        return True

    def unequip(self, user_id: int, user_equipment_id: int) -> bool:
        user_eq = self.get_by_id(user_equipment_id)
        if not user_eq or user_eq.get('user_id') != user_id:
            return False
        if user_eq.get('is_equipped') != 1:
            return False

        now = datetime.now().isoformat()
        self.exec.update_by_id(user_equipment_id, {'is_equipped': 0, 'updated_at': now})
        return True

    def upgrade_equipment(self, user_id: int, user_equipment_id: int) -> Optional[Dict[str, Any]]:
        user_eq = self.get_by_id(user_equipment_id)
        if not user_eq or user_eq.get('user_id') != user_id:
            return None

        current_level = user_eq.get('level', 1)
        new_level = current_level + 1
        now = datetime.now().isoformat()

        self.exec.update_by_id(user_equipment_id, {'level': new_level, 'updated_at': now})
        return self.get_by_id(user_equipment_id)

    def get_slot_text(self, slot: int) -> str:
        slot_map = {
            self.SLOT_WEAPON: '武器',
            self.SLOT_ARMOR: '防具',
            self.SLOT_ACCESSORY: '饰品'
        }
        return slot_map.get(slot, '未知')
