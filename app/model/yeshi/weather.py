from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec
import random


class WeatherModel:
    TABLE_NAME = 'tb_yeshi_model_weather'
    
    WEATHER_TYPES = {
        'sunny': {'name': '晴天', 'icon': '☀️', 'customer_modifier': 1.0, 'description': '阳光明媚，适合出门'},
        'cloudy': {'name': '多云', 'icon': '⛅', 'customer_modifier': 0.9, 'description': '阴天，客流量一般'},
        'rainy': {'name': '下雨', 'icon': '🌧️', 'customer_modifier': 0.6, 'description': '下雨了，客人变少了'},
        'stormy': {'name': '暴雨', 'icon': '⛈️', 'customer_modifier': 0.3, 'description': '暴雨来袭，客人稀少'},
        'hot': {'name': '炎热', 'icon': '🔥', 'customer_modifier': 0.8, 'description': '天气太热，冰品畅销'},
        'cool': {'name': '凉爽', 'icon': '🍃', 'customer_modifier': 1.2, 'description': '天气凉爽，适合逛夜市'},
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
                game_user_id INTEGER NOT NULL,
                weather_type TEXT NOT NULL,
                duration_hours INTEGER DEFAULT 1,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)
        
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_user_id ON {cls.TABLE_NAME}(game_user_id)"
        db.execute(index_sql)

    def create(self, game_user_id: int, weather_type: str, duration_hours: int = 1) -> int:
        now = datetime.now()
        ended_at = (now + timedelta(hours=duration_hours)).isoformat()
        data = {
            'game_user_id': game_user_id,
            'weather_type': weather_type,
            'duration_hours': duration_hours,
            'started_at': now.isoformat(),
            'ended_at': ended_at,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat()
        }
        return self.exec.insert(data)

    def get_current_weather(self, game_user_id: int) -> Optional[Dict[str, Any]]:
        now = datetime.now().isoformat()
        sql = f"""
            SELECT * FROM {self.TABLE_NAME} 
            WHERE game_user_id = ? AND ended_at > ? 
            ORDER BY started_at DESC LIMIT 1
        """
        weather = self.db.fetch_one(sql, (game_user_id, now))
        if weather:
            weather_info = self.WEATHER_TYPES.get(weather['weather_type'], {})
            weather.update(weather_info)
        return weather

    def generate_new_weather(self, game_user_id: int, force_change: bool = False) -> Dict[str, Any]:
        current = self.get_current_weather(game_user_id)
        
        if current and not force_change:
            return {
                'changed': False,
                'weather': current
            }
        
        weather_list = list(self.WEATHER_TYPES.keys())
        weights = [30, 25, 15, 5, 10, 15]
        
        if force_change and current:
            current_type = current.get('weather_type')
            idx = weather_list.index(current_type)
            if idx >= 0:
                weather_list = [w for w in weather_list if w != current_type]
                weights = [weights[i] for i in range(len(weights)) if i != idx]
        
        new_weather = random.choices(weather_list, weights=weights, k=1)[0]
        
        duration = random.randint(1, 4)
        weather_id = self.create(game_user_id, new_weather, duration)
        
        weather_info = self.get_current_weather(game_user_id)
        
        return {
            'changed': True,
            'weather': weather_info,
            'weather_id': weather_id
        }

    def get_weather_info(self, weather_type: str) -> Dict[str, Any]:
        return self.WEATHER_TYPES.get(weather_type, {})

    def get_customer_modifier(self, game_user_id: int) -> float:
        weather = self.get_current_weather(game_user_id)
        if weather:
            return weather.get('customer_modifier', 1.0)
        return 1.0

    def get_all_weather_types(self) -> Dict[str, Dict[str, Any]]:
        return self.WEATHER_TYPES

    def get_recent_weather(self, game_user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        records = self.query.find_all(
            {'game_user_id': game_user_id},
            order_by='started_at DESC',
            limit=limit
        )
        for record in records:
            info = self.WEATHER_TYPES.get(record['weather_type'], {})
            record.update(info)
        return records

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)
