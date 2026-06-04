from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class UpgradeModel:
    TABLE_NAME = 'tb_yeshi_model_upgrade'
    
    CATEGORY_STALL = 'stall'
    CATEGORY_TOOL = 'tool'
    CATEGORY_SKILL = 'skill'
    CATEGORY_DECOR = 'decoration'
    
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
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                icon TEXT,
                level INTEGER DEFAULT 1,
                max_level INTEGER DEFAULT 5,
                base_cost INTEGER DEFAULT 100,
                cost_multiplier REAL DEFAULT 1.5,
                effect_type TEXT,
                effect_value INTEGER DEFAULT 0,
                unlock_level INTEGER DEFAULT 1,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        cls._init_default_upgrades(db)

    @classmethod
    def _init_default_upgrades(cls, db):
        default_upgrades = [
            ('摊位升级', cls.CATEGORY_STALL, '提升摊位等级，增加同时接待客人数量', '🏪', 1, 5, 200, 1.8, 'max_customers', 1, 1, 1),
            ('烤炉升级', cls.CATEGORY_TOOL, '升级烤炉，减少烤串类烹饪时间', '🔥', 1, 5, 150, 1.6, 'cook_speed_bbq', 10, 1, 1),
            ('炒锅升级', cls.CATEGORY_TOOL, '升级炒锅，减少炒面类烹饪时间', '🍳', 1, 5, 150, 1.6, 'cook_speed_fry', 10, 2, 1),
            ('冰箱升级', cls.CATEGORY_TOOL, '升级冰箱，降低食材成本', '🧊', 1, 5, 200, 1.7, 'ingredient_discount', 5, 3, 1),
            ('快速切配', cls.CATEGORY_SKILL, '提升刀工，减少准备时间', '🔪', 1, 5, 100, 1.5, 'prep_speed', 10, 2, 1),
            ('调味大师', cls.CATEGORY_SKILL, '提升调味技巧，增加菜品质量', '🧂', 1, 5, 120, 1.5, 'quality_bonus', 5, 3, 1),
            ('服务技巧', cls.CATEGORY_SKILL, '提升服务质量，增加顾客满意度', '😊', 1, 5, 100, 1.5, 'satisfaction_bonus', 5, 2, 1),
            ('招牌灯箱', cls.CATEGORY_DECOR, '吸引更多顾客', '💡', 1, 3, 300, 2.0, 'customer_rate', 10, 4, 1),
            ('舒适座椅', cls.CATEGORY_DECOR, '顾客愿意等待更久', '🪑', 1, 3, 250, 2.0, 'wait_patience', 15, 3, 1),
            ('音乐播放', cls.CATEGORY_DECOR, '提升用餐氛围，增加小费', '🎵', 1, 3, 200, 2.0, 'tip_bonus', 10, 4, 1),
            ('清洁设备', cls.CATEGORY_TOOL, '保持摊位清洁，提升口碑', '🧹', 1, 3, 180, 1.8, 'reputation_bonus', 5, 2, 1),
            ('外卖装备', cls.CATEGORY_TOOL, '开启外卖功能，增加订单来源', '🛵', 1, 3, 500, 2.0, 'delivery_enabled', 1, 5, 1),
        ]
        
        existing = db.fetch_one(f"SELECT COUNT(*) as count FROM {cls.TABLE_NAME}")
        if existing and existing.get('count', 0) == 0:
            now = datetime.now().isoformat()
            for upgrade in default_upgrades:
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                    (name, category, description, icon, level, max_level, base_cost, cost_multiplier, effect_type, effect_value, unlock_level, is_active, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (*upgrade, now, now)
                )

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_category(self, category: str) -> List[Dict[str, Any]]:
        return self.query.find_all({'category': category, 'is_active': 1}, order_by='id ASC')

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_active': 1}, order_by='category ASC, id ASC')

    def get_available_by_level(self, level: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_level <= ? AND is_active = 1 ORDER BY category ASC, id ASC"
        return self.db.fetch_all(sql, (level,))

    def calculate_cost(self, upgrade: Dict[str, Any], current_level: int) -> int:
        base_cost = upgrade.get('base_cost', 100)
        multiplier = upgrade.get('cost_multiplier', 1.5)
        return int(base_cost * (multiplier ** current_level))

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id ASC')
