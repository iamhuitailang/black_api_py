from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class WaveModel:
    TABLE_NAME = 'tb_dafeiji_wave'

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
                wave_number INTEGER NOT NULL UNIQUE,
                is_boss_wave INTEGER DEFAULT 0,
                enemies TEXT NOT NULL,
                spawn_interval REAL NOT NULL,
                difficulty_multiplier REAL DEFAULT 1.0,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_wave_number ON {cls.TABLE_NAME}(wave_number)"
        db.execute(index_sql)

        initial_waves = [
            {'wave_number': 1, 'is_boss_wave': 0, 'enemies': [{'type': 'small', 'count': 5}], 'spawn_interval': 1.5, 'description': '侦察编队'},
            {'wave_number': 2, 'is_boss_wave': 0, 'enemies': [{'type': 'small', 'count': 8}], 'spawn_interval': 1.2, 'description': '轻型攻击队'},
            {'wave_number': 3, 'is_boss_wave': 0, 'enemies': [{'type': 'small', 'count': 5}, {'type': 'medium', 'count': 2}], 'spawn_interval': 1.2, 'description': '混合编队'},
            {'wave_number': 4, 'is_boss_wave': 0, 'enemies': [{'type': 'medium', 'count': 5}], 'spawn_interval': 1.5, 'description': '中型编队'},
            {'wave_number': 5, 'is_boss_wave': 1, 'enemies': [{'type': 'boss', 'count': 1}], 'spawn_interval': 0, 'description': 'BOSS - 钢铁守卫'},
            {'wave_number': 6, 'is_boss_wave': 0, 'enemies': [{'type': 'small', 'count': 10}, {'type': 'elite', 'count': 1}], 'spawn_interval': 1.0, 'description': '精英侦察队'},
            {'wave_number': 7, 'is_boss_wave': 0, 'enemies': [{'type': 'medium', 'count': 6}, {'type': 'elite', 'count': 1}], 'spawn_interval': 1.2, 'description': '强化中队'},
            {'wave_number': 8, 'is_boss_wave': 0, 'enemies': [{'type': 'heavy', 'count': 2}, {'type': 'medium', 'count': 4}], 'spawn_interval': 1.5, 'description': '重装突击'},
            {'wave_number': 9, 'is_boss_wave': 0, 'enemies': [{'type': 'elite', 'count': 3}, {'type': 'small', 'count': 6}], 'spawn_interval': 1.0, 'description': '精英大队'},
            {'wave_number': 10, 'is_boss_wave': 1, 'enemies': [{'type': 'boss', 'count': 1}], 'spawn_interval': 0, 'description': 'BOSS - 毁灭者'},
        ]

        for wave in initial_waves:
            existing = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE wave_number = ?", (wave['wave_number'],))
            if not existing:
                now = datetime.now().isoformat()
                enemies_json = json.dumps(wave['enemies'])
                db.execute(
                    f"""INSERT INTO {cls.TABLE_NAME} 
                    (wave_number, is_boss_wave, enemies, spawn_interval, difficulty_multiplier, description, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                    (wave['wave_number'], wave['is_boss_wave'], enemies_json,
                     wave['spawn_interval'], 1.0, wave['description'], now, now)
                )

    def get_by_wave_number(self, wave_number: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_one({'wave_number': wave_number})
        if row and row.get('enemies'):
            try:
                row['enemies'] = json.loads(row['enemies'])
            except Exception:
                pass
        return row

    def get_all(self, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        offset = (page - 1) * page_size
        items = self.query.find_all(order_by='wave_number ASC', limit=page_size, offset=offset)
        for item in items:
            if item.get('enemies'):
                try:
                    item['enemies'] = json.loads(item['enemies'])
                except Exception:
                    pass
        total = self.query.count()
        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size
        }

    def get_all_waves(self) -> List[Dict[str, Any]]:
        items = self.query.find_all(order_by='wave_number ASC')
        for item in items:
            if item.get('enemies'):
                try:
                    item['enemies'] = json.loads(item['enemies'])
                except Exception:
                    pass
        return items

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        row = self.query.find_by_id(record_id)
        if row and row.get('enemies'):
            try:
                row['enemies'] = json.loads(row['enemies'])
            except Exception:
                pass
        return row

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        if isinstance(data.get('enemies'), (list, dict)):
            data['enemies'] = json.dumps(data['enemies'])
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        if isinstance(data.get('enemies'), (list, dict)):
            data['enemies'] = json.dumps(data['enemies'])
        data['updated_at'] = now
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def get_max_wave(self) -> int:
        result = self.db.fetch_one(f"SELECT MAX(wave_number) as max_wave FROM {self.TABLE_NAME}")
        return result.get('max_wave', 0) if result else 0
