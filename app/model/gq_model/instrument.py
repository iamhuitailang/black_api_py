from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqInstrumentModel:
    TABLE_NAME = 'tb_gq_model_instrument'

    TYPE_PIANO = 'piano'
    TYPE_KEYBOARD = 'keyboard'
    TYPE_HARP = 'harp'
    TYPE_ORGAN = 'organ'
    TYPE_SYNTHESIZER = 'synthesizer'
    TYPE_SPECIAL = 'special'

    RARITY_COMMON = 1
    RARITY_RARE = 2
    RARITY_EPIC = 3
    RARITY_LEGENDARY = 4

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
                description TEXT DEFAULT '',
                type TEXT DEFAULT 'piano',
                sound_config TEXT DEFAULT '{{}}',
                unlock_level INTEGER DEFAULT 1,
                unlock_coins INTEGER DEFAULT 0,
                icon TEXT DEFAULT '🎹',
                rarity INTEGER DEFAULT 1,
                is_default INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_rarity ON {cls.TABLE_NAME}(rarity)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlock_level ON {cls.TABLE_NAME}(unlock_level)"
        db.execute(index_sql)

    def create(self, name: str, description: str = '', type: str = 'piano',
               sound_config: str = '{}', unlock_level: int = 1,
               unlock_coins: int = 0, icon: str = '🎹',
               rarity: int = 1, is_default: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'sound_config': sound_config,
            'unlock_level': unlock_level,
            'unlock_coins': unlock_coins,
            'icon': icon,
            'rarity': rarity,
            'is_default': is_default,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, instrument_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'sound_config',
            'unlock_level', 'unlock_coins', 'icon', 'rarity', 'is_default'
        ]}
        return self.exec.update_by_id(instrument_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                type: str = None, rarity: int = None) -> Dict[str, Any]:
        conditions = {}
        if type is not None:
            conditions['type'] = type
        if rarity is not None:
            conditions['rarity'] = rarity
        return self.query.paginate(page, page_size, conditions, order_by='rarity ASC, id ASC')

    def get_default_instruments(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_default': 1}, order_by='rarity ASC, id ASC')

    @classmethod
    def init_default_instruments(cls):
        model = cls()
        defaults = [
            {
                'name': '经典钢琴',
                'description': '纯正的三角钢琴音色，温暖而饱满',
                'type': 'piano',
                'sound_config': '{"waveform": "sine", "attack": 0.01, "decay": 0.3, "sustain": 0.6, "release": 1.0, "detune": 0, "velocity_sensitivity": 0.8}',
                'unlock_level': 1,
                'unlock_coins': 0,
                'icon': '🎹',
                'rarity': 1,
                'is_default': 1
            },
            {
                'name': '电音键盘',
                'description': '现代电子合成键盘，节奏感十足',
                'type': 'keyboard',
                'sound_config': '{"waveform": "square", "attack": 0.005, "decay": 0.2, "sustain": 0.4, "release": 0.5, "detune": 5, "velocity_sensitivity": 0.6, "filter_cutoff": 2000, "filter_resonance": 2.0}',
                'unlock_level': 1,
                'unlock_coins': 0,
                'icon': '🎹',
                'rarity': 1,
                'is_default': 0
            },
            {
                'name': '天使竖琴',
                'description': '空灵悠扬的竖琴音色，如天使低吟',
                'type': 'harp',
                'sound_config': '{"waveform": "triangle", "attack": 0.02, "decay": 0.5, "sustain": 0.7, "release": 2.0, "detune": 0, "velocity_sensitivity": 0.9, "reverb_mix": 0.4, "chorus_depth": 0.3}',
                'unlock_level': 5,
                'unlock_coins': 600,
                'icon': '🎵',
                'rarity': 2,
                'is_default': 0
            },
            {
                'name': '教堂管风琴',
                'description': '庄严宏伟的管风琴，回荡在穹顶之下',
                'type': 'organ',
                'sound_config': '{"waveform": "sawtooth", "attack": 0.05, "decay": 0.1, "sustain": 0.9, "release": 1.5, "detune": 0, "velocity_sensitivity": 0.5, "drawbars": [8,8,4,2], "rotary_speed": 0.7, "reverb_mix": 0.6}',
                'unlock_level': 12,
                'unlock_coins': 1500,
                'icon': '⛪',
                'rarity': 3,
                'is_default': 0
            },
            {
                'name': '魔法合成器',
                'description': '融合多种音色的终极合成器，音色无穷变幻',
                'type': 'synthesizer',
                'sound_config': '{"waveform": "composite", "attack": 0.01, "decay": 0.4, "sustain": 0.5, "release": 1.8, "detune": 10, "velocity_sensitivity": 1.0, "osc_count": 4, "filter_cutoff": 5000, "filter_resonance": 4.0, "lfo_rate": 3.0, "lfo_depth": 0.5, "reverb_mix": 0.3, "delay_time": 0.4, "delay_feedback": 0.3}',
                'unlock_level': 20,
                'unlock_coins': 4000,
                'icon': '🔮',
                'rarity': 4,
                'is_default': 0
            }
        ]
        for item in defaults:
            existing = model.query.find_one({'name': item['name']})
            if not existing:
                model.create(**item)
