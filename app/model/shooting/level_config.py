from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class LevelConfigModel:
    TABLE_NAME = 'tb_shooting_level_config'

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
                level_num INTEGER NOT NULL UNIQUE,
                level_name TEXT NOT NULL,
                wave_count INTEGER DEFAULT 6,
                supply_interval INTEGER DEFAULT 15,
                wave_config TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_level_num ON {cls.TABLE_NAME}(level_num)"
        db.execute(index_sql)

    def create(self, level_num: int, level_name: str, wave_count: int = 6,
               supply_interval: int = 15, wave_config: str = '') -> int:
        now = datetime.now().isoformat()
        data = {
            'level_num': level_num,
            'level_name': level_name,
            'wave_count': wave_count,
            'supply_interval': supply_interval,
            'wave_config': wave_config,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_level_num(self, level_num: int) -> Optional[Dict[str, Any]]:
        result = self.query.find_one({'level_num': level_num})
        if result:
            result['wave_config'] = json.loads(result['wave_config']) if result['wave_config'] else []
        return result

    def get_all(self) -> List[Dict[str, Any]]:
        results = self.query.find_all(order_by='level_num ASC')
        for r in results:
            r['wave_config'] = json.loads(r['wave_config']) if r['wave_config'] else []
        return results

    def update(self, record_id: int, level_name: str = None, wave_count: int = None,
               supply_interval: int = None, wave_config: str = None) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}

        if level_name is not None:
            data['level_name'] = level_name
        if wave_count is not None:
            data['wave_count'] = wave_count
        if supply_interval is not None:
            data['supply_interval'] = supply_interval
        if wave_config is not None:
            data['wave_config'] = wave_config

        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def count(self) -> int:
        return self.query.count()

    def init_default_levels(self):
        if self.count() > 0:
            return

        default_waves = []
        for wave_idx in range(1, 7):
            wave = {
                'wave_num': wave_idx,
                'enemies': []
            }
            rush_count = 2 + wave_idx
            defense_count = 1 + (wave_idx // 2)
            suicide_count = wave_idx // 2

            for _ in range(rush_count):
                wave['enemies'].append({'type': 'rush'})
            for _ in range(defense_count):
                wave['enemies'].append({'type': 'defense'})
            for _ in range(suicide_count):
                wave['enemies'].append({'type': 'suicide'})

            default_waves.append(wave)

        for level_num in range(1, 6):
            level_waves = []
            for wave in default_waves:
                level_wave = {'wave_num': wave['wave_num'], 'enemies': []}
                multiplier = 1 + (level_num - 1) * 0.3
                for enemy in wave['enemies']:
                    count = max(1, int(
                        (1 if enemy['type'] == 'defense' else 1) * multiplier
                    ))
                    level_wave['enemies'].append({
                        'type': enemy['type'],
                        'count': count
                    })
                level_waves.append(level_wave)

            self.create(
                level_num=level_num,
                level_name=f'第{level_num}关 - 难度{"★" * level_num}',
                wave_count=6,
                supply_interval=15,
                wave_config=json.dumps(level_waves)
            )
