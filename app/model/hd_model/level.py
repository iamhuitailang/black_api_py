from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class LevelModel:
    TABLE_NAME = 'tb_hd_model_level'

    TYPE_PARKOUR = 1
    TYPE_BATTLE = 2
    TYPE_STEALTH = 3
    TYPE_ASSASSINATION = 4

    TYPE_MAP = {
        TYPE_PARKOUR: '跑酷',
        TYPE_BATTLE: '战斗',
        TYPE_STEALTH: '潜入',
        TYPE_ASSASSINATION: '暗杀'
    }

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
                type INTEGER NOT NULL,
                difficulty INTEGER NOT NULL,
                unlock_level INTEGER DEFAULT 1,
                reward_exp INTEGER DEFAULT 0,
                reward_gold INTEGER DEFAULT 0,
                enemy_count INTEGER DEFAULT 0,
                time_limit INTEGER DEFAULT 0,
                map_data TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_difficulty ON {cls.TABLE_NAME}(difficulty)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_unlock_level ON {cls.TABLE_NAME}(unlock_level)"
        db.execute(index_sql)

        cls.init_default_levels()

    @classmethod
    def init_default_levels(cls):
        db = get_db()
        now = datetime.now().isoformat()

        default_levels = [
            {
                'name': '新手训练场',
                'description': '木叶村的基础训练场，适合新手忍者熟悉操作的入门关卡。在有限时间内到达终点即可完成训练。',
                'type': cls.TYPE_PARKOUR,
                'difficulty': 1,
                'unlock_level': 1,
                'reward_exp': 50,
                'reward_gold': 30,
                'enemy_count': 0,
                'time_limit': 120,
                'map_data': 'map_training_01',
                'created_at': now
            },
            {
                'name': '森林遭遇战',
                'description': '在森林中与敌方忍者小队遭遇，消灭所有敌人完成任务。注意合理使用技能组合攻击。',
                'type': cls.TYPE_BATTLE,
                'difficulty': 1,
                'unlock_level': 2,
                'reward_exp': 80,
                'reward_gold': 50,
                'enemy_count': 3,
                'time_limit': 180,
                'map_data': 'map_forest_01',
                'created_at': now
            },
            {
                'name': '夜色潜入',
                'description': '潜入敌方据点获取情报。避免被敌人发现，一旦被发现任务失败。',
                'type': cls.TYPE_STEALTH,
                'difficulty': 2,
                'unlock_level': 3,
                'reward_exp': 120,
                'reward_gold': 80,
                'enemy_count': 5,
                'time_limit': 240,
                'map_data': 'map_night_01',
                'created_at': now
            },
            {
                'name': '暗影刺杀',
                'description': '暗杀敌方首领。需要避开巡逻兵，找到目标并一击必杀。',
                'type': cls.TYPE_ASSASSINATION,
                'difficulty': 3,
                'unlock_level': 4,
                'reward_exp': 150,
                'reward_gold': 100,
                'enemy_count': 6,
                'time_limit': 300,
                'map_data': 'map_assassin_01',
                'created_at': now
            },
            {
                'name': '极限飞跃',
                'description': '高难度跑酷关卡，在各种复杂地形中快速移动，展现你的身法。',
                'type': cls.TYPE_PARKOUR,
                'difficulty': 3,
                'unlock_level': 5,
                'reward_exp': 180,
                'reward_gold': 120,
                'enemy_count': 2,
                'time_limit': 150,
                'map_data': 'map_parkour_02',
                'created_at': now
            },
            {
                'name': 'Boss战·影之忍者',
                'description': '与影之忍者的决战。这是一场艰难的战斗，需要运用你所学的所有技能。',
                'type': cls.TYPE_BATTLE,
                'difficulty': 4,
                'unlock_level': 6,
                'reward_exp': 300,
                'reward_gold': 200,
                'enemy_count': 4,
                'time_limit': 360,
                'map_data': 'map_boss_01',
                'created_at': now
            }
        ]

        for level in default_levels:
            exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?", (level['name'],))
            if not exists:
                placeholders = ', '.join(['?' for _ in level])
                fields = ', '.join(level.keys())
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} ({fields}) VALUES ({placeholders})",
                    tuple(level.values())
                )

    def create(self, name: str, description: str, level_type: int, difficulty: int,
               unlock_level: int, reward_exp: int, reward_gold: int,
               enemy_count: int, time_limit: int, map_data: str) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': level_type,
            'difficulty': difficulty,
            'unlock_level': unlock_level,
            'reward_exp': reward_exp,
            'reward_gold': reward_gold,
            'enemy_count': enemy_count,
            'time_limit': time_limit,
            'map_data': map_data,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'difficulty', 'unlock_level',
            'reward_exp', 'reward_gold', 'enemy_count', 'time_limit', 'map_data'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                level_type: int = None, difficulty: int = None,
                order_by: str = 'id ASC') -> Dict[str, Any]:
        conditions = {}
        if level_type:
            conditions['type'] = level_type
        if difficulty:
            conditions['difficulty'] = difficulty
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_by_type(self, level_type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': level_type}, order_by='difficulty ASC')

    def get_available_levels(self, user_level: int) -> List[Dict[str, Any]]:
        sql = f"SELECT * FROM {self.TABLE_NAME} WHERE unlock_level <= ? ORDER BY difficulty ASC"
        return self.db.fetch_all(sql, (user_level,))

    def get_type_text(self, level_type: int) -> str:
        return self.TYPE_MAP.get(level_type, '未知')

    def get_difficulty_stars(self, difficulty: int) -> str:
        return '★' * difficulty + '☆' * (5 - difficulty)

    def to_dict(self, level: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': level.get('id'),
            'name': level.get('name'),
            'description': level.get('description'),
            'type': level.get('type'),
            'type_text': self.get_type_text(level.get('type')),
            'difficulty': level.get('difficulty'),
            'difficulty_stars': self.get_difficulty_stars(level.get('difficulty')),
            'unlock_level': level.get('unlock_level'),
            'reward_exp': level.get('reward_exp'),
            'reward_gold': level.get('reward_gold'),
            'enemy_count': level.get('enemy_count'),
            'time_limit': level.get('time_limit'),
            'map_data': level.get('map_data'),
            'created_at': level.get('created_at')
        }
