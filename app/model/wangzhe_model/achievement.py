from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class AchievementModel:
    TABLE_NAME = 'tb_wangzhe_model_achievements'

    STATUS_ACTIVE = 0
    STATUS_DISABLED = 1

    TYPE_WIN = 'win'
    TYPE_KILL = 'kill'
    TYPE_LEVEL = 'level'
    TYPE_GAME = 'game'
    TYPE_RANK = 'rank'
    TYPE_SPECIAL = 'special'

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
                type TEXT DEFAULT 'special',
                target_value INTEGER DEFAULT 1,
                reward_gold INTEGER DEFAULT 0,
                reward_diamonds INTEGER DEFAULT 0,
                reward_experience INTEGER DEFAULT 0,
                icon TEXT DEFAULT '',
                status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_type ON {cls.TABLE_NAME}(type)"
        db.execute(index_sql)

    @classmethod
    def init_default_achievements(cls):
        model = cls()
        default_achievements = [
            {
                'name': '初出茅庐',
                'description': '完成第一场游戏',
                'type': cls.TYPE_GAME,
                'target_value': 1,
                'reward_gold': 500,
                'reward_experience': 100
            },
            {
                'name': '身经百战',
                'description': '完成100场游戏',
                'type': cls.TYPE_GAME,
                'target_value': 100,
                'reward_gold': 5000,
                'reward_experience': 1000
            },
            {
                'name': '首胜',
                'description': '获得第一场胜利',
                'type': cls.TYPE_WIN,
                'target_value': 1,
                'reward_gold': 1000,
                'reward_experience': 200
            },
            {
                'name': '百战百胜',
                'description': '累计获得100场胜利',
                'type': cls.TYPE_WIN,
                'target_value': 100,
                'reward_gold': 10000,
                'reward_experience': 2000
            },
            {
                'name': '一血',
                'description': '在游戏中获得第一个击杀',
                'type': cls.TYPE_KILL,
                'target_value': 1,
                'reward_gold': 300,
                'reward_experience': 100
            },
            {
                'name': '连杀狂魔',
                'description': '单场游戏获得10个击杀',
                'type': cls.TYPE_KILL,
                'target_value': 10,
                'reward_gold': 2000,
                'reward_experience': 500
            },
            {
                'name': '初露锋芒',
                'description': '达到5级',
                'type': cls.TYPE_LEVEL,
                'target_value': 5,
                'reward_gold': 2000,
                'reward_experience': 500
            },
            {
                'name': '荣耀王者',
                'description': '达到30级',
                'type': cls.TYPE_LEVEL,
                'target_value': 30,
                'reward_gold': 10000,
                'reward_experience': 5000,
                'reward_diamonds': 100
            },
            {
                'name': '最强王者',
                'description': '排位赛积分达到2000分',
                'type': cls.TYPE_RANK,
                'target_value': 2000,
                'reward_gold': 5000,
                'reward_experience': 2000
            },
            {
                'name': '钻石段位',
                'description': '排位赛积分达到1500分',
                'type': cls.TYPE_RANK,
                'target_value': 1500,
                'reward_gold': 3000,
                'reward_experience': 1000
            },
            {
                'name': '五杀超神',
                'description': '单场游戏获得5个击杀',
                'type': cls.TYPE_KILL,
                'target_value': 5,
                'reward_gold': 1000,
                'reward_experience': 500
            },
            {
                'name': 'MVP',
                'description': '获得一场游戏的MVP',
                'type': cls.TYPE_SPECIAL,
                'target_value': 1,
                'reward_gold': 500,
                'reward_experience': 200
            },
            {
                'name': '连胜达人',
                'description': '连续获得5场胜利',
                'type': cls.TYPE_WIN,
                'target_value': 5,
                'reward_gold': 2000,
                'reward_experience': 1000
            }
        ]

        for achievement in default_achievements:
            existing = model.get_by_name(achievement['name'])
            if not existing:
                model.create(**achievement)

    def create(self, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = kwargs.copy()
        data['created_at'] = now
        data['updated_at'] = now
        data['status'] = self.STATUS_ACTIVE
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = data.copy()
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 50, type: str = None,
                status: int = None) -> Dict[str, Any]:
        conditions = {}
        if type:
            conditions['type'] = type
        if status is not None:
            conditions['status'] = status
        return self.query.paginate(page, page_size, conditions, order_by='id ASC')

    def get_type_text(self, type: str) -> str:
        type_map = {
            self.TYPE_WIN: '胜利',
            self.TYPE_KILL: '击杀',
            self.TYPE_LEVEL: '等级',
            self.TYPE_GAME: '游戏',
            self.TYPE_RANK: '段位',
            self.TYPE_SPECIAL: '特殊'
        }
        return type_map.get(type, '未知')

    def to_public_dict(self, achievement: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': achievement.get('id'),
            'name': achievement.get('name'),
            'description': achievement.get('description'),
            'type': achievement.get('type'),
            'type_text': self.get_type_text(achievement.get('type', '')),
            'target_value': achievement.get('target_value'),
            'reward': {
                'gold': achievement.get('reward_gold'),
                'diamonds': achievement.get('reward_diamonds'),
                'experience': achievement.get('reward_experience')
            },
            'icon': achievement.get('icon'),
            'status': achievement.get('status'),
            'created_at': achievement.get('created_at')
        }
