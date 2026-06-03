from datetime import datetime
from typing import Dict, Any, List, Optional
from app.common.sqlite.db import get_db
from app.common.sqlite.orm_query import ORMQuery
from app.common.sqlite.orm_exec import ORMExec


class ScRaceModel:
    TABLE_NAME = 'tb_sc_model_races'

    TRACK_OVAL = 'oval'
    TRACK_ROAD = 'road'
    TRACK_STREET = 'street'
    TRACK_DIRT = 'dirt'

    STATUS_UPCOMING = 'upcoming'
    STATUS_ONGOING = 'ongoing'
    STATUS_COMPLETED = 'completed'

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
                track_type TEXT NOT NULL DEFAULT 'road',
                difficulty INTEGER DEFAULT 1,
                min_level INTEGER DEFAULT 1,
                entry_fee INTEGER DEFAULT 0,
                prize_pool INTEGER DEFAULT 0,
                max_participants INTEGER DEFAULT 20,
                race_date TIMESTAMP,
                status TEXT NOT NULL DEFAULT 'upcoming',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        db.execute(sql)

        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_status ON {cls.TABLE_NAME}(status)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_race_date ON {cls.TABLE_NAME}(race_date)"
        db.execute(index_sql)
        index_sql = f"CREATE INDEX IF NOT EXISTS idx_{cls.TABLE_NAME}_track_type ON {cls.TABLE_NAME}(track_type)"
        db.execute(index_sql)

    def create(self, name: str, track_type: str, race_date: str, description: str = '',
               difficulty: int = 1, min_level: int = 1, entry_fee: int = 0,
               prize_pool: int = 0, max_participants: int = 20) -> int:
        now = datetime.now().isoformat()
        data = {
            'name': name,
            'description': description,
            'track_type': track_type,
            'difficulty': difficulty,
            'min_level': min_level,
            'entry_fee': entry_fee,
            'prize_pool': prize_pool,
            'max_participants': max_participants,
            'race_date': race_date,
            'status': self.STATUS_UPCOMING,
            'created_at': now
        }
        return self.exec.insert(data)

    def get_by_id(self, record_id: int) -> Optional[Dict[str, Any]]:
        return self.query.find_by_id(record_id)

    def get_all(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, order_by='race_date DESC')

    def get_upcoming(self, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': self.STATUS_UPCOMING}, order_by='race_date ASC')

    def get_by_status(self, status: str, page: int = 1, page_size: int = 10) -> Dict[str, Any]:
        return self.query.paginate(page, page_size, {'status': status}, order_by='race_date DESC')

    def update_status(self, record_id: int, status: str) -> int:
        data = {
            'status': status
        }
        return self.exec.update_by_id(record_id, data)

    def update(self, record_id: int, data: Dict[str, Any]) -> int:
        update_data = {k: v for k, v in data.items() if k in [
            'name', 'description', 'track_type', 'difficulty', 'min_level',
            'entry_fee', 'prize_pool', 'max_participants', 'race_date', 'status'
        ]}
        return self.exec.update_by_id(record_id, update_data)

    def delete(self, record_id: int) -> int:
        return self.exec.delete_by_id(record_id)

    @classmethod
    def init_default_races(cls) -> int:
        instance = cls()
        existing = instance.get_all(1, 1)
        if existing.get('total', 0) > 0:
            return 0

        default_races = [
            {
                'name': '新手练习赛',
                'description': '适合新手车手的入门练习赛道',
                'track_type': cls.TRACK_ROAD,
                'difficulty': 1,
                'min_level': 1,
                'entry_fee': 0,
                'prize_pool': 1000,
                'max_participants': 10,
                'race_date': '2026-06-10T14:00:00'
            },
            {
                'name': '椭圆形赛道挑战',
                'description': '经典的椭圆形高速赛道',
                'track_type': cls.TRACK_OVAL,
                'difficulty': 2,
                'min_level': 3,
                'entry_fee': 500,
                'prize_pool': 5000,
                'max_participants': 20,
                'race_date': '2026-06-15T10:00:00'
            },
            {
                'name': '城市街道赛',
                'description': '在城市街道中穿梭的刺激比赛',
                'track_type': cls.TRACK_STREET,
                'difficulty': 3,
                'min_level': 5,
                'entry_fee': 1000,
                'prize_pool': 10000,
                'max_participants': 15,
                'race_date': '2026-06-20T15:00:00'
            },
            {
                'name': '越野拉力赛',
                'description': '充满挑战的泥土赛道拉力赛',
                'track_type': cls.TRACK_DIRT,
                'difficulty': 4,
                'min_level': 8,
                'entry_fee': 2000,
                'prize_pool': 20000,
                'max_participants': 12,
                'race_date': '2026-06-25T09:00:00'
            },
            {
                'name': '年度冠军赛',
                'description': '最高荣誉的年度冠军争夺赛',
                'track_type': cls.TRACK_ROAD,
                'difficulty': 5,
                'min_level': 10,
                'entry_fee': 5000,
                'prize_pool': 50000,
                'max_participants': 20,
                'race_date': '2026-07-01T14:00:00'
            }
        ]

        count = 0
        for race_data in default_races:
            instance.create(**race_data)
            count += 1

        return count

    def get_track_type_text(self, track_type: str) -> str:
        track_map = {
            self.TRACK_OVAL: '椭圆形赛道',
            self.TRACK_ROAD: '公路赛道',
            self.TRACK_STREET: '街道赛道',
            self.TRACK_DIRT: '泥土赛道'
        }
        return track_map.get(track_type, '未知赛道')

    def get_status_text(self, status: str) -> str:
        status_map = {
            self.STATUS_UPCOMING: '即将开始',
            self.STATUS_ONGOING: '进行中',
            self.STATUS_COMPLETED: '已结束'
        }
        return status_map.get(status, '未知状态')
