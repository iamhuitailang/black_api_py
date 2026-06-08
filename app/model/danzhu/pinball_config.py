from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class PinballConfigModel:
    TABLE_NAME = 'tb_danzhu_model_pinball_config'

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
                type TEXT NOT NULL,
                config_json TEXT DEFAULT '{{}}',
                position_json TEXT DEFAULT '{{}}',
                score INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_active ON {cls.TABLE_NAME}(is_active)"
        db.execute(index_sql2)

        cls._seed_default_data()

    @classmethod
    def _seed_default_data(cls):
        db = get_db()
        count = db.fetch_one(f"SELECT COUNT(*) as total FROM {cls.TABLE_NAME}")
        if count and count.get('total', 0) > 0:
            return

        now = datetime.now().isoformat()
        default_configs = [
            {
                'name': '圆形弹射器-左',
                'type': 'bumper',
                'config_json': json.dumps({'radius': 25, 'force': 15, 'color': '#ff00ff'}),
                'position_json': json.dumps({'x': 120, 'y': 300}),
                'score': 50,
                'sort_order': 1,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '圆形弹射器-中',
                'type': 'bumper',
                'config_json': json.dumps({'radius': 25, 'force': 15, 'color': '#00ffff'}),
                'position_json': json.dumps({'x': 200, 'y': 250}),
                'score': 50,
                'sort_order': 2,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '圆形弹射器-右',
                'type': 'bumper',
                'config_json': json.dumps({'radius': 25, 'force': 15, 'color': '#ff00ff'}),
                'position_json': json.dumps({'x': 280, 'y': 300}),
                'score': 50,
                'sort_order': 3,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '加速带-上',
                'type': 'accelerator',
                'config_json': json.dumps({'width': 80, 'height': 15, 'speedBoost': 1.5, 'color': '#00ff88'}),
                'position_json': json.dumps({'x': 200, 'y': 400, 'angle': 0}),
                'score': 20,
                'sort_order': 4,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '旋转门-左',
                'type': 'rotator',
                'config_json': json.dumps({'length': 80, 'speed': 0.03, 'color': '#ffaa00'}),
                'position_json': json.dumps({'x': 100, 'y': 450}),
                'score': 30,
                'sort_order': 5,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '旋转门-右',
                'type': 'rotator',
                'config_json': json.dumps({'length': 80, 'speed': -0.03, 'color': '#ffaa00'}),
                'position_json': json.dumps({'x': 300, 'y': 450}),
                'score': 30,
                'sort_order': 6,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '传送门-入口',
                'type': 'portal_in',
                'config_json': json.dumps({'radius': 20, 'color': '#ff00aa', 'targetId': 'portal_out_1'}),
                'position_json': json.dumps({'x': 80, 'y': 550}),
                'score': 40,
                'sort_order': 7,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '传送门-出口',
                'type': 'portal_out',
                'config_json': json.dumps({'radius': 20, 'color': '#aa00ff', 'portalId': 'portal_out_1'}),
                'position_json': json.dumps({'x': 320, 'y': 200}),
                'score': 0,
                'sort_order': 8,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '得分倍增器',
                'type': 'multiplier',
                'config_json': json.dumps({'radius': 22, 'duration': 3, 'color': '#ffff00'}),
                'position_json': json.dumps({'x': 200, 'y': 480}),
                'score': 25,
                'sort_order': 9,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
            {
                'name': '弹珠分裂器',
                'type': 'splitter',
                'config_json': json.dumps({'radius': 22, 'duration': 5, 'color': '#00ffaa'}),
                'position_json': json.dumps({'x': 150, 'y': 380}),
                'score': 60,
                'sort_order': 10,
                'is_active': 1,
                'created_at': now,
                'updated_at': now,
            },
        ]

        for cfg in default_configs:
            keys = ', '.join(cfg.keys())
            placeholders = ', '.join(['?' for _ in cfg])
            values = tuple(cfg.values())
            db.execute(
                f"INSERT INTO {cls.TABLE_NAME} ({keys}) VALUES ({placeholders})",
                values
            )

    def create(self, name: str, type: str, config_json: str = '{}',
               position_json: str = '{}', score: int = 0,
               sort_order: int = 0, is_active: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'type': type,
            'config_json': config_json,
            'position_json': position_json,
            'score': score,
            'sort_order': sort_order,
            'is_active': is_active,
            'created_at': now,
            'updated_at': now,
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all_active(self) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'is_active': 1},
            order_by='sort_order ASC, id ASC'
        )

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='sort_order ASC, id ASC')

    def get_by_type(self, type: str) -> List[Dict[str, Any]]:
        return self.query.find_all(
            conditions={'type': type, 'is_active': 1},
            order_by='sort_order ASC, id ASC'
        )

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key in ['name', 'type', 'config_json', 'position_json', 'score', 'sort_order', 'is_active']:
            if kwargs.get(key) is not None:
                data[key] = kwargs[key]
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()
