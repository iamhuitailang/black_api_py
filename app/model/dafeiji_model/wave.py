from datetime import datetime
from typing import Dict, Any, Optional, List
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import json


class DafeijiWaveModel:
    TABLE_NAME = 'tb_dafeiji_model_wave'

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
                wave_number INTEGER NOT NULL,
                name TEXT NOT NULL,
                enemy_count INTEGER DEFAULT 10,
                enemy_types TEXT DEFAULT '[]',
                spawn_interval INTEGER DEFAULT 1000,
                difficulty_multiplier REAL DEFAULT 1.0,
                boss_id INTEGER DEFAULT 0,
                reward_score INTEGER DEFAULT 100,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_wave_number ON {cls.TABLE_NAME}(wave_number)"
        db.execute(index_sql)

    @classmethod
    def init_default_waves(cls):
        model = cls()
        count = model.query.count({})
        if count > 0:
            return
        defaults = [
            {'wave_number': 1, 'name': '侦察部队', 'enemy_count': 8, 'enemy_types': json.dumps(['scout']), 'spawn_interval': 1200, 'difficulty_multiplier': 1.0, 'boss_id': 0, 'reward_score': 100, 'description': '敌军侦察小队来袭'},
            {'wave_number': 2, 'name': '突击编队', 'enemy_count': 12, 'enemy_types': json.dumps(['scout', 'fighter']), 'spawn_interval': 1000, 'difficulty_multiplier': 1.2, 'boss_id': 0, 'reward_score': 150, 'description': '敌方突击编队进攻'},
            {'wave_number': 3, 'name': '重装部队', 'enemy_count': 10, 'enemy_types': json.dumps(['fighter', 'bomber']), 'spawn_interval': 900, 'difficulty_multiplier': 1.5, 'boss_id': 0, 'reward_score': 200, 'description': '重装机甲部队出现'},
            {'wave_number': 4, 'name': '精英部队', 'enemy_count': 15, 'enemy_types': json.dumps(['scout', 'fighter', 'bomber']), 'spawn_interval': 800, 'difficulty_multiplier': 1.8, 'boss_id': 0, 'reward_score': 300, 'description': '敌军精英部队全面出击'},
            {'wave_number': 5, 'name': 'BOSS战-钢铁巨兽', 'enemy_count': 5, 'enemy_types': json.dumps(['fighter']), 'spawn_interval': 1500, 'difficulty_multiplier': 2.0, 'boss_id': 1, 'reward_score': 500, 'description': '钢铁巨兽降临！'},
            {'wave_number': 6, 'name': '幽灵编队', 'enemy_count': 20, 'enemy_types': json.dumps(['scout', 'scout', 'fighter']), 'spawn_interval': 700, 'difficulty_multiplier': 2.2, 'boss_id': 0, 'reward_score': 350, 'description': '高速幽灵编队突袭'},
            {'wave_number': 7, 'name': '毁灭中队', 'enemy_count': 18, 'enemy_types': json.dumps(['bomber', 'bomber', 'fighter']), 'spawn_interval': 800, 'difficulty_multiplier': 2.5, 'boss_id': 0, 'reward_score': 400, 'description': '毁灭性轰炸中队'},
            {'wave_number': 8, 'name': '全面战争', 'enemy_count': 25, 'enemy_types': json.dumps(['scout', 'fighter', 'bomber']), 'spawn_interval': 600, 'difficulty_multiplier': 3.0, 'boss_id': 0, 'reward_score': 500, 'description': '敌军全面进攻！'},
            {'wave_number': 9, 'name': '终极防线', 'enemy_count': 30, 'enemy_types': json.dumps(['fighter', 'bomber', 'heavy']), 'spawn_interval': 500, 'difficulty_multiplier': 3.5, 'boss_id': 0, 'reward_score': 600, 'description': '终极防御战'},
            {'wave_number': 10, 'name': 'BOSS战-末日帝王', 'enemy_count': 10, 'enemy_types': json.dumps(['heavy']), 'spawn_interval': 1000, 'difficulty_multiplier': 4.0, 'boss_id': 2, 'reward_score': 1000, 'description': '末日帝王现身！'},
        ]
        now = datetime.now().isoformat()
        for item in defaults:
            item['created_at'] = now
            item['updated_at'] = now
            model.exec.insert(item)

    def create(self, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        if isinstance(data.get('enemy_types'), list):
            data['enemy_types'] = json.dumps(data['enemy_types'], ensure_ascii=False)
        data['created_at'] = now
        data['updated_at'] = now
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        wave = self.query.find_by_id(record_id)
        if wave and isinstance(wave.get('enemy_types'), str):
            try:
                wave['enemy_types'] = json.loads(wave['enemy_types'])
            except (json.JSONDecodeError, TypeError):
                wave['enemy_types'] = []
        return wave

    def get_by_wave_number(self, wave_number: int) -> Optional[Dict[str, Any]]:
        wave = self.query.find_one({'wave_number': wave_number})
        if wave and isinstance(wave.get('enemy_types'), str):
            try:
                wave['enemy_types'] = json.loads(wave['enemy_types'])
            except (json.JSONDecodeError, TypeError):
                wave['enemy_types'] = []
        return wave

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        result = self.query.paginate(page, page_size, order_by='wave_number ASC')
        for item in result.get('items', []):
            if isinstance(item.get('enemy_types'), str):
                try:
                    item['enemy_types'] = json.loads(item['enemy_types'])
                except (json.JSONDecodeError, TypeError):
                    item['enemy_types'] = []
        return result

    def get_all_list(self) -> List[Dict[str, Any]]:
        items = self.query.find_all(order_by='wave_number ASC')
        for item in items:
            if isinstance(item.get('enemy_types'), str):
                try:
                    item['enemy_types'] = json.loads(item['enemy_types'])
                except (json.JSONDecodeError, TypeError):
                    item['enemy_types'] = []
        return items

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        if isinstance(data.get('enemy_types'), list):
            data['enemy_types'] = json.dumps(data['enemy_types'], ensure_ascii=False)
        update_data = {k: v for k, v in data.items() if k in [
            'wave_number', 'name', 'enemy_count', 'enemy_types',
            'spawn_interval', 'difficulty_multiplier', 'boss_id',
            'reward_score', 'description'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def to_dict(self, wave: Dict[str, Any]) -> Dict[str, Any]:
        enemy_types = wave.get('enemy_types', [])
        if isinstance(enemy_types, str):
            try:
                enemy_types = json.loads(enemy_types)
            except (json.JSONDecodeError, TypeError):
                enemy_types = []
        return {
            'id': wave.get('id'),
            'wave_number': wave.get('wave_number'),
            'name': wave.get('name'),
            'enemy_count': wave.get('enemy_count'),
            'enemy_types': enemy_types,
            'spawn_interval': wave.get('spawn_interval'),
            'difficulty_multiplier': wave.get('difficulty_multiplier'),
            'boss_id': wave.get('boss_id'),
            'reward_score': wave.get('reward_score'),
            'description': wave.get('description'),
            'created_at': wave.get('created_at')
        }
