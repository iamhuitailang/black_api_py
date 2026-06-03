from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class MissionModel:
    TABLE_NAME = 'tb_hd_model_mission'

    TYPE_DAILY = 1
    TYPE_MAIN = 2
    TYPE_ACHIEVEMENT = 3

    TYPE_MAP = {
        TYPE_DAILY: '日常',
        TYPE_MAIN: '主线',
        TYPE_ACHIEVEMENT: '成就'
    }

    TARGET_TYPE_LOGIN = 'login'
    TARGET_TYPE_BATTLE = 'battle'
    TARGET_TYPE_WIN = 'win'
    TARGET_TYPE_LEVEL = 'level'
    TARGET_TYPE_EXP = 'exp'
    TARGET_TYPE_GOLD = 'gold'
    TARGET_TYPE_SKILL = 'skill'
    TARGET_TYPE_EQUIPMENT = 'equipment'

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
                target_type TEXT NOT NULL,
                target_value INTEGER DEFAULT 1,
                reward_exp INTEGER DEFAULT 0,
                reward_gold INTEGER DEFAULT 0,
                is_daily INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_daily ON {cls.TABLE_NAME}(is_daily)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_target_type ON {cls.TABLE_NAME}(target_type)"
        db.execute(index_sql)

        cls.init_default_missions()

    @classmethod
    def init_default_missions(cls):
        db = get_db()
        now = datetime.now().isoformat()

        default_missions = [
            {
                'name': '每日登录',
                'description': '每日登录游戏',
                'type': cls.TYPE_DAILY,
                'target_type': cls.TARGET_TYPE_LOGIN,
                'target_value': 1,
                'reward_exp': 10,
                'reward_gold': 50,
                'is_daily': 1,
                'created_at': now
            },
            {
                'name': '初战告捷',
                'description': '完成一场对战',
                'type': cls.TYPE_DAILY,
                'target_type': cls.TARGET_TYPE_BATTLE,
                'target_value': 1,
                'reward_exp': 20,
                'reward_gold': 100,
                'is_daily': 1,
                'created_at': now
            },
            {
                'name': '连战连胜',
                'description': '赢得3场对战',
                'type': cls.TYPE_DAILY,
                'target_type': cls.TARGET_TYPE_WIN,
                'target_value': 3,
                'reward_exp': 50,
                'reward_gold': 200,
                'is_daily': 1,
                'created_at': now
            },
            {
                'name': '忍者之路',
                'description': '达到5级',
                'type': cls.TYPE_MAIN,
                'target_type': cls.TARGET_TYPE_LEVEL,
                'target_value': 5,
                'reward_exp': 100,
                'reward_gold': 500,
                'is_daily': 0,
                'created_at': now
            },
            {
                'name': '财富积累',
                'description': '累计获得1000金币',
                'type': cls.TYPE_ACHIEVEMENT,
                'target_type': cls.TARGET_TYPE_GOLD,
                'target_value': 1000,
                'reward_exp': 200,
                'reward_gold': 300,
                'is_daily': 0,
                'created_at': now
            },
            {
                'name': '经验大师',
                'description': '累计获得500经验',
                'type': cls.TYPE_ACHIEVEMENT,
                'target_type': cls.TARGET_TYPE_EXP,
                'target_value': 500,
                'reward_exp': 150,
                'reward_gold': 400,
                'is_daily': 0,
                'created_at': now
            },
            {
                'name': '技能收藏家',
                'description': '学习3个技能',
                'type': cls.TYPE_ACHIEVEMENT,
                'target_type': cls.TARGET_TYPE_SKILL,
                'target_value': 3,
                'reward_exp': 100,
                'reward_gold': 300,
                'is_daily': 0,
                'created_at': now
            },
            {
                'name': '装备达人',
                'description': '获得5件装备',
                'type': cls.TYPE_ACHIEVEMENT,
                'target_type': cls.TARGET_TYPE_EQUIPMENT,
                'target_value': 5,
                'reward_exp': 150,
                'reward_gold': 500,
                'is_daily': 0,
                'created_at': now
            }
        ]

        for mission in default_missions:
            exists = db.fetch_one(f"SELECT id FROM {cls.TABLE_NAME} WHERE name = ?", (mission['name'],))
            if not exists:
                placeholders = ', '.join(['?' for _ in mission])
                fields = ', '.join(mission.keys())
                db.execute(
                    f"INSERT INTO {cls.TABLE_NAME} ({fields}) VALUES ({placeholders})",
                    tuple(mission.values())
                )

    def create(self, name: str, description: str, mission_type: int, target_type: str,
               target_value: int, reward_exp: int, reward_gold: int, is_daily: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'type': mission_type,
            'target_type': target_type,
            'target_value': target_value,
            'reward_exp': reward_exp,
            'reward_gold': reward_gold,
            'is_daily': is_daily,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'type', 'target_type', 'target_value',
            'reward_exp', 'reward_gold', 'is_daily'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                mission_type: int = None, is_daily: int = None,
                order_by: str = 'id ASC') -> Dict[str, Any]:
        conditions = {}
        if mission_type is not None:
            conditions['type'] = mission_type
        if is_daily is not None:
            conditions['is_daily'] = is_daily
        return self.query.paginate(page, page_size, conditions, order_by=order_by)

    def get_by_type(self, mission_type: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'type': mission_type}, order_by='id ASC')

    def get_daily_missions(self) -> List[Dict[str, Any]]:
        return self.query.find_all({'is_daily': 1}, order_by='id ASC')

    def get_type_text(self, mission_type: int) -> str:
        return self.TYPE_MAP.get(mission_type, '未知')

    def to_dict(self, mission: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': mission.get('id'),
            'name': mission.get('name'),
            'description': mission.get('description'),
            'type': mission.get('type'),
            'type_text': self.get_type_text(mission.get('type')),
            'target_type': mission.get('target_type'),
            'target_value': mission.get('target_value'),
            'reward_exp': mission.get('reward_exp'),
            'reward_gold': mission.get('reward_gold'),
            'is_daily': mission.get('is_daily'),
            'created_at': mission.get('created_at')
        }
