from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class TieluTrackConfigModel:
    TABLE_NAME = 'tb_tielu_track_config'

    DEFAULT_TRACKS = [
        {'name': '普通轨道', 'emoji': '🛤️', 'price_per_km': 50, 'max_speed': 80, 'min_level': 1, 
         'description': '基础轨道，适合低速列车'},
        {'name': '高速轨道', 'emoji': '🚄', 'price_per_km': 150, 'max_speed': 160, 'min_level': 5, 
         'description': '可支持高速列车行驶'},
        {'name': '电气化轨道', 'emoji': '⚡', 'price_per_km': 300, 'max_speed': 250, 'min_level': 10, 
         'description': '支持电力机车和磁悬浮，极速体验'},
    ]

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
                name TEXT NOT NULL UNIQUE,
                emoji TEXT DEFAULT '',
                price_per_km INTEGER DEFAULT 0,
                max_speed INTEGER DEFAULT 0,
                min_level INTEGER DEFAULT 1,
                description TEXT DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_name ON {cls.TABLE_NAME}(name)"
        db.execute(index_sql)

    @classmethod
    def init_default_data(cls):
        model = TieluTrackConfigModel()
        existing = model.query.count()
        if existing > 0:
            return

        now = datetime.now().isoformat()
        tracks_data = []
        for track in cls.DEFAULT_TRACKS:
            tracks_data.append({
                'name': track['name'],
                'emoji': track['emoji'],
                'price_per_km': track['price_per_km'],
                'max_speed': track['max_speed'],
                'min_level': track['min_level'],
                'description': track['description'],
                'created_at': now
            })

        model.exec.insert_many(tracks_data)

    def get_all(self) -> List[Dict[str, Any]]:
        return self.query.find_all(order_by='min_level ASC')

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        return self.query.find_one({'name': name})

    def get_available_for_level(self, level: int) -> List[Dict[str, Any]]:
        all_tracks = self.get_all()
        return [t for t in all_tracks if t.get('min_level', 1) <= level]

    def to_public_dict(self, track: Dict[str, Any]) -> Dict[str, Any]:
        return {
            'id': track.get('id'),
            'name': track.get('name'),
            'emoji': track.get('emoji'),
            'price_per_km': track.get('price_per_km'),
            'max_speed': track.get('max_speed'),
            'min_level': track.get('min_level'),
            'description': track.get('description')
        }
