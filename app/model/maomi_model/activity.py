from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ActivityModel:
    TABLE_NAME = 'tb_maomi_model_activity'

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
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT DEFAULT '',
                reward_coins INTEGER DEFAULT 0,
                reward_experience INTEGER DEFAULT 0,
                start_time TIMESTAMP DEFAULT '',
                end_time TIMESTAMP DEFAULT '',
                duration_minutes INTEGER DEFAULT 60,
                status TEXT DEFAULT 'upcoming',
                participants INTEGER DEFAULT 0,
                max_participants INTEGER DEFAULT 10,
                cat_winner_id INTEGER DEFAULT 0,
                cat_winner_name TEXT DEFAULT '',
                is_active INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql2 = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql2)

    def create(self, user_id: int, name: str, type: str, description: str = '',
               reward_coins: int = 0, reward_experience: int = 0,
               duration_minutes: int = 60, max_participants: int = 10) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'type': type,
            'description': description,
            'reward_coins': reward_coins,
            'reward_experience': reward_experience,
            'start_time': now,
            'end_time': '',
            'duration_minutes': duration_minutes,
            'status': 'upcoming',
            'participants': 0,
            'max_participants': max_participants,
            'cat_winner_id': 0,
            'cat_winner_name': '',
            'is_active': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'is_active': 1},
                                    order_by='created_at DESC')

    def get_active(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 'active', 'is_active': 1},
                                    order_by='created_at DESC')

    def get_upcoming(self, user_id: int) -> List[Dict[str, Any]]:
        return self.query.find_all({'user_id': user_id, 'status': 'upcoming', 'is_active': 1},
                                    order_by='created_at DESC')

    def update(self, record_id: int, **kwargs) -> int:
        now = datetime.now().isoformat()
        data = {'updated_at': now}
        for key, value in kwargs.items():
            if value is not None:
                data[key] = value
        return self.exec.update_by_id(record_id, data)

    def start_activity(self, record_id: int) -> Optional[Dict[str, Any]]:
        activity = self.get_by_id(record_id)
        if not activity:
            return None
        now = datetime.now().isoformat()
        self.update(record_id, status='active', start_time=now)
        return self.get_by_id(record_id)

    def end_activity(self, record_id: int, cat_winner_id: int = 0, cat_winner_name: str = '') -> Optional[Dict[str, Any]]:
        activity = self.get_by_id(record_id)
        if not activity:
            return None
        now = datetime.now().isoformat()
        self.update(record_id, status='completed', end_time=now,
                    cat_winner_id=cat_winner_id, cat_winner_name=cat_winner_name)
        return self.get_by_id(record_id)

    def add_participant(self, record_id: int) -> Optional[Dict[str, Any]]:
        activity = self.get_by_id(record_id)
        if not activity:
            return None
        current = activity.get('participants', 0)
        max_p = activity.get('max_participants', 10)
        if current >= max_p:
            return None
        self.update(record_id, participants=current + 1)
        return self.get_by_id(record_id)

    def delete(self, record_id: int) -> int:
        return self.update(record_id, is_active=0)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='id DESC')

    def count(self) -> int:
        return self.query.count()

    def create_default_activities(self, user_id: int) -> int:
        default_activities = [
            {'name': '猫咪选美比赛', 'type': 'beauty', 'description': '展示你家猫咪的美貌，赢取丰厚奖励！', 'reward_coins': 500, 'reward_experience': 100, 'duration_minutes': 30, 'max_participants': 8},
            {'name': '猫咪速度竞赛', 'type': 'race', 'description': '看谁家猫咪跑得最快！', 'reward_coins': 300, 'reward_experience': 80, 'duration_minutes': 20, 'max_participants': 10},
            {'name': '猫咪才艺秀', 'type': 'talent', 'description': '展示猫咪的特殊技能！', 'reward_coins': 400, 'reward_experience': 90, 'duration_minutes': 45, 'max_participants': 6},
            {'name': '猫咪睡姿大比拼', 'type': 'sleep', 'description': '谁家猫咪睡相最可爱？', 'reward_coins': 200, 'reward_experience': 50, 'duration_minutes': 60, 'max_participants': 12},
            {'name': '猫咪相亲大会', 'type': 'date', 'description': '让猫咪们认识新朋友！', 'reward_coins': 350, 'reward_experience': 70, 'duration_minutes': 40, 'max_participants': 10},
        ]
        count = 0
        for activity in default_activities:
            self.create(user_id=user_id, **activity)
            count += 1
        return count
