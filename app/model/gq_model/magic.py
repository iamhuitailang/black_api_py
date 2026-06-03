from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GqMagicModel:
    TABLE_NAME = 'tb_gq_model_magic'

    TYPE_PARTICLE = 'particle'
    TYPE_LIGHT = 'light'
    TYPE_COLOR = 'color'
    TYPE_SOUND = 'sound'
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
                type TEXT DEFAULT 'particle',
                color TEXT DEFAULT '#FFD700',
                effect_config TEXT DEFAULT '{{}}',
                unlock_level INTEGER DEFAULT 1,
                unlock_coins INTEGER DEFAULT 0,
                icon TEXT DEFAULT '✨',
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

    def create(self, name: str, description: str = '', type: str = 'particle',
               color: str = '#FFD700', effect_config: str = '{}',
               unlock_level: int = 1, unlock_coins: int = 0,
               icon: str = '✨', rarity: int = 1, is_default: int = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': type,
            'color': color,
            'effect_config': effect_config,
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

    def update(self, magic_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'color', 'effect_config',
            'unlock_level', 'unlock_coins', 'icon', 'rarity', 'is_default'
        ]}
        return self.exec.update_by_id(magic_id, update_data)

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

    def get_default_magics(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_default': 1}, order_by='rarity ASC, id ASC')

    @classmethod
    def init_default_magics(cls):
        model = cls()
        defaults = [
            {
                'name': '星尘粒子',
                'description': '琴键触落时飘散的星光粒子，温暖而梦幻',
                'type': 'particle',
                'color': '#FFD700',
                'effect_config': '{"particle_count": 30, "trail_length": 15, "glow_radius": 8, "speed": 1.0, "spread": 0.5}',
                'unlock_level': 1,
                'unlock_coins': 0,
                'icon': '✨',
                'rarity': 1,
                'is_default': 1
            },
            {
                'name': '彩虹光环',
                'description': '演奏时琴键周围绽放的七彩光环',
                'type': 'light',
                'color': '#FF69B4',
                'effect_config': '{"particle_count": 20, "glow_radius": 12, "ring_width": 3, "rotation_speed": 0.8, "colors": ["#FF0000","#FF7F00","#FFFF00","#00FF00","#0000FF","#4B0082","#9400D3"]}',
                'unlock_level': 1,
                'unlock_coins': 0,
                'icon': '🌈',
                'rarity': 1,
                'is_default': 1
            },
            {
                'name': '极光变幻',
                'description': '如北极光般流动的色彩变幻效果',
                'type': 'color',
                'color': '#00FF7F',
                'effect_config': '{"particle_count": 40, "trail_length": 25, "glow_radius": 15, "wave_speed": 1.2, "color_shift": 0.6, "blend_mode": "additive"}',
                'unlock_level': 5,
                'unlock_coins': 500,
                'icon': '🌌',
                'rarity': 2,
                'is_default': 0
            },
            {
                'name': '音波涟漪',
                'description': '音符化为一圈圈扩散的水波涟漪',
                'type': 'sound',
                'color': '#00BFFF',
                'effect_config': '{"particle_count": 25, "ripple_count": 5, "ripple_speed": 2.0, "max_radius": 30, "fade_rate": 0.8, "wave_amplitude": 1.5}',
                'unlock_level': 8,
                'unlock_coins': 800,
                'icon': '🎵',
                'rarity': 2,
                'is_default': 0
            },
            {
                'name': '凤凰涅槃',
                'description': '烈焰凤凰展翅飞舞的华丽特效',
                'type': 'special',
                'color': '#FF4500',
                'effect_config': '{"particle_count": 80, "trail_length": 30, "glow_radius": 20, "wing_span": 40, "fire_intensity": 1.5, "respawn_delay": 2.0, "feather_count": 15}',
                'unlock_level': 15,
                'unlock_coins': 2000,
                'icon': '🔥',
                'rarity': 3,
                'is_default': 0
            },
            {
                'name': '时空裂缝',
                'description': '撕裂时空的终极特效，星辰与暗物质交织',
                'type': 'special',
                'color': '#8A2BE2',
                'effect_config': '{"particle_count": 120, "trail_length": 40, "glow_radius": 25, "rift_width": 15, "dark_matter_density": 0.9, "star_count": 50, "dimension_shift": 2.0, "time_dilation": 0.5}',
                'unlock_level': 25,
                'unlock_coins': 5000,
                'icon': '🌀',
                'rarity': 4,
                'is_default': 0
            }
        ]
        for item in defaults:
            existing = model.query.find_one({'name': item['name']})
            if not existing:
                model.create(**item)
