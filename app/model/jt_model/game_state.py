from datetime import datetime
from typing import Dict, Any, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class GameStateModel:
    TABLE_NAME = 'tb_jt_model_game_state'

    SPEED_NORMAL = 1
    SPEED_FAST = 2
    SPEED_ULTRA = 3

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
                city_id INTEGER,
                game_data TEXT DEFAULT '{{}}',
                current_music TEXT DEFAULT 'default',
                game_speed INTEGER DEFAULT 1,
                day_count INTEGER DEFAULT 1,
                time_of_day INTEGER DEFAULT 480,
                is_peak_hour INTEGER DEFAULT 0,
                auto_save INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_city_id ON {cls.TABLE_NAME}(city_id)"
        db.execute(index_sql)

    def create(self, user_id: int, city_id: int = None, game_data: str = '{}',
               current_music: str = 'default', game_speed: int = 1) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'city_id': city_id,
            'game_data': game_data,
            'current_music': current_music,
            'game_speed': game_speed,
            'day_count': 1,
            'time_of_day': 480,
            'is_peak_hour': 0,
            'auto_save': 1,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_by_user_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'user_id': user_id})

    def save_state(self, user_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'city_id', 'game_data', 'current_music', 'game_speed',
            'day_count', 'time_of_day', 'is_peak_hour', 'auto_save'
        ]}
        update_data['updated_at'] = now

        existing = self.get_by_user_id(user_id)
        if existing:
            return self.exec.update_by_id(existing.get('id'), update_data)
        else:
            update_data['user_id'] = user_id
            return self.exec.insert(update_data)

    def load_state(self, user_id: int) -> Optional[Dict[str, Any]]:
        state = self.get_by_user_id(user_id)
        if not state:
            return None

        return {
            'id': state.get('id'),
            'user_id': state.get('user_id'),
            'city_id': state.get('city_id'),
            'game_data': state.get('game_data'),
            'current_music': state.get('current_music'),
            'game_speed': state.get('game_speed'),
            'day_count': state.get('day_count'),
            'time_of_day': state.get('time_of_day'),
            'is_peak_hour': state.get('is_peak_hour'),
            'auto_save': state.get('auto_save'),
            'created_at': state.get('created_at'),
            'updated_at': state.get('updated_at')
        }

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_speed_text(self, speed: int) -> str:
        speed_map = {
            self.SPEED_NORMAL: '正常',
            self.SPEED_FAST: '快速',
            self.SPEED_ULTRA: '极速'
        }
        return speed_map.get(speed, '未知')
