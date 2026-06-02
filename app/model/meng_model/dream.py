from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class DreamModel:
    TABLE_NAME = 'tb_meng_model_dreams'

    IS_PRIVATE = 0
    IS_PUBLIC = 1

    WEATHER_SUNNY = 'sunny'
    WEATHER_CLOUDY = 'cloudy'
    WEATHER_RAIN = 'rain'
    WEATHER_SNOW = 'snow'
    WEATHER_FOG = 'fog'

    TIME_DAWN = 'dawn'
    TIME_DAY = 'day'
    TIME_DUSK = 'dusk'
    TIME_SUNSET = 'sunset'
    TIME_NIGHT = 'night'

    NOT_DELETED = 0
    IS_DELETED = 1

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
                description TEXT DEFAULT '',
                thumbnail TEXT DEFAULT '',
                is_public INTEGER DEFAULT 0,
                like_count INTEGER DEFAULT 0,
                visit_count INTEGER DEFAULT 0,
                gravity REAL DEFAULT 1.0,
                weather TEXT DEFAULT 'sunny',
                time_of_day TEXT DEFAULT 'day',
                spawn_x REAL DEFAULT 0,
                spawn_y REAL DEFAULT 0,
                spawn_z REAL DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(user_id)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_public ON {cls.TABLE_NAME}(is_public)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_is_deleted ON {cls.TABLE_NAME}(is_deleted)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_weather ON {cls.TABLE_NAME}(weather)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_time_of_day ON {cls.TABLE_NAME}(time_of_day)"
        db.execute(index_sql)

    def create(self, user_id: int, name: str, description: str = '', thumbnail: str = '',
               is_public: int = 0, gravity: float = 1.0, weather: str = 'sunny',
               time_of_day: str = 'day', spawn_x: float = 0, spawn_y: float = 0,
               spawn_z: float = 0) -> int:
        now = datetime.now().isoformat()
        data = {
            'user_id': user_id,
            'name': name,
            'description': description,
            'thumbnail': thumbnail,
            'is_public': is_public,
            'like_count': 0,
            'visit_count': 0,
            'gravity': gravity,
            'weather': weather,
            'time_of_day': time_of_day,
            'spawn_x': spawn_x,
            'spawn_y': spawn_y,
            'spawn_z': spawn_z,
            'is_deleted': self.NOT_DELETED,
            'created_at': now,
            'updated_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int, include_deleted: bool = False) -> Optional[Dict[str, Any]]:
        conditions = {'id': record_id}
        if not include_deleted:
            conditions['is_deleted'] = self.NOT_DELETED
        return self.query.find_one(conditions)

    def get_by_user(self, user_id: int, page: int = 1, page_size: int = 10,
                    include_deleted: bool = False) -> Dict[str, Any]:
        conditions = {'user_id': user_id}
        if not include_deleted:
            conditions['is_deleted'] = self.NOT_DELETED
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def get_public_list(self, page: int = 1, page_size: int = 10,
                        weather: str = None, time_of_day: str = None) -> Dict[str, Any]:
        conditions = {
            'is_public': self.IS_PUBLIC,
            'is_deleted': self.NOT_DELETED
        }
        if weather:
            conditions['weather'] = weather
        if time_of_day:
            conditions['time_of_day'] = time_of_day
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        now = datetime.now().isoformat()
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'thumbnail', 'is_public', 'gravity',
            'weather', 'time_of_day', 'spawn_x', 'spawn_y', 'spawn_z'
        ]}
        update_data['updated_at'] = now
        return self.exec.update_by_id(record_id, update_data)

    def update_visit_count(self, record_id: int) -> int:
        dream = self.get_by_id(record_id)
        if not dream:
            return 0
        new_count = dream.get('visit_count', 0) + 1
        now = datetime.now().isoformat()
        data = {
            'visit_count': new_count,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def update_like_count(self, record_id: int, delta: int = 1) -> int:
        dream = self.get_by_id(record_id)
        if not dream:
            return 0
        new_count = max(0, dream.get('like_count', 0) + delta)
        now = datetime.now().isoformat()
        data = {
            'like_count': new_count,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def delete(self, record_id: int) -> int:
        now = datetime.now().isoformat()
        data = {
            'is_deleted': self.IS_DELETED,
            'updated_at': now
        }
        return self.exec.update_by_id(record_id, data)

    def permanent_delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10,
                is_public: int = None, is_deleted: int = None) -> Dict[str, Any]:
        conditions = {}
        if is_public is not None:
            conditions['is_public'] = is_public
        if is_deleted is not None:
            conditions['is_deleted'] = is_deleted
        return self.query.paginate(page, page_size, conditions, order_by='id DESC')

    def search(self, keyword: str, page: int = 1, page_size: int = 10,
               is_public: int = None, user_id: int = None) -> Dict[str, Any]:
        offset = (page - 1) * page_size

        where_clauses = ["is_deleted = ?"]
        params = [self.NOT_DELETED]

        if is_public is not None:
            where_clauses.append("is_public = ?")
            params.append(is_public)

        if user_id is not None:
            where_clauses.append("user_id = ?")
            params.append(user_id)

        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        like_pattern = f"%{keyword}%"
        params.extend([like_pattern, like_pattern])

        count_sql = f"SELECT COUNT(*) as total FROM {self.TABLE_NAME} WHERE {' AND '.join(where_clauses)}"
        total_result = self.db.fetch_one(count_sql, tuple(params))
        total = total_result['total'] if total_result else 0

        select_sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE {' AND '.join(where_clauses)} 
            ORDER BY id DESC 
            LIMIT {page_size} OFFSET {offset}
        """
        items = self.db.fetch_all(select_sql, tuple(params))

        return {
            'items': items,
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }

    def to_dict(self, dream: Dict[str, Any]) -> Dict[str, Any]:
        if not dream:
            return {}
        return {
            'id': dream.get('id'),
            'user_id': dream.get('user_id'),
            'name': dream.get('name'),
            'description': dream.get('description'),
            'thumbnail': dream.get('thumbnail'),
            'is_public': dream.get('is_public'),
            'is_public_text': self.get_is_public_text(dream.get('is_public')),
            'like_count': dream.get('like_count'),
            'visit_count': dream.get('visit_count'),
            'gravity': dream.get('gravity'),
            'weather': dream.get('weather'),
            'weather_text': self.get_weather_text(dream.get('weather')),
            'time_of_day': dream.get('time_of_day'),
            'time_of_day_text': self.get_time_of_day_text(dream.get('time_of_day')),
            'spawn_x': dream.get('spawn_x'),
            'spawn_y': dream.get('spawn_y'),
            'spawn_z': dream.get('spawn_z'),
            'is_deleted': dream.get('is_deleted'),
            'created_at': dream.get('created_at'),
            'updated_at': dream.get('updated_at')
        }

    def init_default_dream(self, user_id: int) -> int:
        existing_dreams = self.get_by_user(user_id, page_size=1)
        if existing_dreams.get('total', 0) > 0:
            return 0

        return self.create(
            user_id=user_id,
            name='初始梦境',
            description='这是你的第一个梦境，在这里开始你的冒险吧！',
            thumbnail='',
            is_public=self.IS_PRIVATE,
            gravity=1.0,
            weather=self.WEATHER_SUNNY,
            time_of_day=self.TIME_DAY,
            spawn_x=0,
            spawn_y=0,
            spawn_z=0
        )

    def get_is_public_text(self, is_public: int) -> str:
        status_map = {
            self.IS_PRIVATE: '私有',
            self.IS_PUBLIC: '公开'
        }
        return status_map.get(is_public, '未知')

    def get_weather_text(self, weather: str) -> str:
        weather_map = {
            self.WEATHER_SUNNY: '晴天',
            self.WEATHER_CLOUDY: '多云',
            self.WEATHER_RAIN: '雨天',
            self.WEATHER_SNOW: '雪天',
            self.WEATHER_FOG: '雾天'
        }
        return weather_map.get(weather, '未知')

    def get_time_of_day_text(self, time_of_day: str) -> str:
        time_map = {
            self.TIME_DAWN: '黎明',
            self.TIME_DAY: '白天',
            self.TIME_DUSK: '黄昏',
            self.TIME_SUNSET: '日落',
            self.TIME_NIGHT: '夜晚'
        }
        return time_map.get(time_of_day, '未知')
