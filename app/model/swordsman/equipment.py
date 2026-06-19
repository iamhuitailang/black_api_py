from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class EquipmentModel:
    TABLE_NAME = 'swordsman_equipment'

    DEFAULT_EQUIPMENT = [
        {'id': 'bamboo_boots', 'name': '疾风靴', 'area': 0, 'stat': 'agility', 'value': 5, 'desc': '敏捷+5'},
        {'id': 'stone_armor', 'name': '磐石甲', 'area': 1, 'stat': 'will', 'value': 8, 'desc': '意志+8'},
        {'id': 'mine_sword', 'name': '矿锋剑', 'area': 2, 'stat': 'strength', 'value': 10, 'desc': '力量+10'},
        {'id': 'antidote_herb', 'name': '解毒草', 'area': 3, 'stat': 'poison_immune', 'value': 1, 'desc': '免疫毒'},
        {'id': 'shadow_cloak', 'name': '暗影斗篷', 'area': 4, 'stat': 'dodge_bonus', 'value': 10, 'desc': '闪避+10%'},
    ]

    def __init__(self):
        self.db = get_db()
        self.query = ORMQuery(self.TABLE_NAME)
        self.exec = ORMExec(self.TABLE_NAME)

    @classmethod
    def create_table(cls):
        db = get_db()
        sql = f"""
            CREATE TABLE IF NOT EXISTS {cls.TABLE_NAME} (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                area INTEGER NOT NULL,
                stat TEXT NOT NULL,
                value INTEGER NOT NULL,
                desc TEXT
            )
        """
        db.execute(sql)

    def init_default_equipment(self):
        for eq in self.DEFAULT_EQUIPMENT:
            existing = self.query.find_by_id(eq['id'])
            if not existing:
                self.exec.insert(eq)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='area ASC')

    def get_by_area(self, area: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'area': area})

    def get_by_id(self, eq_id: str) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(eq_id)
